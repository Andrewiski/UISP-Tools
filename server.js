'use strict';

const http = require('http');
const https = require('https');
const debug = require('debug')('server');
const path = require('path');
const extend = require('extend');
const express = require('express');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');

const fs = require('fs');
const uuidv4 = require('uuid/v4');
const Deferred = require('node-promise').defer;
const moment = require('moment');
const crypto = require('crypto');
const fileUpload = require('express-fileupload');
const packagejson = require('./package.json');
const version = packagejson.version;
const os = require('os');
const AdmZip = require('adm-zip');
const util = require('util');
const ACMECert = require('./acmeCertificateManager');
const ACMEHttp01 = require('./acme-http-01-memory.js');
const OpenSSL = require('./openssl.js');
const ConfigHandler = require("./configHandler.js");
const Logger = require("./logger.js");
const ioServer = require('socket.io');
const UispApiRequestHandler = require("./uispApiRequestHandler.js");
const DeuiApiRequestHandler = require("./deuiApiRequestHandler.js");


var configFileOptions = {
    "configDirectory": "config",
    "configFileName": "config.json"
}
if (process.env.localDebug === 'true') {
    console.log("localDebug is enabled")
    configFileOptions.configDirectory = "config/localDebug"
}
var defaultConfig = {
    "configDirectory": configFileOptions.configDirectory,
    "mongoDbServerUrl": "mongodb://Username:Password@ServerHostName:27017?connectTimeoutMS=300000&authSource=DatabaseName",
    "mongoDbDatabaseName": "DatabaseName",
    "logDirectory": "logs",
    "adminRoute": "/admin",
    "logLevel": "info",
    "useHttp": true,
    "useHttps": false,
    "httpport": 49080,
    "httpsport": 49443,
    "adminUsername": "admin",
    "adminPasswordHash": "25d5241c69a02505c7440e2b4fa7804c",  //  DEToolsPassword
    "httpsServerKey": "server.key",
    "httpsServerCert": "server.cert",
    "unmsUrl": "https://uisp.example.com/nms/api/v2.1/",
    "ucrmUrl": "https://uisp.example.com/crm/api/v1.0/",
    "ucrmAppKey": "CreateAppKeyFromUISPWebSite",
    "opensslPath": "",
    "rejectUnauthorized": false
};



var configHandler = new ConfigHandler(configFileOptions, defaultConfig);
//let hash = crypto.createHash('md5').update('DEToolsPassword').digest("hex");
//console.log('hash ' + hash);

var objOptions = configHandler.getConfig();
var configFolder = objOptions.configDirectory;
var certificatesFolder = path.join(objOptions.configDirectory, 'certificates');
var opensslConfigFolder = path.join(certificatesFolder, 'opensslConfig');

if (objOptions.opensslPath.startsWith('./') === true) {
    objOptions.opensslPath = path.join(__dirname, objOptions.opensslPath.substring(1));
}

var openssl = new OpenSSL({ "opensslPath": objOptions.opensslPath });

var uispApiRequestHandler = new UispApiRequestHandler({
    ucrmUrl: objOptions.ucrmUrl,
    ucrmAppKey: objOptions.ucrmAppKey,
    unmsUrl: objOptions.unmsUrl,
    rejectUnauthorized : objOptions.rejectUnauthorized
});

var deuiApiRequestHandler = new DeuiApiRequestHandler({
    mongoDbServerUrl: objOptions.mongoDbServerUrl,
    mongoDbDatabaseName: objOptions.mongoDbDatabaseName
});






var appLogHandler = function (logData) {
    //add to the top of the
    privateData.logs.push(logData);

    if (privateData.logs.length > objOptions.maxLogLength) {
        privateData.logs.shift();
    }
    var debugArgs = [];
    //debugArgs.push(logData.timestamp);
    debugArgs.push(logData.logLevel);
    for (let i = 0; i < logData.args.length; i ++) {
        debugArgs.push(logData.args[i]);
    }
    debug(appLogger.arrayPrint(debugArgs));
}

var appLogger = new Logger({
    logLevel: objOptions.logLevel,
    logName: "UispTools",
    logEventHandler: appLogHandler,
    logFolder: objOptions.logDirectory
})


