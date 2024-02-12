'use strict';
const appLogName = "uisptools"
const http = require('http');
const https = require('https');
const path = require('path');
const extend = require('extend');
const express = require('express');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const polyfillLibrary = require('polyfill-library');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Deferred = require('node-promise').defer;
const moment = require('moment');
const crypto = require('crypto');
const fileUpload = require('express-fileupload');
const packagejson = require('./package.json');
const version = packagejson.version;
const os = require('os');
const AdmZip = require('adm-zip');
const util = require('util');
const ConfigHandler = require("@andrewiski/confighandler");
const LogUtilHelper = require("@andrewiski/logutilhelper");
const LetsEncrypt =  require('@andrewiski/letsencrypt');
const OpenSSL = require("@andrewiski/openssl");
const ioServer = require('socket.io');
const UispToolsApiHandler = require("./uispToolsApiHandler.js");
const UispToolsApiRequestHandler = require("./uispToolsApiRequestHandler.js");
const { networkInterfaces } = require('os');
const { Router } = require('express');

var configFileOptions = {
    "configDirectory": "config",
    "configFileName": "config.json"
}


var localDebug = false;
if (process.env.localDebug === 'true') {
    console.log("localDebug is enabled")
    configFileOptions.configDirectory = "config/localDebug";
    localDebug = true;
}

var defaultConfig = {
    "configDirectory": configFileOptions.configDirectory,
    "urlPrefix": "uisptools/",
    "mongoDbServerUrl": process.env.MONGODB_URL || "mongodb://uisptools:U!spT00ls!@uisptools_mongodb:27017/?connectTimeoutMS=300000&authSource=admin",
    "mongoDbDatabaseName": "uisptools",
    "logDirectory": "logs",
    "adminRoute": "/admin",
    "logLevel": "info",
    "useHttp": true,
    "useHttps": true,
    "httpport": 49080,
    "httpsport": 49443,
    "adminUsername": "admin",
    "adminPasswordHash": "01b7783d35cfcbbc957461516f337075",  //  UISPToolsPassword
    "httpsServerKey": "/usr/src/uisptools/uisp_certs/live.key",
    "httpsServerCert": "/usr/src/uisptools/uisp_certs/live.crt",
    "unmsUrl": "http://unms:8081/nms/api/v2.1/",
    "ucrmUrl": "http://ucrm:80/crm/api/v1.0/",
    "ucrmAppKey": "CreateAppKeyFromUISPWebSite",
    "opensslPath": "",
    "maxLogLength": 500,
    "rejectUnauthorized": false,
    "appLogLevels":{
        "server": {
            "app":"info"
        },
        "ucrmApiRequestHandler":{"app":"info"},
        "deApiRequestHandler":{"app":"info"}
    },
    "plugins":[
        "uisptools.testing",
        "uisptools.dfsdetect",
        "wilcowireless"
      ]
};

// let envDebug = process.env.DEBUG ;
// if (envDebug){
//     console.log ("environment DEBUG = " + envDebug )
// }else{
//     console.log ("environment DEBUG is not set" )
    
// }
// let envLocalDebug = process.env.localDebug;
// if(envLocalDebug){
//     console.log ("environment localDebug = " + envLocalDebug )
// }else{
//     console.log ("environment localDebug is not set")
// }

var configHandler = new ConfigHandler(configFileOptions, defaultConfig);
//let hash = crypto.createHash('md5').update('DEToolsPassword').digest("hex");
//console.log('hash ' + hash);

var objOptions = configHandler.config;
var configFolder = objOptions.configDirectory;
var certificatesFolder = path.join(objOptions.configDirectory, 'certificates');
var caFolder = path.join(certificatesFolder, 'ca');

var urlPrefix = objOptions.urlPrefix || "";

var httpsServerKey = null
var httpsServerCert = null; 
if(objOptions.httpsServerKey.startsWith("/") === true){
    httpsServerKey = objOptions.httpsServerKey
}else{
    httpsServerKey = path.join(__dirname, configFolder, objOptions.httpsServerKey);
}

