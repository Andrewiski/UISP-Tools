"use strict";
const appName = 'uispToolsApiHandler';
const extend = require('extend');
const Defer = require('node-promise').defer;
const http = require('http');
const https = require('https');
var MongoClient = require('mongodb').MongoClient;

//const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

var UispToolsApiHandler = function (options) {
    var self = this;
    var defaultOptions = {
        ucrmAppKey: null,
        ucrmUrl:null,
        unmsUrl: null,
        logUtilHelper:null,
        mongoDbServerUrl: "",
        mongoDbDatabaseName:"",
        mongoClientOptions: {useUnifiedTopology: true},
    };
    var objOptions = extend({}, defaultOptions, options);
    self.objOptions = objOptions;
    var debug = null;
    if (self.objOptions.logUtilHelper){
        debug = function(loglevel){
            let args = []
            for (let i = 0; i < arguments.length; i++) {
                if (arguments[i] === undefined) {
                    args.push("undefined")
                } else if (arguments[i] === null) {
                    args.push("null")
                }
                else {
                    args.push(JSON.parse(JSON.stringify(arguments[i])))
                }
            }
            if (args.length > 1) {
                args.shift(); //remove the loglevel from the array
            }
            self.objOptions.logUtilHelper.log(appName, "app", loglevel, args);
        }
    }else{
        debug = require('debug')(appName);
    }
    
    self.cache = {};
    

    

    var remoteDownloader = function (options) {
        var deferred = Defer();
        try {
            if (options.url.startsWith('http://') === true) {
                protocol = http;
            }
            else {
                protocol = https;
            }

            if (!options.url) {
                debug("warning", "remoteDownloader", "No url to download");
                
                deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": new Error('No url to download') }); 
                return deferred.promise;
            }
            var protocol;
            var opc = {};
            try {

                if (options.cert && options.cert !== '') {
                    opc.cert = fs.readFileSync(path.join(__dirname, options.cert));
                } 
                if (opc.key && opc.key !== '') {
                    opc.key = fs.readFileSync(path.join(__dirname, options.key));
                } 
            } catch (ex) {
                debug('error', 'remoteDownloader', ' error downloading data ', ex);
                if (opc.key) {
                    delete opc.key;
                }
                if (opc.cert) {
                    delete opc.cert;
                }
            }
            if (options.rejectUnauthorized !== undefined) {
                opc.rejectUnauthorized = options.rejectUnauthorized
            }
            opc.followAllRedirects = true;
            if (options.method) {
                opc.method = options.method;
            }else {
                opc.method = "GET";
            
            }
            var request = protocol.request(options.url, opc, function (res) {

                var data = '';
                var retval = null;
                res.on('data', function (d) {
                    data = data + d;
                });

                res.on('end', function () {
                    var error = null;
                    try {
                        if (res.statusCode === 200) {
                            retval = JSON.parse(data); 
                            if (options.injectCookies) {
                                retval.cookies = res.cookies;
                            }
                            if (options.injectHeaders) {
                                retval.headers = res.headers;
                            }
                            deferred.resolve(retval);
                        }else if (res.statusCode === 401) {
                            retval = JSON.parse(data);
                            if(retval.message){
                                retval.msg = retval.message + " " + "NMS Auth Token may be expired!";
                            }else{
                                retval.msg = "NMS Auth Token may be expired!";
                            }
                            //retval.code = retval.statusCode;
                            retval.msg = retval.message + " " + "NMS Auth Token may also be expired!";
                            deferred.reject(retval);
                        }else if (res.statusCode === 404) {
                            retval = JSON.parse(data);
                            if(retval.message){
                                retval.msg = retval.message + " " + "URL Not Found!";
                            }else{
                                retval.msg = "URL Not Found!";
                            }
                            
                            deferred.reject(retval);
                        } else {
                            debug('warning', 'remoteDownloader', 'Error downloading the remote JSON', 'download.error', data);
                            try {
                                retval = JSON.parse(data); 
                                if (retval.message | retval.message === "") {
                                    retval.msg = retval.message;
                                    delete retval.message;
                                }
                                if (retval.msg === undefined || retval.msg === "") {
                                    retval.msg = "An Error Occured!";
                                }
                            } catch (ex) {
                                debug('error', 'remoteDownloader',  {msg:ex.message, stack:ex.stack});
                                retval = { "code": 500, "msg": "An Error Occured!", "error": e };
                            }
                            deferred.reject(retval);
                        }
                    } catch (e) {
                        debug('error', 'remoteDownloader', 'Error reading the downloaded JSON:', 'download.error', {
                            e: e,
                            response: data,
                            url: options.url
                        });
                        deferred.reject({"code": 500, "msg": "An Error Occured!", "error": e }); 
                        return;
                    }
                    
                });

            });

            request.on('error', function (e) {
                debug('error', 'remoteDownloader', 'Error downloading the remote JSON', 'download.error',e);
                deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": e }); 
            });
            if (options.headers) {
                for (let [key, value] of Object.entries(options.headers)) {
                    request.setHeader(key, value);
                }               
            } 
            let body = null;
            if (options.data) {
                if (typeof (options.data) === "object") {
                    body = JSON.stringify(options.data);
                } else {
                    body = options.data;
                }
            }
            request.end(body);
        } catch (ex) {
            debug('error', 'remoteDownloader',  {msg:ex.message, stack:ex.stack});
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex }); 
        }
        return deferred.promise;
    };

    var handleUcrmRequest = function (options) {
        
        
        options.url = objOptions.ucrmUrl + options.url; 

        if (options.headers === undefined) {
            options.headers = {};
        }
        if (options.headers['Content-Type'] === undefined) {
            options.headers['Content-Type'] = 'application/json';
        }
        if (objOptions.rejectUnauthorized !== undefined) {
            options.rejectUnauthorized = objOptions.rejectUnauthorized;
        }
        if (options.sendAppKey !== false) {
            options.headers['X-Auth-App-Key'] = objOptions.ucrmAppKey;
        }

        return remoteDownloader(options);
    };

    var handleUnmsRequest = function (options) {
        options.url = objOptions.unmsUrl + options.url;

        if (options.headers === undefined) {
            options.headers = {};
        }
        if (options.headers['Content-Type'] === undefined) {
            options.headers['Content-Type'] = 'application/json';
        }
        if (objOptions.rejectUnauthorized !== undefined) {
            options.rejectUnauthorized = objOptions.rejectUnauthorized;
        }
        // if (options.sendAppKey !== false) {
        //     options.headers['X-Auth-App-Key'] = objOptions.unmsAppKey;
        // }
        if (options.nmsAuthToken) {
            options.headers['x-auth-token'] = options.nmsAuthToken;
        }
        return remoteDownloader(options);
    };

    var publicLoginCrm = function (options) {
        var deferred = Defer();
        try {
            var normLogin = { username: options.username, password: options.password };
            var myOptions = extend({}, { url: 'clients/authenticated', method: "POST", data:normLogin }  );
            handleUcrmRequest(myOptions).then(
                function (data) {
                    try {
                        if (data.code === 401) {
                            //data.msg = "Invalid Username or Password!";
                            debug('warning', 'publicLoginCrm',  "Invalid UserName or Password", options.username );
                            deferred.reject({ "code": 401, "msg": "Invalid Username or Password!", "error": "Invalid Username or Password!" });
                        }else{
                            let retval = {
                                firstName : data.firstName,
                                lastName : data.lastName,
                                username : data.username,
                                userType : "crm",
                                userId : data.id
                                ,crmLoginData : data //we can limit what comes back here so not to reveal to much information 
                            }; 
                            deferred.resolve(retval);
                        }
                    } catch (ex) {
                        debug('error', 'publicLoginCrm',  {msg:ex.message, stack:ex.stack});
                        deferred.reject({ "code": 500, "msg": "An Error Occured during Login!", "error": ex });
                    }

                },
                function (error) {
                    if (error.code === 401) {
                        error.msg = "Invalid Username or Password!";
                    }
                    debug('error', 'publicLoginCrm', error);
                    deferred.reject(error);
                }
            );

        } catch (ex) {
            debug('error', 'publicLoginCrm', {msg:ex.message, stack:ex.stack});
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    };

    var publicLoginMobile = function (options) {
        var deferred = Defer();
        try {
            var normLogin = { user: options.username, password: options.password, expiration: 604800, sliding: 1, deviceName:"UISPTools" };
            handleUcrmRequest({ url: 'mobile/login', data: normLogin, method: "POST", sendAppKey: false }).then(
                function (data) {
                    try {
                        if (data.code === 404) {
                            debug('warning', 'publicLoginMobile',  "Invalid Username or Password!", options.username );
                            //data.msg = "Invalid Username or Password!";
                            deferred.reject({ "code": 401, "msg": "Invalid Username or Password!", "error": "Invalid Username or Password!" });
                        }else{
                            deferred.resolve(data);
                        }
                    } catch (ex) {
                        debug('error', 'publicLoginMobile',  "Invalid Username or Password!", ex );
                        deferred.reject({ "code": 500, "msg": "An Error Occured during Login!", "error": ex });
                    }

                },
                function (error) {
                    if (error.code === 404) {
                        error.msg = "Invalid Username or Password!";
                    }
                    debug('error', 'publicLoginMobile', error );
                    deferred.reject(error);
                }
            );

        } catch (ex) {
            debug('error', 'publicLoginMobile', ex );
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    };

    var publicLoginNms = function (options) {
        var deferred = Defer();
        try {
            var normLogin = { username: options.username, password: options.password, sessionTimeout: 259200000 };
            handleUnmsRequest({ url: 'user/login', data: normLogin, method: "POST", sendAppKey: false, injectHeaders: true}).then(
                function (data) {
                    try {
                        if (data.code === 401) {
                            //data.msg = "Invalid Username or Password!";
                            debug('error', 'publicLoginNms',  "Invalid Username or Password!", options.username );
                            //deferred.resolve(data);
                            deferred.reject({ "code": 401, "msg": "Invalid Username or Password!", "error": "Invalid Username or Password!" });
                        } else {
                            if (data.headers["x-auth-token"]) {
                                data["x-auth-token"] = data.headers["x-auth-token"];
                                delete data.headers;
                            }
                            let retval = {
                                firstName : data.firstName,
                                lastName : data.lastName,
                                username : data.username,
                                userType : "nms",
                                userId : data.id,
                                //nmsAuthToken : data["x-auth-token"]
                                nmsLoginData : data //we can limit what comes back here so not to reveal to much information 
                            };
                            deferred.resolve(retval);
                        }
                        
                    } catch (ex) {
                        debug('error', 'publicLoginNms', ex);
                        deferred.reject({ "code": 500, "msg": "An Error Occured during Login!", "error": ex });
                    }

                },
                function (error) {
                    if (error.statusCode === 401) {
                        error.msg = "Invalid Username or Password!";
                    }
                    debug('error', 'publicLoginNms', error);
                    deferred.reject(error);
                }
            );

        } catch (ex) {
            debug('error', 'publicLoginNms', ex);
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }

    var publicLoginData = function (options) {
        var deferred = Defer();
        try {

            if (self.cache.loginData) {
                deferred.resolve(self.cache.loginData);
            } else {



                var loginData = {};
                
                handleUcrmRequest({ url: 'organizations' }).then(
                    function (data) {
                        try {
                            for (let i = 0; i < data.length; i++) {
                                let item = data[i];
                                if (item.selected) {
                                    loginData.organization = { name: item.name, email: item.email, street1: item.street1, street2: item.street2, city: item.city, zipCode: item.zipCode, countryId: item.countryId, stateId: item.stateId, locale: item.locale, website: item.website, phone: item.phone };
                                    break;
                                }
                            }
                            loginData.ucrmUrl = objOptions.ucrmUrl.substring(0, objOptions.ucrmUrl.indexOf('/', 8) + 1);
                            self.cache.loginData = loginData;
                            if (loginData.organization) {
                                handleUcrmRequest({ url: 'countries/' + loginData.organization.countryId }).then(
                                    function (country) {
                                        try {
                                            loginData.organization.country = country.name;
                                            loginData.organization.countryCode = country.code;
                                            //Retrieve collection of States.Available for United States and Canada only.
                                            if (loginData.organization.countryCode === "US" || loginData.organization.countryCode === "CA") {
                                                handleUcrmRequest({ url: 'countries/states/' + loginData.organization.stateId }).then(
                                                    function (state) {
                                                        try {
                                                            loginData.organization.state = state.name;
                                                            loginData.organization.stateCode = state.code;
                                                            //Retrieve collection of States.Available for United States and Canada only.
                                                            deferred.resolve(loginData);
                                                        } catch (ex) {
                                                            debug('error', 'publicLoginData', "An Error Occured Fetching Country!", ex);
                                                            deferred.reject({ "msg": "An Error Occured Fetching Country!", "error": ex });
                                                        }

                                                    },
                                                    function (error) {
                                                        debug('error', 'publicLoginData', "An Error Occured Fetching Country!", error);
                                                        deferred.reject({ "code": 500, "msg": "An Error Occured Fetching Country!", "error": error });
                                                    }

                                                )
                                            } else {
                                                //Not US or Canada so just populate Country
                                                deferred.resolve(loginData);
                                            }

                                        } catch (ex) {
                                            debug('error', 'publicLoginData', "An Error Occured Fetching Country!", ex);
                                            deferred.reject({ "code": 500, "msg": "An Error Occured Fetching Country!", "error": ex });
                                        }
                                    },
                                    function (error) {
                                        debug('error', 'publicLoginData', error);
                                        deferred.reject(error);
                                    }
                                )
                            } else {
                                deferred.resolve(loginData);
                            }

                        } catch (ex) {
                            debug('error', 'publicLoginData', ex);
                            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
                        }

                    },
                    function (error) {
                        debug('error', 'publicLoginData', error);
                        deferred.reject(error);
                    }
                );
            }
        } catch (ex) {
            debug('error', 'publicLoginData', ex);
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }


    var ucrmVersion = function (options) {
        var deferred = Defer();
        try {

            if (self.cache.ucrmVersion) {
                deferred.resolve(self.cache.ucrmVersion);
            } else {
                handleRequest({ url: 'version' }).then(
                    function (data) {
                        try {
                           
                            self.cache.ucrmVersion = data;
                            debug('debug', 'ucrmVersion', self.cache.ucrmVersion);
                            deferred.resolve(data);

                        } catch (ex) {
                            debug('error', 'ucrmVersion', ex);
                            deferred.reject(ex);
                        }

                    },
                    function (error) {
                        debug('error', 'ucrmVersion', error);
                        deferred.reject(error);
                    }
                );
            }
        } catch (ex) {
            debug('error', 'ucrmVersion', ex);
            deferred.reject( ex );
        }
        return deferred.promise;
    }

    var flushCache = function () {
        self.cache = {};
    }

    var getMenuItems = function (options) {
        var deferred = Defer();
        try {
            let fetchOptions = {
                find: { linkMenuDisplay: true, deleted: false }, 
                projections : { linkText: 1, linkUrl: 1, linkTarget: 1, pageContentGuid: 1, roleId: 1, contentType: 1, parentPageContentGuid: 1} ,               
                sort: [['displayOrder', 1 ]['parentPageContentGuid', 1 ]]
            };

            if(options.menuGuid){
                fetchOptions.find.menuGuid = options.menuGuid;
            }
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then( 
                function () {
                    try {           
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_PageContent');                     
                        if (collection) {
                            collection.find(fetchOptions.find)
                                .project(fetchOptions.projections)
                                .sort(fetchOptions.sort)
                                .toArray().then(
                                    function ( menuItems) {   
                                        client.close();
                                        deferred.resolve(menuItems);
                                    },
                                    function(ex){
                                        debug("error", "getMenuItems", ex);
                                        client.close();
                                        deferred.reject(ex)
                                    }
                                );
                        } else {
                            deferred.resolve(null);
                        }
                    } catch (ex) {
                        debug("error", "getMenuItems", ex);
                        deferred.reject(ex)
                        client.close();
                    }
                },
                function(ex){
                    debug("error", "getMenuItems", ex);
                    deferred.reject(ex)
                }    
            );
                
        
            
        } catch (ex) {
            debug('error', 'getMenuItems', ex);
            deferred.reject(ex);
        }
        return deferred.promise;

    };


    var getPluginData = function(options){
        var deferred = Defer();
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then( 
                function () {
                    try {
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_PluginData');
                        var findQuery = {};
                        if(options.pluginId){
                            findQuery.pluginId = options.pluginId;
                        }else if(options.pluginName) {
                                findQuery.pluginName =  options.pluginName ;
                        }else{
                            throw new Error("pluginID or pluginName must be set");
                        }
                        if (collection) {
                            collection.findOne(findQuery).then(
                                    function ( doc) {   
                                        client.close();
                                        deferred.resolve(doc);
                                    },
                                    function(ex){
                                        debug('error', 'getPluginData', ex);
                                        deferred.reject(ex);
                                        client.close();
                                    }
                                );
                        } else {
                            deferred.resolve(null);;
                        }
                    } catch (ex) {
                        debug('error', 'getPluginData', ex);
                        deferred.reject(ex);
                        client.close();
                    }
                },
                function(ex){
                    debug('error', 'getPluginData', ex);
                    deferred.reject(ex);
                }    
            );
            
        } catch (ex) {
            debug('error', 'getPluginData', ex);
            deferred.reject(ex);
        }
        return deferred.promise;
    }

    var getPluginUserData = function(options){
        var deferred = Defer();
        try {
                const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
                // Use connect method to connect to the Server
                client.connect().then( 
                    function () {
                        try {
                            const db = client.db(objOptions.mongoDbDatabaseName);
                            const collection = db.collection('ut_PluginUserData');
                            var findQuery = {};
                            //can be passed in as a guid or as pluginName    
                            if(options.pluginId){
                                findQuery.pluginId = options.pluginId;
                            }else if (options.pluginName){
                                findQuery.pluginName = options.pluginName;
                            }else{
                                throw new Error("pluginId or pluginName must be set");
                            }
                            if(options.userId){
                                findQuery.userId =  options.userId;
                            }else{
                                throw new Error("userId must be set");
                            }
                            if (collection) {
                                collection.findOne(findQuery).then(
                                        function ( doc) {   
                                            client.close();
                                            deferred.resolve(doc);
                                        },
                                        function(err){
                                            debug('error', 'getPluginUserData', err);
                                            client.close();
                                            deferred.reject(err);
                                            
                                        }
                                    );
                            } else {
                                return null;
                            }
                        } catch (ex) {
                            debug('error', 'getPluginUserData', ex);
                            deferred.reject(ex);
                            client.close();
                        }
                    },
                    function(err){
                        debug('error', 'getPluginUserData', err);
                        deferred.reject(err);
                    }    
                );
            } catch (ex) {
                debug('error', 'getPluginUserData', ex);
                deferred.reject(ex);
            }
            return deferred.promise;
    }

    var getPageContent = function (options) {
        var deferred = Defer();
        try {
            let findDefaults = { deleted: false }
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then(
                function () {
                    try {
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_PageContent');
                        var findQuery = extend({}, options.find, findDefaults);
                        var projections = { linkText: 1, linkUrl: 1, linkTarget: 1, pageContentGuid: 1, pageDescription: 1, pageKeywords: 1, updatedDate: 1, pageTitle: 1, contentType: 1, extendedData:1, content: 1 };
                        if (collection) {
                            collection.findOne(findQuery, { projection: projections }).then(
                                function (docs) {
                                    client.close();
                                    deferred.resolve(docs);
                                },
                                function(ex){
                                    debug('error', 'getPageContent', ex);
                                    deferred.reject(ex);
                                }
                            );
                        } else {
                            return null;
                        }
                    } catch (ex) {
                        client.close();
                        debug('error', 'getPageContent', ex);
                        deferred.reject(ex);
                    }
                },
                function(ex){
                    debug('error', 'getPageContent', ex);
                    deferred.reject(ex);
                }
            );
        } catch (ex) {
            debug('error', 'getPageContent', ex);
            deferred.reject(ex);
        }
        return deferred.promise;
    };


    var createRefreshToken = function (options){
        var deferred = Defer();
        
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then(
                function () {
                    try {
                    
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_RefreshToken');
                        if (collection) {
                            let refreshToken = {};
                            refreshToken.refresh_token = uuidv4();
                            //if (options.expiresIn === undefined || options.expiresIn === null){
                                refreshToken.expiresIn = 259200; // 3 * 24 * 60 * 60;  //expire Token in 3 days ie it will get auto deleted by Mongo
                            //}
                            refreshToken.token_type = "bearer";
                            let expiresOn = new Date();
                            expiresOn = new Date(expiresOn.getTime() + (refreshToken.expiresIn * 1000));
                            refreshToken.expiresOn = expiresOn //used by Momgo to auto delete when expired
                            refreshToken.loginData = options.loginData;
                            collection.insertOne(refreshToken).then(                            
                                function (err, doc) {
                                    client.close();
                                    delete refreshToken.loginData;
                                    deferred.resolve(refreshToken);
                                },
                                function(err){
                                    debug('error', 'createRefreshToken',  { "msg": err.message, "stack": err.stack });
                                    client.close();
                                    deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": err });
                                }
                            );
                        } else {
                            debug("error", "createRefreshToken", { "msg": "Not Able to Open MongoDB Connection", "stack": "" });
                            client.close();
                            deferred.reject({ "code": 500, "msg": "Not Able to Open MongoDB Connection", "error": "collection is null"});
                        }
                    } catch (ex) {
                        debug("error", "createRefreshToken", { "msg": ex.message, "stack": ex.stack });
                        client.close();
                        deferred.reject({ "code": 500, "msg": ex.message, "error": ex });
                    }
                },
                function(err){
                    debug('error', 'createRefreshToken',  { "msg": err.message, "stack": err.stack });
                    deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": err });
                }

            );
        } catch (ex) {
            debug('error', 'createRefreshToken',  { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        
        return deferred.promise;     
    }


    var createAccessToken = function (options){
        var deferred = Defer();
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then(
                function () {
                    try {
                        
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_AccessToken');
                        if (collection) {
                            var accessToken = {};
                            accessToken.access_token = uuidv4();
                            accessToken.expiresIn = 3600; 
                            let expiresOn = new Date();
                            expiresOn = new Date(expiresOn.getTime() + (accessToken.expiresIn * 1000));
                            accessToken.expiresOn = expiresOn //used by Momgo to auto delete when expired with a expireAfterSecond index
                            accessToken.refresh_token = options.refreshToken.refresh_token;
                            accessToken.refreshToken = options.refreshToken; //used as a way to prevent having to fetch refreshToken as this way it is a short cache as its a 10 minute of all connected users
                            accessToken.loginData = options.loginData;
                            collection.insertOne(accessToken).then(                            
                                function (doc) {
                                    client.close();
                                    delete accessToken.refreshToken
                                    delete accessToken.loginData
                                    deferred.resolve(accessToken);
                                },
                                function(err){
                                    debug("error", "createAccessToken", { "msg": err.message, "stack": err.stack });
                                    client.close();
                                    deferred.reject({ "code": 500, "msg": err.message, "error": err });
                                }
                                    
                            );
                        } else {
                            debug("error", "createAccessToken", { "msg": "Not Able to Open MongoDB Connection", "stack": "" });
                            client.close();
                            deferred.reject({ "code": 500, "msg": "Not Able to Open MongoDB Connection", "error": "collection is null"});
                        }
                    } catch (ex) {
                        debug("error", "createAccessToken", { "msg": ex.message, "stack": ex.stack });
                        client.close();
                        deferred.reject({ "code": 500, "msg": ex.message, "error": ex });
                    }
                },
                function(err){
                    debug("error", "createAccessToken", { "msg": err.message, "stack": err.stack });
                    deferred.reject({ "code": 500, "msg": err.message, "error": err });
                }
            );
        } catch (ex) {
            debug('error', 'createAuthToken',  { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        
        return deferred.promise;     
    }

    var deleteRefreshToken = function(options){
        var deferred = Defer();
        //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then(
                function () {
                    try {
                        
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_RefreshToken');
                        var findQuery = {  refresh_token : options.refresh_token}
                        if (collection) {
                            collection.deleteMany(findQuery, null).then(
                                function (deleteResult) {
                                    client.close();
                                    deferred.resolve(deleteResult);
                                },
                                function(err){
                                    debug("error", "deleteRefreshToken", { "msg": err.message, "stack": err.stack });
                                    deferred.reject({ "msg": "An Error Occured!", "error": err });
                                    client.close();            
                                }
                            );
                        } else {
                            debug("error", "deleteRefreshToken", { "msg": "An Error Occured!", "stack": "Collection Not Found" });
                            deferred.reject({ "msg": "An Error Occured!", "error": "accessToken Collection Not Found" });
                            client.close(); 
                        }
                    } catch (ex) {
                        debug("error", "deleteRefreshToken", { "msg": ex.message, "stack": ex.stack });
                        deferred.reject({ "msg": "An Error Occured!", "error": ex });
                        client.close();
                    }
                },
                function(err){
                    debug("error", "deleteRefreshToken", { "msg": err.message, "stack": err.stack });
                    deferred.reject({ "code": 500, "msg": err.message, "error": err });
                }
            );
        } catch (ex) {
            debug("error", "deleteRefreshToken", { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }
    
    
    var deleteAccessToken = function(options){
        var deferred = Defer();
        //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then(
                function () {
                    try {
                        
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_AccessToken');
                        var findQuery = {  refresh_token : options.refresh_token}
                        if (collection) {
                            collection.deleteMany(findQuery, null).then(
                                function (deleteResult) {
                                    client.close();
                                    deferred.resolve(deleteResult);
                                },
                                function(err){
                                    debug("error", "deleteAccessToken", { "msg": err.message, "stack": err.stack });
                                    deferred.reject({ "msg": "An Error Occured!", "error": err });
                                    client.close();            
                                }
                            );
                        } else {
                            debug("error", "deleteAccessToken", { "msg": "An Error Occured!", "stack": "Collection Not Found" });
                            deferred.reject({ "msg": "An Error Occured!", "error": "accessToken Collection Not Found" });
                            client.close(); 
                        }
                    } catch (ex) {
                        debug("error", "deleteAccessToken", { "msg": ex.message, "stack": ex.stack });
                        deferred.reject({ "msg": "An Error Occured!", "error": ex });
                        client.close();
                    }
                },
                function(err){
                    debug("error", "deleteAccessToken", { "msg": err.message, "stack": err.stack });
                    deferred.reject({ "code": 500, "msg": err.message, "error": err });
                }
            );
        } catch (ex) {
            debug("error", "deleteAccessToken", { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }
    

    var getAccessToken = function(options){
        var deferred = Defer();
        //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then(
                function () {
                    try {
                        
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_AccessToken');
                        var findQuery = {  access_token : options.access_token}
                        if (collection) {
                            collection.findOne(findQuery, null).then(
                                function (doc) {
                                    deferred.resolve(doc);
                                    client.close();
                                },
                                function(err){
                                    debug("error", "getAccessToken", { "msg": err.message, "stack": err.stack });
                                    deferred.reject({ "msg": "An Error Occured!", "error": err });
                                    client.close();            
                                }
                            );
                        } else {
                            debug("error", "getAccessToken", { "msg": "An Error Occured!", "stack": "Collection Not Found" });
                            deferred.reject({ "msg": "An Error Occured!", "error": "getAccessToken Collection Not Found" });
                            client.close(); 
                        }
                    } catch (ex) {
                        debug("error", "getAccessToken", { "msg": ex.message, "stack": ex.stack });
                        deferred.reject({ "msg": "An Error Occured!", "error": ex });
                        client.close();
                    }
                },
                function(err){
                    debug("error", "getAccessToken", { "msg": err.message, "stack": err.stack });
                    deferred.reject({ "code": 500, "msg": err.message, "error": err });
                }
            );
        } catch (ex) {
            debug("error", "getAccessToken", { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }

    var getRefreshToken = function(options){
        var deferred = Defer();
        //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect().then(
                function () {
                    try {
                        const db = client.db(objOptions.mongoDbDatabaseName);
                        const collection = db.collection('ut_RefreshToken');
                        var findQuery = {  refresh_token : options.refresh_token}
                        if (collection) {
                            collection.findOne(findQuery, null).then(
                                function (doc) {
                                    deferred.resolve(doc);
                                    client.close();
                                },
                                function(err){
                                    debug("error", "getRefreshToken", { "msg": err.message, "stack": err.stack });
                                    deferred.reject({ "msg": "An Error Occured!", "error": err });
                                    client.close();            
                                }
                            );
                        } else {
                            debug("error", "getRefreshToken", { "msg": "An Error Occured!", "stack": "Collection Not Found" });
                            deferred.reject({ "msg": "An Error Occured!", "error": "getRefreshToken Collection Not Found" });
                            client.close(); 
                        }
                    } catch (ex) {
                        debug("error", "getRefreshToken", { "msg": ex.message, "stack": ex.stack });
                        deferred.reject({ "msg": "An Error Occured!", "error": ex });
                        client.close();
                    }
                },
                function(err){
                    debug("error", "getRefreshToken", { "msg": err.message, "stack": err.stack });
                    deferred.reject({ "msg": "An Error Occured!", "error": err });           
                }
            );
        } catch (ex) {
            debug("error", "getRefreshToken", { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }

    var cleanLoginData = function(loginData){
        let userInfoData = loginData
        userInfoData.roles = [];
            if(userInfoData.nmsLoginData){
                if(userInfoData.nmsLoginData.role === "superadmin"){
                    userInfoData.roles.push({roleName:"admin"});
                }
                delete userInfoData.nmsLoginData;
            }
            if(userInfoData.crmLoginData){
                delete userInfoData.crmLoginData;
            }
            return userInfoData;
    }
    
    self.handleUcrmRequest = handleUcrmRequest;
    self.handleUnmsRequest = handleUnmsRequest;
    self.publicLoginData = publicLoginData;
    self.flushCache = flushCache;
    self.publicLoginCrm = publicLoginCrm;
    self.publicLoginNms = publicLoginNms;
    self.publicLoginMobile = publicLoginMobile;
    self.ucrmVersion = ucrmVersion;
    self.getPageContent = getPageContent;
    self.getPluginData = getPluginData;
    self.getPluginUserData = getPluginUserData;
    self.createRefreshToken = createRefreshToken;
    self.createAccessToken = createAccessToken;
    self.getRefreshToken = getRefreshToken;
    self.getAccessToken = getAccessToken;
    self.deleteRefreshToken = deleteRefreshToken;
    self.deleteAccessToken = deleteAccessToken;
    self.cleanLoginData = cleanLoginData;
    self.getMenuItems = getMenuItems;
};
module.exports = UispToolsApiHandler;