var startupReady = Deferred();
var app = express();

var commonData = {
    logins: {},
    startupStats: {
        startupDate: new Date(),
        nodeVersion: process.version,
        nodeVersions: process.versions,
        platform: process.platform,
        arch: process.arch  
    },
    serverCertificates: null
    
};

var privateData = {
    logs: [],
    browserSockets: {}
};



var acmeNotify = function (ev, msg) {
    let data = null;
    let message = '';
    if (isObject(msg)) {
        data = msg;
        message = ev;
    } else {
        message = msg;
    }
    if (ev === 'error' || ev === 'warning') {
        writeToLog(ev, 'Acme', msg || '');
        if (io) {
            io.emit('createLetsEncrypt', { status: 'progress', success: false, error: ev, msg: message || '', data: data });
        }
    } else {
        writeToLog('info', 'Acme', ev || '', msg || '');
        if (io) {
            io.emit('createLetsEncrypt', { status: 'progress', success: false, error: null, msg: message || '', data: data });
        }
    }

};
var acmehttp01 = ACMEHttp01.create();
var acmeCertificateManagerOptions = extend({}, objOptions.acmeCertificateManagerOptions);
acmeCertificateManagerOptions.http01 = acmehttp01;
acmeCertificateManagerOptions.notify = acmeNotify;
acmeCertificateManagerOptions.retryInterval = 15000;
acmeCertificateManagerOptions.deauthWait = 30000;
acmeCertificateManagerOptions.retryPoll = 10;
acmeCertificateManagerOptions.retryPending = 10;
acmeCertificateManagerOptions.debug = true;
var acmeCert = ACMECert.create(acmeCertificateManagerOptions);


var getConnectionInfo = function (req) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) === "::ffff:") {
        ip = ip.substr(7);
    }
    var port = req.connection.remotePort;
    var ua = req.headers['user-agent'];
    return { ip: ip, port: port, ua: ua };
};

var getSocketInfo = function (socket) {
    var ip = socket.handshake.headers['x-forwarded-for'] || socket.conn.remoteAddress;
    if (ip.substr && ip.substr(0, 7) === "::ffff:") {
        ip = ip.substr(7);
    }

    return { ip: ip };
};

//config public files are used before public folder files to allow overwrite.

if(fs.existsSync(path.join(__dirname, objOptions.configDirectory, 'public'))){
    app.use(express.static(path.join(__dirname, objOptions.configDirectory, 'public')));
}

app.use(express.static(path.join(__dirname, 'public')));


// disable the x-power-by express message in the header
app.disable('x-powered-by');


// only excludes root folders and files will need to change logic to exclude subfolder but can exclude using sparce-checkout file so git never gets them.
var excludedFileNames = [];
var excludedFolders = [];

var addAllFolderFilesToZip = function (folderpath, filename, zip) {
    if (filename !== null) {
        folderpath = path.join(folderpath, filename);
    }
    var files = fs.readdirSync(folderpath);

    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        // add local file
        try {
            if (fs.lstatSync(path.join(folderpath, file)).isFile()) {
                if (excludedFileNames.includes(file) === false) {
                    zip.addLocalFile(path.join(folderpath, file));
                }
                //appLogger.log("added file to zip " + path.join(folderpath, file) );
            } else {
                if (fs.lstatSync(path.join(folderpath, file)).isDirectory()) {
                    if (excludedFolders.includes(file) === false) {
                        zip.addLocalFolder(path.join(folderpath, file), file);
                    }
                }
            }
        } catch (ex) {
            appLogger.log("error", "addAllFolderFilesToZip", "Error Adding File/Folder to Zip", path.join(folderpath, file));
        }
    });
};



if (fs.existsSync(path.join(__dirname, 'logs')) === false) {
    fs.mkdirSync(path.join(__dirname, 'logs'));
}