if(objOptions.httpsServerCert.startsWith("/") === true){
    httpsServerCert = objOptions.httpsServerCert
}else{
    httpsServerCert = path.join(__dirname, configFolder, objOptions.httpsServerCert);
}

var letsEncryptCertificateFolder = path.join(certificatesFolder, 'letsEncrypt');
if(fs.existsSync(letsEncryptCertificateFolder) === false){
    fs.mkdirSync(letsEncryptCertificateFolder,{recursive:true});
    fs.mkdirSync(path.join(letsEncryptCertificateFolder, 'accounts') ,{recursive:true});
    fs.mkdirSync(path.join(letsEncryptCertificateFolder, 'backups') ,{recursive:true});
}


if (objOptions.opensslPath.startsWith('./') === true) {
    objOptions.opensslPath = path.join(__dirname, objOptions.opensslPath.substring(1));
}

var openssl = new OpenSSL({ "opensslPath": objOptions.opensslPath,
    certificatesFolder:  certificatesFolder,
    caFolder: caFolder,
    keySize: 4096, //2048
    caDomainName: "localhost",
    caPassword: null //"mycapassword"
 });

 var letsEncrypt = new LetsEncrypt( {
        certificatesFolder: letsEncryptCertificateFolder,
        accountFolder: path.join(letsEncryptCertificateFolder, 'accounts'),
        backupFolder: path.join(letsEncryptCertificateFolder, 'backups'),
        eventHandler: null,
        canRenewInDays: 30
    });

var appLogHandler = function (logData) {
    //add to the top of the log
    privateData.logs.push(logData);

    if (privateData.logs.length > objOptions.maxLogLength) {
        privateData.logs.shift();
    }
    
}

let logUtilHelper = new LogUtilHelper({
    appLogLevels: objOptions.appLogLevels,
    logEventHandler: null,
    logUnfilteredEventHandler: null,
    logFolder: objOptions.logDirectory,
    logName: appLogName,
    debugUtilEnabled: (process.env.DEBUG ? true : undefined) || false,
    debugUtilName:appLogName,
    debugUtilUseAppName:true,
    logToFile: !localDebug,
    logToFileLogLevel: objOptions.logLevel,
    logToMemoryObject: true,
    logToMemoryObjectMaxLogLength: objOptions.maxLogLength,
    logSocketConnectionName: "socketIo",
    logRequestsName: "access"

})

// var appLogger = new Logger({
//     logLevels: objOptions.logLevels,
//     debugUtilName: "uisptools",
//     logName: "UispTools",
//     logEventHandler: appLogHandler,
//     logFolder: objOptions.logDirectory
// })

var uispToolsApiHandler = new UispToolsApiHandler({
    ucrmUrl: objOptions.ucrmUrl,
    ucrmAppKey: objOptions.ucrmAppKey,
    unmsUrl: objOptions.unmsUrl,
    mongoDbServerUrl: objOptions.mongoDbServerUrl,
    mongoDbDatabaseName: objOptions.mongoDbDatabaseName,
    rejectUnauthorized : objOptions.rejectUnauthorized,
    logUtilHelper:logUtilHelper
});

var uispToolsApiRequestHandler = new UispToolsApiRequestHandler({
    logUtilHelper:logUtilHelper,
    uispToolsApiHandler:uispToolsApiHandler,
    googleApiKey: objOptions.googleApiKey
});


var startupReady = Deferred();
var app = express();

if(localDebug){
    //this will allow us to emulate the CSP set by UNMS via the NGINX server
    app.use(function(req, res, next) {
        res.setHeader("Content-Security-Policy", "default-src 'self' data: wss: *.tile.openstreetmap.org *.gstatic.com *.googleapis.com geocode.arcgis.com nominatim.openstreetmap.org sp-dir.uwn.com web.delighted.com; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' *.tile.openstreetmap.org maps.gstatic.com *.googleapis.com blog.ui.com *.svc.ui.com data:; script-src 'self' data: wss: *.tile.openstreetmap.org *.gstatic.com *.googleapis.com geocode.arcgis.com nominatim.openstreetmap.org d2yyd1h5u9mauk.cloudfront.net sp-dir.uwn.com 'sha256-VWlS8Ik7XRVhz/AxeiqW/Fz0x8ZwAlOO7KdRrOwgP0Q='");
        return next();
    });
}

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



// var acmeNotify = function (ev, msg) {
//     let data = null;
//     let message = '';
//     if (isObject(msg)) {
//         data = msg;
//         message = ev;
//     } else {
//         message = msg;
//     }
//     if (ev === 'error' || ev === 'warning') {
//         writeToLog(ev, 'Acme', msg || '');
//         if (io) {
//             io.emit('createLetsEncrypt', { status: 'progress', success: false, error: ev, msg: message || '', data: data });
//         }
//     } else {
//         writeToLog('info', 'Acme', ev || '', msg || '');
//         if (io) {
//             io.emit('createLetsEncrypt', { status: 'progress', success: false, error: null, msg: message || '', data: data });
//         }
//     }

// };
// var acmehttp01 = ACMEHttp01.create();
// var acmeCertificateManagerOptions = extend({}, objOptions.acmeCertificateManagerOptions);
// acmeCertificateManagerOptions.http01 = acmehttp01;
// acmeCertificateManagerOptions.notify = acmeNotify;
// acmeCertificateManagerOptions.retryInterval = 15000;
// acmeCertificateManagerOptions.deauthWait = 30000;
// acmeCertificateManagerOptions.retryPoll = 10;
// acmeCertificateManagerOptions.retryPending = 10;
// acmeCertificateManagerOptions.debug = true;
// var acmeCert = ACMECert.create(acmeCertificateManagerOptions);


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
                //logUtilHelper.log(appLogName, "app", "debug", "added file to zip " + path.join(folderpath, file) );
            } else {
                if (fs.lstatSync(path.join(folderpath, file)).isDirectory()) {
                    if (excludedFolders.includes(file) === false) {
                        zip.addLocalFolder(path.join(folderpath, file), file);
                    }
                }
            }
        } catch (ex) {
            logUtilHelper.log(appLogName, "app", "error", "addAllFolderFilesToZip", "Error Adding File/Folder to Zip", path.join(folderpath, file));
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
        logUtilHelper.log(appLogName, "app", 'warning', 'login', 'Invalid username ', username);
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
        logUtilHelper.log(appLogName, "app", 'warning', 'login', msg, "username:" + username + ", ip:" + ipAddress + ", isAccountLocked:" + isAccountLocked);
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
    logUtilHelper.log(appLogName, "browser", 'debug',  "path:" + req.path + ", ip:" + connInfo.ip + ", port:" + connInfo.port + ", ua:" + connInfo.ua);
    next();
    return;
})

app.use('/' + urlPrefix + 'javascript/polyfill.io/polyfill.min.js',function(req, res){
    polyfillLibrary.getPolyfillString({
        uaString: req.get('user-agent'),
        minify: true,
        features: {},
        unknown:'polyfill',
        stream:false
    }).then(function(bundleString) {
        res.contentType("text/javascript");
        res.send(bundleString);
    });
})

app.use('/' + urlPrefix + 'javascript/polyfill.io/polyfill.js',function(req, res){
    polyfillLibrary.getPolyfillString({
        uaString: req.get('user-agent'),
        minify: false,
        features: {},
        unknown:'polyfill',
        stream:false
    }).then(function(bundleString) {
        res.contentType("text/javascript");
        res.send(bundleString);
    });
})