function basicAuth(req, res, next) {
    // make authenticate path public
    if (req.path !== objOptions.adminRoute) {
        return next();
    }

    const realm = "UISP-TOOLS";
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        res.set('WWW-Authenticate', 'Basic realm="' + realm + '"');
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }

    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    var connInfo = getConnectionInfo(req);

    let isvalidUserPass = checkUser(username, password, connInfo.ip, true);
    if (!isvalidUserPass.success) {
        if (io) {
            io.emit('logins', commonData.logins);
        }
        if (!isvalidUserPass.isAccountLocked) {
            res.set('WWW-Authenticate', 'Basic realm="' + realm + '"');
        }
        return res.status(401).json(isvalidUserPass);
    }

    // attach user to request object
    req.user = username;

    next();
}

function checkUser(username, password, ipAddress, resetLoginFailedIfSuccess) {
    const accountLockFailedAttempts = 5;
    const accountLockMinutes = 5;
    let passwordHash = crypto.createHash('md5').update(password).digest("hex");
    let isvalidUserPass = username.toLowerCase() === objOptions.adminUsername.toLowerCase() && passwordHash === objOptions.adminPasswordHash;
    let msg = "success";
    let isAccountLocked = false;
    if (username.toLowerCase() !== objOptions.adminUsername.toLowerCase()) {
        appLogger.log('warning', 'login', 'Invalid username ', username);
        msg = "Invalid Username/Password";
    }

    //prevent Brute Force
    if (commonData.logins[username.toLowerCase()] && commonData.logins[username.toLowerCase()].ipaddresses[ipAddress] && commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginCount > accountLockFailedAttempts && moment().diff(commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginTimeStamp, 'minutes') < accountLockMinutes) {

        isAccountLocked = true;
    }
    if (commonData.logins[username.toLowerCase()] === undefined) {
        commonData.logins[username.toLowerCase()] = {
            ipaddresses: {}
        };
    }
    if (commonData.logins[username.toLowerCase()].ipaddresses[ipAddress] === undefined) {
        commonData.logins[username.toLowerCase()].ipaddresses[ipAddress] = {
            failedLoginCount: 0
        };
    }
    if ((isvalidUserPass === false || isAccountLocked === true) && username.toLowerCase() === objOptions.adminUsername.toLowerCase()) {
        commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginTimeStamp = moment();
        commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginCount++;


        if (isAccountLocked === true) {
            msg = "User Account is locked for " + accountLockMinutes.toString() + " minutes";
        } else {
            msg = "Invalid Username/Password";
        }
        appLogger.log('warning', 'login', msg, "username:" + username + ", ip:" + ipAddress + ", isAccountLocked:" + isAccountLocked);
    } else {
        msg = "success";
        if (resetLoginFailedIfSuccess === true) {
            commonData.logins[username.toLowerCase()].ipaddresses[ipAddress].failedLoginCount = 0;
        }
    }

    return { success: isvalidUserPass && !isAccountLocked, username: username, msg: msg, isAccountLocked: isAccountLocked };
}

app.use(basicAuth);

//This function will get called on every request and if useHttpsClientCertAuth is turned on only allow request with a client cert
app.use(function (req, res, next) {
    var connInfo = getConnectionInfo(req);
    appLogger.log('info', "browser", "path:" + req.path + ", ip:" + connInfo.ip + ", port:" + connInfo.port + ", ua:" + connInfo.ua);
    next();
    return;
})

// not needed already served up by io app.use('/javascript/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'node_modules', 'socket.io-client', 'dist')));
app.use('/javascript/fontawesome', express.static(path.join(__dirname, 'node_modules', 'font-awesome')));
app.use('/javascript/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/javascript/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use('/javascript/moment', express.static(path.join(__dirname, 'node_modules', 'moment', 'min')));
app.use('/javascript/bootstrap-notify', express.static(path.join(__dirname, 'node_modules', 'bootstrap-notify')));
app.use('/javascript/animate-css', express.static(path.join(__dirname, 'node_modules', 'animate.css')));
app.use('/javascript/jsoneditor', express.static(path.join(__dirname, 'node_modules', 'jsoneditor', 'dist')));
if(fs.existsSync(path.join(__dirname,configFolder, '/public/images', 'favicon.ico' ))){
    app.use(favicon(path.join(__dirname,configFolder, '/public/images', 'favicon.ico' )));
}
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }
}));

var routes = express.Router();