app.use('/' + urlPrefix + 'javascript/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist')));
app.use('/' + urlPrefix + 'javascript/fontawesome', express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free')));
app.use('/' + urlPrefix + 'javascript/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/' + urlPrefix + 'javascript/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use('/' + urlPrefix + 'javascript/moment', express.static(path.join(__dirname, 'node_modules', 'moment', 'min')));
app.use('/' + urlPrefix + 'javascript/bootstrap-notify', express.static(path.join(__dirname, 'node_modules', 'bootstrap-notify')));
app.use('/' + urlPrefix + 'javascript/animate-css', express.static(path.join(__dirname, 'node_modules', 'animate.css')));
app.use('/' + urlPrefix + 'javascript/jsoneditor', express.static(path.join(__dirname, 'node_modules', 'jsoneditor', 'dist')));
app.use('/' + urlPrefix + 'javascript/js-cookie', express.static(path.join(__dirname, 'node_modules', 'js-cookie', 'dist')));
app.use('/' + urlPrefix + 'javascript/googlemaps', express.static(path.join(__dirname, 'node_modules', '@googlemaps', 'js-api-loader', 'dist')));
app.use('/' + urlPrefix + 'javascript/mdb-ui-kit/js', express.static(path.join(__dirname, 'node_modules', 'mdb-ui-kit', 'js')));
app.use('/' + urlPrefix + 'javascript/mdb-ui-kit/css', express.static(path.join(__dirname, 'node_modules', 'mdb-ui-kit', 'css')));

if(fs.existsSync(path.join(__dirname,configFolder, '/public/images', 'favicon.ico' ))){
    app.use(favicon(path.join(__dirname,configFolder, '/public/images', 'favicon.ico' )));
}
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }
}));

var routes = express.Router();


var handlePluginPublicFileRequest = function (req, res) {
    let filePath = req.path;

    if (filePath.startsWith('/' + urlPrefix)){
        filePath = filePath.substring(10);
    }


    if (filePath.indexOf("..") >= 0 ){
        throw new Error("Plugin Requests are not allowed to contain .. in the path")
    }
    if(filePath.toLowerCase().indexOf("/serverside") >= 0 ){
    
        throw new Error("Plugin Requests via HTTP to serverside folder or serverside.js are denied")
    }
    if(filePath.toLowerCase().indexOf("serverside.js") >= 0 ){
    
        throw new Error("Plugin Requests via HTTP to serverside.js are denied")
    }

    // let contanerNameEndPosition = filePath.lastIndexOf("/");
    // let contanerNameStartPosition = filePath.lastIndexOf("/",contanerNameEndPosition - 1);
    // let containerFolder = filePath.substring(contanerNameStartPosition,contanerNameStartPosition - contanerNameEndPosition) 
    // if(containerFolder !== "widgets"){
    //     throw new Error("Plugin Requests are not allowed to contain .. in the path");
    // }
    
    
    
    console.log('handlePluginPublicFileRequest ' + filePath + ' ...');

    

    if (fs.existsSync(path.join(__dirname, configFolder, filePath)) === true) {
        res.sendFile(filePath, { root: path.join(__dirname, configFolder)});  
    } else if (fs.existsSync(path.join(__dirname, filePath)) === true) {
        res.sendFile(filePath, { root: __dirname });          
    }else{
        res.sendStatus(404);
    }
    
} ; 



var handlePublicFileRequest = function (req, res) {
    var filePath = req.path;

    if (filePath === "/" && urlPrefix !== "") {
        //filePath = "/index.htm";
        res.redirect("/" + urlPrefix);
    }
    if (filePath === '/' + urlPrefix) {
        filePath = "/index.htm";
    }else if (filePath.startsWith('/' + urlPrefix)){
        filePath = filePath.substring(10);
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
    
} ;  

 

uispToolsApiRequestHandler.bindRoutes(routes);




//routes.get('/', function (req, res) {
//    var connInfo = getConnectionInfo(req);
//    res.end();
//    logUtilHelper.log(appLogName, "browser", 'info', "path:" + req.path + ", ip:" + connInfo.ip + ", port:" + connInfo.port + ", ua:" + connInfo.ua);
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

            letsEncrypt.loadX509Cert({ certFile: publicCertFile.data, keyFile: privateKeyFile.data }).then(
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



//create, init, bindRoutes any plugins

for (let index = 0; index < objOptions.plugins.length; index++) {
    let pluginName = objOptions.plugins[index];
    //remove any attempts to double dot move up folders
    let pluginNamePath = pluginName.replace(/\.\./g, "");
    pluginNamePath = pluginNamePath.replace(/\./g, "/");
    pluginNamePath = path.join(".", "plugins", pluginNamePath, "serverSide.mjs");
    pluginNamePath = pluginNamePath.replace(/\\/g,"/");
    pluginNamePath = "./" + pluginNamePath.replace(/\\/g,"/");
    var serverSideJSPath = pluginNamePath;
    if (fs.existsSync(serverSideJSPath) === true){
        import(serverSideJSPath).then(
                            
            function(Module) {
                try{
                    let plugin = null;
                    if(Module[pluginName] && Module[pluginName].plugin){
                        //widgetFactoryInfo.widgetFactory = Module["widgetFactory"];
                        plugin = new Module[pluginName].plugin(pluginName, pluginNamePath, objOptions, logUtilHelper, uispToolsApiRequestHandler)
                        
                    }else if(Module["default"] && Module["default"].plugin){
                        //widgetFactoryInfo.widgetFactory = Module["default"];
                        plugin =  new Module["default"].plugin(pluginName, pluginNamePath, objOptions, logUtilHelper, uispToolsApiRequestHandler)
                    }else{
                        logUtilHelper.log(appLogName, "app", "error", "plugin serverSide import failed", pluginName, serverSideJSPath, "Unable to load module by name or default" )
                    }
                    if(plugin){
                        plugin.init().then(
                            function(){
                                try{
                                    plugin.bindRoutes(routes);
                                }catch(ex){
                                    logUtilHelper.log(appLogName, "app", "error", "plugin serverSide create", pluginName, serverSideJSPath, ex )
                                }
                            },function(err){
                                logUtilHelper.log(appLogName, "app", "error", "plugin serverSide init failed", pluginName, serverSideJSPath, err )
                            }
                        );
                    }
                }catch(ex){
                    logUtilHelper.log(appLogName, "app", "error", "plugin serverSide create", pluginName, serverSideJSPath, ex )
                }
            }, 
            function(err){
                logUtilHelper.log(appLogName, "app", "error", "plugin serverSide import failed", pluginName, serverSideJSPath, err )
                
            }   
        );
    }else{
        logUtilHelper.log(appLogName, "app", "warning", "plugin serverSide not loaded", pluginName, serverSideJSPath )
    }
    
}

routes.get('/' + urlPrefix + '/plugins/*', function (req, res) {
    handlePluginPublicFileRequest(req, res);
});

routes.get('/*', function (req, res) {
    handlePublicFileRequest(req, res);
});

routes.get('/' + urlPrefix + '/*', function (req, res) {
    handlePublicFileRequest(req, res);
});


var loadCertificates = function () {
    try {
        letsEncrypt.loadX509CertSync({ certFile: httpsServerCert, keyFile: objOptions.httpsServerKey }).then(
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

                    logUtilHelper.log(appLogName, "app", 'info', 'Loaded Server Certs');
                    if (io) {
                        io.emit('serverCertificatesUpdate', Certs);
                    }
                } catch (ex2) {
                    logUtilHelper.log(appLogName, "app", 'error', 'Error Loading Server Public Cert ', ex2);
                }
            },
            function (ev, msg) {
                logUtilHelper.log(appLogName, "app",'error', 'Error Loading Server Public Cert ', ev, msg);
            }
        );
    } catch (ex) {
        logUtilHelper.log(appLogName, "app", 'error', 'Error Loading Certificates Exception', ex);
    }

};

app.use('/', routes);






var io = null;
io =  ioServer();

var https_srv = null;
var http_srv = null;

var getHttpsServerOptions = function () {
    //We share the https cert with both Client https and Management https
    //We share the https cert with both Client https and Management https

    var httpsOptions = {};

    if (fs.existsSync(httpsServerKey) === true && fs.existsSync(httpsServerCert) === true) {
        httpsOptions.key = fs.readFileSync(httpsServerKey);
        httpsOptions.cert = fs.readFileSync(httpsServerCert);
    } else {
        logUtilHelper.log(appLogName, "app", "warning", "httpsServer certificate files missing unable to use https", httpsServerCert, httpsServerKey);
    }

    return httpsOptions;
};