var handleError = function (req,res, error) {
    let msg = "An Error Occured!";
    if (error.msg) {
        msg = msg + ' ' + error.msg;
    }
    if (error.message) {
        msg = msg + ' ' + error.message;
    }
    let errMsg = "";    
    let errStack = "";
    if (error.error) {
        if (typeof (error.error) === "string") {
            errMsg = error.error;
        } else {
            if (error.error.msg) {
                errMsg = error.error.msg;
            } else if (error.error.message) {
                errMsg = error.error.message;
            }
            if (error.error.stack) {
                errStack = error.error.stack;
            }
        }
    } 
    
    let statuscode = 500;
    if (error.code) {
        statuscode = error.code;
    } else if (error.statuscode) {
        statuscode = error.statuscode;
    }
    res.status(statuscode).json({ "msg": msg, "error": errMsg, "stack": errStack });
};

var handlePublicFileRequest = function (req, res) {
    var filePath = req.path;

    if (filePath === "/") {
        filePath = "/index.htm";
    }
    console.log('handlePublicFileRequest ' + filePath + ' ...');

    //var extname = path.extname(filePath);
    //var contentType = 'text/html';
    //switch (extname) {
    //    case '.js':
    //        contentType = 'text/javascript';
    //        break;
    //    case '.css':
    //        contentType = 'text/css';
    //        break;
    //    case '.json':
    //        contentType = 'application/json';
    //        break;
    //    case '.png':
    //        contentType = 'image/png';
    //        break;
    //    case '.jpg':
    //        contentType = 'image/jpg';
    //        break;
    //    case '.wav':
    //        contentType = 'audio/wav';
    //        break;
    //    case ".ico":
    //        contentType = "image/x-icon";
    //        break;
    //    case ".zip":
    //        contentType = "application/x-zip";
    //        break;
    //    case ".gz":
    //        contentType = "application/x-gzip";
    //        break;

    //}

    if (fs.existsSync(path.join(__dirname, 'public',filePath)) === true) {
        res.sendFile(filePath, { root: path.join(__dirname, 'public') });  
    } else {
        filePath = "/index.htm";
        res.sendFile(filePath, { root: path.join(__dirname, 'public') });
        //res.sendStatus(404);
    }
    
    

    //fs.readFile(filePath, function (error, content) {
    //    if (error) {
    //        console.log('Error ', error);
    //        if (error.code == 'ENOENT') {
    //            response.writeHead(404, { 'Content-Type': 'text/plain' });
    //            response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
    //        }
    //        else {
    //            response.writeHead(500, { 'Content-Type': 'text/plain' });
    //            response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
    //        }
    //    }
    //    else {
    //        response.writeHead(200, { 'Content-Type': contentType });
    //        response.end(content, 'utf-8');
    //    }
    //});
};


//Login Unms
routes.post('/login/loginNms', function (req, res) {
    var loginData = {};
    uispApiRequestHandler.publicLoginNms(req.body).then(
        function (data) {
            try {
                res.json(data);
            } catch (ex) {
                res.status(500).json(getErrorObject({ "msg": "An Error Occured!", "error": ex }));
            }
        },
        function (error) {
            handleError(req,res,error);
        }
    );
});

//Login Unms
routes.post('/login/loginCms', function (req, res) {
    var loginData = {};
    uispApiRequestHandler.publicLoginCrm(req.body).then(
        function (data) {
            try {
                res.json(data);
            } catch (ex) {
                res.status(500).json(getErrorObject({ "msg": "An Error Occured!", "error": ex }));
            }
        },
        function (error) {
            handleError(req, res, error);
        }
    );
});

//Login Unms Data
routes.get('/login/loginData', function (req, res) {
    var loginData = {};
    uispApiRequestHandler.publicLoginData().then(
        function (data) {
            try {
                res.json(data);
            } catch (ex) {
                res.status(500).json({ "msg": "An Error Occured!", "error": ex });
            }
        },
        function (error) {
            res.status(500).json({ "msg": "An Error Occured!", "error": error });
        }
    );
})



//Login Unms
routes.post('/login/login', function (req, res) {
    var loginData = {};
    uispApiRequestHandler.publicLoginUnms(req.body).then(
        function (data) {
            try {
                res.json(data);
            } catch (ex) {
                res.status(500).json(getErrorObject({ "msg": "An Error Occured!", "error": ex }));
            }
        },
        function (error) {
            handleError(req, res, error);
        }
    );
});

//Login Unms Data
routes.get('/login/loginData', function (req, res) {
    var loginData = {};
    uispApiRequestHandler.publicLoginData().then(
        function (data) {
            try {
                res.json(data);
            } catch (ex) {
                res.status(500).json({ "msg": "An Error Occured!", "error": ex });
            }
        },
        function (error) {
            res.status(500).json({ "msg": "An Error Occured!", "error": error });
        }
    );
})


//need to add is Authed logic and Permissions check 
routes.post('/ucrm/*', function (req, res) {
    //Get ucrmData
    
    let ucrmUrl = req.path.substring("/ucrm/".length);
    uispApiRequestHandler.handleRequest({ url: ucrmUrl }).then(
        function (data) {
            res.json(data);
        },
        function (error) {
            res.status(500).json({ "msg": "An Error Occured!", "error": error });
        }
    );
});

//need to add is Authed logic and Permissions check 
routes.get('/ucrm/*', function (req, res) {
    //Get ucrmData
    
    let ucrmUrl = req.path.substring("/ucrm/".length);
    uispApiRequestHandler.handleRequest({ url: ucrmUrl }).then(
        function (data) {
            res.json(data);
        },
        function (error) {
            res.status(500).json({ "msg": "An Error Occured!", "error": error });
        }
    );
});

deuiApiRequestHandler.bindRoutes(routes);




//routes.get('/', function (req, res) {
//    var connInfo = getConnectionInfo(req);
//    res.end();
//    appLogger.log('info', "browser", "path:" + req.path + ", ip:" + connInfo.ip + ", port:" + connInfo.port + ", ua:" + connInfo.ua);
//});


routes.post('/certificateUpload', function (req, res) {
    //Route that the Https Certs are uploaded to
    try {
        if (!req.files) {
            res.send({
                success: false,
                status: 'failed',
                message: 'No file uploaded'
            });
        } else {

            let privateKeyFile = req.files.PrivateKeyFile;
            //privateKeyFile.mv(path.join(__dirname, options.httpsServerKey));

            let publicCertFile = req.files.PublicCertFile;
            //publicCertFile.mv(path.join(__dirname, options.httpsServerCert));

            acme.loadX509PublicCert({ publicCertFile: publicCertFile.data, privateKeyFile: privateKeyFile.data }).then(
                function (certs) {
                    try {
                        if (certs) {

                            var hasValidPrivateKey = false;
                            certs.forEach(function (cert) {
                                if (cert.privateKeyValid) {
                                    hasValidPrivateKey = true;
                                }
                            });

                            if (hasValidPrivateKey === true) {
                                if (fs.existsSync(path.join(__dirname, objOptions.httpsServerKey))) {
                                    if (fs.existsSync(path.join(__dirname, path.dirname(objOptions.httpsServerKey), 'backups')) === false) {
                                        fs.mkdirSync(path.join(__dirname, path.dirname(objOptions.httpsServerKey), 'backups'));
                                    }
                                    fs.copyFileSync(path.join(__dirname, objOptions.httpsServerKey), path.join(__dirname, path.dirname(objOptions.httpsServerKey), 'backups', moment().format("YYYYMMDDhhmmss") + '_' + path.basename(objOptions.httpsServerKey)));
                                }

                                if (fs.existsSync(path.join(__dirname, objOptions.httpsServerCert))) {
                                    if (fs.existsSync(path.join(__dirname, path.dirname(objOptions.httpsServerCert), 'backups')) === false) {
                                        fs.mkdirSync(path.join(__dirname, path.dirname(objOptions.httpsServerCert), 'backups'));
                                    }
                                    fs.copyFileSync(path.join(__dirname, objOptions.httpsServerCert), path.join(__dirname, path.dirname(objOptions.httpsServerCert), 'backups', moment().format("YYYYMMDDhhmmss") + '_' + path.basename(objOptions.httpsServerCert)));
                                }
                                fs.writeFileSync(path.join(__dirname, objOptions.httpsServerKey), privateKeyFile.data);
                                fs.writeFileSync(path.join(__dirname, objOptions.httpsServerCert), publicCertFile.data);
                                //send response
                                res.send({
                                    success: true,
                                    status: "complete",
                                    message: 'Certificate Files uploaded',
                                    data: {
                                        privateKeyFile:
                                        {
                                            name: privateKeyFile.name,
                                            mimetype: privateKeyFile.mimetype,
                                            size: privateKeyFile.size
                                        },
                                        publicCertFile:
                                        {
                                            name: publicCertFile.name,
                                            mimetype: publicCertFile.mimetype,
                                            size: publicCertFile.size
                                        }
                                    }
                                });
                                //update the https server so it uses the new certs
                                updateHttpsServer();
                            } else {
                                res.send({
                                    success: false,
                                    status: "Error",
                                    message: 'Private Key is not valid for Certificate',
                                    data: {
                                        privateKeyFile:
                                        {
                                            name: privateKeyFile.name,
                                            mimetype: privateKeyFile.mimetype,
                                            size: privateKeyFile.size
                                        },
                                        publicCertFile:
                                        {
                                            name: publicCertFile.name,
                                            mimetype: publicCertFile.mimetype,
                                            size: publicCertFile.size
                                        }
                                    }
                                });
                            }
                        }
                    } catch (err) {
                        res.status(500).send({
                            success: false,
                            status: "Error",
                            message: err,
                            data: null
                        });
                    }
                },
                function (ev, message) {
                    res.status(500).send({
                        success: false,
                        status: ev,
                        message: message,
                        data: null
                    });
                }


            );



        }
    } catch (err) {
        res.status(500).send({
            success: false,
            status: "Error",
            message: err,
            data: null
        });
    }
});