var startWebServers = function () {

    if (objOptions.useHttps === true) {
        try {
            let httpsOptions = getHttpsServerOptions();
            if (httpsOptions.key && httpsOptions.cert) {
                https_srv = https.createServer(getHttpsServerOptions(), app).listen(objOptions.httpsport, function () {
                    logUtilHelper.log(appLogName, "app", 'info', 'Express server listening on https port ' + objOptions.httpsport);
                });
                io.attach(https_srv);
            } else {
                logUtilHelper.log(appLogName, "app", "error", "httpsServer certificate files missing unable to start https server ");
            }
        } catch (ex) {
            logUtilHelper.log(appLogName, "app", 'error', 'Failed to Start Express server on https port ' + objOptions.httpsport, ex);
        }
    }


    if (objOptions.useHttp === true) {
        try {
            http_srv = http.createServer(app).listen(objOptions.httpport, function () {
                logUtilHelper.log(appLogName, "app", 'info', 'Express server listening on http port ' + objOptions.httpport);
            });
            io.attach(http_srv);
        } catch (ex) {
            logUtilHelper.log(appLogName, "app", 'error', 'Failed to Start Express server on http port ' + objOptions.httpport, ex);
        }
    }

    try{
        

        const nets = networkInterfaces();
        //const results = Object.create(null); // Or just '{}', an empty object
        
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (net.family === 'IPv4' && !net.internal) {
                    // if (!results[name]) {
                    //     results[name] = [];
                    // }
                    //results[name].push(net.address);
                    logUtilHelper.log(appLogName, "app","info", "interface", name, net.address)
                }
            }
        }
        //logUtilHelper.log(appLogName, "app","info", "interface ipv4 addresses", results)

    }catch (ex) {
        logUtilHelper.log(appLogName, "app",'error', 'Failed to Get Ip Infomation', ex);
    }
};


var updateHttpsServer = function () {
    try {
        if (https_srv) {
            if (https_srv.setSecureContext) {
                https_srv.setSecureContext(getHttpsServerOptions());
            } else {
                logUtilHelper.log(appLogName, "app", "error", "https_srv.setSecureContext is null. Wrong version of Node.JS must be 12 or greater. \"node -v\"");
            }
        } else {
            logUtilHelper.log(appLogName, "app", "error", "https_srv is null. Unable to update Context");
        }
    } catch (ex) {
        logUtilHelper.log(appLogName, "app", "error", "Error Updating https server with new security context.", ex);
    }
};




// This is the socket io connections coming from the Browser pages

//io = require('socket.io')(https_srv);
io.on('connection', function (socket) {


    logUtilHelper.log(appLogName, "browser", 'info',  socket.id, 'Connection', getSocketInfo(socket));

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
            logUtilHelper.log(appLogName, "browser", 'trace',  socket.id, 'ping');
        });

       

        socket.on("disconnect", function () {
            try {
                logUtilHelper.log(appLogName, "browser", "info",  socket.id, "disconnect", getSocketInfo(socket));
                if (privateData.browserSockets[socket.id]) {
                    delete privateData.browserSockets[socket.id];
                }
            } catch (ex) {
                logUtilHelper.log(appLogName, "browser", 'error', 'Error socket on', ex);
            }
        });

        socket.on('Logs', function (data) {
            try {
                logUtilHelper.log(appLogName, "browser", "info", socket.id, "Logs");
                socket.emit('Logs', privateData.logs);
            } catch (ex) {
                logUtilHelper.log(appLogName, "browser", 'error', 'Error socket on', ex);
            }
        });


        socket.on('createLetsEncrypt', function (data) {
            try {
                logUtilHelper.log(appLogName, "browser", "info", socket.id, "createLetsEncrypt");
                //renewServerCertificate();
            } catch (ex) {
                logUtilHelper.log('error', 'Error socket on', ex);
            }
        });

        socket.on('loadCertificates', function (data) {
            try {
                logUtilHelper.log(appLogName, "browser", "info",  socket.id, "loadCertificates");
                loadCertificates();
            } catch (ex) {
                logUtilHelper.log(appLogName, "browser", 'error', 'Error socket on', ex);
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
        logUtilHelper.log(appLogName, "app", 'error', 'Error Loading https certificate', ex);
    }
    try {
        startWebServers();
    } catch (ex) {
        logUtilHelper.log(appLogName, "app", 'error', 'Error Starting Web Servers', ex);
    }
};

//we use this defer to delay start to wait on a mongo load of data on startup to get data and keep everything in sync
var startupPromise = startupReady.promise;
startupPromise.then(startupServer);