routes.get(objOptions.adminRoute, function (req, res) {
    res.sendFile(path.join(__dirname, 'admin/admintool.htm'));
});
routes.get("/admintool.js", function (req, res) {
    res.sendFile(path.join(__dirname, 'admin/admintool.js'));
});





routes.get('/*', function (req, res) {
    handlePublicFileRequest(req, res);
});


var loadCertificates = function () {
    try {
        acmeCert.loadX509PublicCert({ publicCertFile: path.join(__dirname, configFolder, objOptions.httpsServerCert), privateKeyFile: path.join(__dirname, configFolder, objOptions.httpsServerKey) }).then(
            function (Certs) {
                try {
                    //clean up the binary data we don't need 
                    Certs.forEach(function (Cert) {
                        delete Cert.raw;
                        delete Cert.signature;
                        delete Cert.publicKey;
                        delete Cert.publicRaw;
                        delete Cert.tbsCertificate;
                    });
                    commonData.serverCertificates = Certs;

                    appLogger.log('info', 'Loaded Server Certs');
                    if (io) {
                        io.emit('serverCertificatesUpdate', Certs);
                    }
                } catch (ex2) {
                    appLogger.log('error', 'Error Loading Server Public Cert ', ex2);
                }
            },
            function (ev, msg) {
                appLogger.log('error', 'Error Loading Server Public Cert ', ev, msg);
            }
        );
    } catch (ex) {
        appLogger.log('error', 'Error Loading Certificates Exception', ex);
    }

};

app.use('/', routes);






var io = null;
//Only Wire up Admin Page and ??

io = new ioServer();

var https_srv = null;
var http_srv = null;

var getHttpsServerOptions = function () {
    //We share the https cert with both Client https and Management https
    //We share the https cert with both Client https and Management https

    var httpsOptions = {};

    if (fs.existsSync(path.join(__dirname, configFolder, objOptions.httpsServerKey)) === true && fs.existsSync(path.join(__dirname, configFolder, objOptions.httpsServerCert)) === true) {
        httpsOptions.key = fs.readFileSync(path.join(__dirname, configFolder, objOptions.httpsServerKey));
        httpsOptions.cert = fs.readFileSync(path.join(__dirname, configFolder, objOptions.httpsServerCert));
    } else {
        appLogger.log("warning", "httpsServer certificate files missing unable to use https");
    }

    return httpsOptions;
};

var startWebServers = function () {

    if (objOptions.useHttps === true) {
        try {
            let httpsOptions = getHttpsServerOptions();
            if (httpsOptions.key && httpsOptions.cert) {
                https_srv = https.createServer(getHttpsServerOptions(), app).listen(objOptions.httpsport, function () {
                    appLogger.log('info', 'Express server listening on https port ' + objOptions.httpsport);
                });
                io.attach(https_srv);
            } else {
                appLogger.log("error", "httpsServer certificate files missing unable to start https server ");
            }
        } catch (ex) {
            appLogger.log('error', 'Failed to Start Express server on https port ' + objOptions.httpsport, ex);
        }
    }


    if (objOptions.useHttp === true) {
        try {
            http_srv = http.createServer(app).listen(objOptions.httpport, function () {
                appLogger.log('info', 'Express server listening on http port ' + objOptions.httpport);
            });
            io.attach(http_srv);
        } catch (ex) {
            appLogger.log('error', 'Failed to Start Express server on http port ' + objOptions.httpport, ex);
        }
    }
};


var updateHttpsServer = function () {
    try {
        if (https_srv) {
            if (https_srv.setSecureContext) {
                https_srv.setSecureContext(getHttpsServerOptions());
            } else {
                appLogger.log("error", "https_srv.setSecureContext is null. Wrong version of Node.JS must be 12 or greater. \"node -v\"");
            }
        } else {
            appLogger.log("error", "https_srv is null. Unable to update Context");
        }
    } catch (ex) {
        appLogger.log("error", "Error Updating https server with new security context.", ex);
    }
};




// This is the socket io connections coming from the Browser pages

//io = require('socket.io')(https_srv);
io.on('connection', function (socket) {


    appLogger.log('info', 'browser', socket.id, 'Connection', getSocketInfo(socket));

    const base64Credentials = socket.conn.request.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    var validUser = checkUser(username, password, getSocketInfo(socket).ip, false);

    if (validUser.success === false) {
        socket.emit('authenticated', validUser);
        socket.disconnect();
    } else {
        socket.emit('authenticated', validUser);
        if (privateData.browserSockets[socket.id] === undefined) {
            privateData.browserSockets[socket.id] = {
                socket: socket,
                logLevel: objOptions.logLevel

            };
        }

        socket.on('ping', function (data) {
            appLogger.log('trace', 'browser', socket.id, 'ping');
        });

       

        socket.on("disconnect", function () {
            try {
                appLogger.log("info", 'browser', socket.id, "disconnect", getSocketInfo(socket));
                if (privateData.browserSockets[socket.id]) {
                    delete privateData.browserSockets[socket.id];
                }
            } catch (ex) {
                appLogger.log('error', 'Error socket on', ex);
            }
        });

        socket.on('Logs', function (data) {
            try {
                appLogger.log("info", 'browser', socket.id, "Logs");
                socket.emit('Logs', privateData.logs);
            } catch (ex) {
                appLogger.log('error', 'Error socket on', ex);
            }
        });


        socket.on('createLetsEncrypt', function (data) {
            try {
                appLogger.log("info", "browser", socket.id, "createLetsEncrypt");
                //renewServerCertificate();
            } catch (ex) {
                appLogger.log('error', 'Error socket on', ex);
            }
        });

        socket.on('loadCertificates', function (data) {
            try {
                appLogger.log("info", "browser", socket.id, "loadCertificates");
                loadCertificates();
            } catch (ex) {
                appLogger.log('error', 'Error socket on', ex);
            }
        });



        //This is a new connection, so send info to commonData
        socket.emit('commonData', commonData);
        //This is a new connection, so send them the logs
        socket.emit('serverLogs', privateData.logs);
    }
});


//if we needed to delay the web we would call this when we were ready but for now call it after when we reach this point on the script

startupReady.resolve();

var startupServer = function () {
    try {
        loadCertificates();
    } catch (ex) {
        appLogger.log('error', 'Error Loading https certificate', ex);
    }
    try {
        startWebServers();
    } catch (ex) {
        appLogger.log('error', 'Error Starting Web Servers', ex);
    }
};

//we use this defer to delay start to wait on a mongo load of data on startup to get data and keep everything in sync
var startupPromise = startupReady.promise;
startupPromise.then(startupServer);