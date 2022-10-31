"use strict";
const appName = "uispToolsApiRequestHandler";
const extend = require('extend');
const Defer = require('node-promise').defer;

var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const { nextTick } = require('process');

var UispToolsApiRequestHandler = function (options) {
    var self = this;
    var defaultOptions = {
        mongoDbServerUrl: "",
        mongoDbDatabaseName:"",
        mongoClientOptions: {useUnifiedTopology: true},
        logUtilHelper:null,
        uispApiRequestHandler: null
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
    

    

    var BindRoutes = function (routes) {
        
        try {
            
            routes.get('/uisptools/api/PageContent/MenuItems', getMenuItems);
            routes.get('/uisptools/api/PageContent/PageContentGuid/:guid', getPageByPageContentGuid);
            routes.get('/uisptools/api/PageContent/LinkUrl/*', getPageByLinkUrl);
            routes.post('/uisptools/login/loginBoth', loginBoth);
            routes.get('/uisptools/login/loginData', getLoginData);
            //routes.get('/uisptools/login/userInfo', getUserInfo);
            routes.get('/uisptools/errorHandlerTest', errorHandlerTest);
            routes.get('/uisptools/errorHandlerTestRawError', errorHandlerTestRawError);
            routes.get('/uisptools/api/settings/anonymousClientSideSettings', getAnonymousClientSideSettings);
            //Any Routes above this line are not Checked for Auth and are Public
            routes.get('/uisptools/api/*', checkApiAccess);
            routes.post('/uisptools/api/*', checkApiAccess);
            routes.delete('/uisptools/api/*', checkApiAccess);
            routes.get('/uisptools/api/UserInfo', getUserInfo);    
            routes.get('/uisptools/api/crm/*', getCRM);
            routes.get('/uisptools/api/nms/*', getNMS);
            routes.post('/uisptools/api/crm/*', getCRM);
            routes.post('/uisptools/api/nms/*', getNMS);
            
        } catch (ex) {
           debug("error", ex.msg, ex.stack);
        }
        
    }


    var getAnonymousClientSideSettings = function(req, res, next){
        try {
            
            var clientSideSettings = {
                googleApiKey: self.objOptions.googleApiKey
            }
            
            
            res.json(clientSideSettings);
            
            
        } catch (ex) {
            debug("error", "getUserInfo", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
    }

    var errorHandlerTestRawError = function(req, res){
        
            throw new Error("errorHandlerTest");
        
    }

    var errorHandlerTest = function(req, res){
        try {
            errorHandlerTestRawError(req,res);
        } catch (ex) {
            debug("error", "errorHandlerTest", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
    }
    var checkApiAccess = function (req, res, next) {
        try {
            let access_token = req.headers.authorization;
            if(access_token && access_token.startsWith("Bearer ")){
                access_token = access_token.substring(7);
                getAccessToken({access_token:access_token}).then(
                    function(accessToken){
                        if(accessToken != null){
                            //double check not Expired etc but not sure why Mongo would not delete it
                            res.locals.accessToken = accessToken;
                            next("route")
                        }else{
                            debug("debug", "checkApiAccess access_token not found", req.headers.authorization);
                            res.status(401).json({ "msg": "Invalid AccessToken!", "error": "Invalid AccessToken"});    
                        }
                    },
                    function(err){
                        debug("error", "checkApiAccess Error", { "msg": err.message, "stack": err });
                        res.status(500).json({ "msg": "An Error Occured!", "error": err});
                    }
                )
            }else{
                debug("debug", "checkApiAccess access_token is invalid", req.headers.authorization);
                res.status(401).json({ "msg": "Invalid AccessToken!", "error": "Invalid AccessToken"}); 
            }
            
        } catch (ex) {
            debug("error", "checkApiAccess", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
    }

    var getCRMUrl = function(req){
        //We have to strip the _ querystring value sent with Ajax calls else NMS will complain

        var url = req.path;
        url = url.replace("/uisptools/api/crm/", "");
        if(req.query){
            let queryString = "";
            for (const [key, value] of Object.entries(req.query)) {
                if(key === "_"){

                }else{
                    if(queryString ===""){
                        queryString = queryString + "?";
                    }else{
                        queryString = queryString + "&";
                    }
                    queryString = queryString  + key + "=" + encodeURIComponent(value);
                }
            }
            url = url + queryString;
        }
        

        return url;
    }

    var getCRM = function (req, res) {
        try {
            //Validate that the AccessToken is valid and get the CRM Auth Token from 
            let accessToken = res.locals.accessToken;

            let crmUrl = getCRMUrl(req);
            let ucrmOptions = {
                url:crmUrl,  //figure this out from request 
                rejectUnauthorized: true, 
                sendAppKey:true,  
                method : req.method
                //ucrmAppKey:accessToken.loginData.nmsLoginData.x-auth-token
            }
            self.objOptions.uispApiRequestHandler.handleUcrmRequest(ucrmOptions).then(
                function(data){
                    res.json(data);
                },
                function(err){
                    debug("error", "getCRM", { "msg": err.message, "stack": err.stack });
                    res.status(500).json({ "msg": "An Error Occured!", "error": err });
                }


            )
           
            
        } catch (ex) {
            debug("error", "getCRM", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }

    };

    var getNMSUrl = function(req){
        //We have to strip the _ querystring value sent with Ajax calls else NMS will complain

        var url = req.path;
        url = url.replace("/uisptools/api/nms/", "");
        if(req.query){
            let queryString = "";
            for (const [key, value] of Object.entries(req.query)) {
                if(key === "_"){

                }else{
                    if(queryString ===""){
                        queryString = queryString + "?";
                    }else{
                        queryString = queryString + "&";
                    }
                    queryString = queryString  + key + "=" + encodeURIComponent(value);
                }
            }
            url = url + queryString;
        }
        
        
        return url;
    }


    var getNMS = function (req, res) {
        try {
            //Need to add Code to Validate that the AccessToken is valid, requester is a Valid NMS Login and then get the NMS Auth Token from nmsLoginData

            let accessToken = res.locals.accessToken;

            let nmsUrl = getNMSUrl(req);
            let unmsOptions = {
                url:nmsUrl,  //figure this out from request 
                rejectUnauthorized: true, 
                nmsAuthToken:accessToken.loginData.nmsLoginData["x-auth-token"],
                method : req.method
            }
            self.objOptions.uispApiRequestHandler.handleUnmsRequest(unmsOptions).then(
                function(data){
                    res.json(data);
                },
                function(err){
                    debug("error", "getNMS", { "msg": err.message, "stack": err.stack });
                    res.status(500).json({ "msg": "An Error Occured!", "error": err });
                }


            )
           
            
        } catch (ex) {
            debug("error", "getCRM", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }

    };

    var createRefreshToken = function (options){
        var deferred = Defer();
        
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
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
                        //refreshToken.expiresAt = moment().add( refreshToken.expiresIn, 'seconds').toISOString();
                        refreshToken.loginData = options.loginData;
                        collection.insertOne(refreshToken,                            
                                function (err, doc) {
                                    assert.equal(err, null);
                                    client.close();
                                    delete refreshToken.loginData;
                                    deferred.resolve(refreshToken);
                                });
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
            });
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
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection('ut_AccessToken');
                    if (collection) {
                        var accessToken = {};
                        accessToken.access_token = uuidv4();
                        accessToken.expiresIn = 3600; 
                         
                        let expiresOn = new Date();
                        expiresOn = new Date(expiresOn.getTime() + (accessToken.expiresIn * 1000));
                        accessToken.expiresOn = expiresOn //used by Momgo to auto delete when expired with a expireAfterSecond index
                        //accessToken.expiresOn = moment().add( accessToken.expiresIn, 'seconds');  //This is set in a expireAfterSecond index in Mongo To Autodelete the row
                        //accessToken.expiresAt = moment().add( accessToken.expiresIn, 'seconds').toISOString();  //This is set in a expireAfterSecond index in Mongo To Autodelete the row
                        accessToken.refresh_token = options.refreshToken.refresh_token;
                        accessToken.refreshToken = options.refreshToken; //used as a way to prevent having to fetch refreshToken as this way it is a short cache as its a 10 minute of all connected users
                        accessToken.loginData = options.loginData;
                        //data.authTokenExpiresOn = moment().add( data.expireAt, 'seconds').toISOString();
                        collection.insertOne(accessToken,                            
                                function (err, doc) {
                                    assert.equal(err, null);
                                    client.close();
                                    delete accessToken.refreshToken
                                    delete accessToken.loginData
                                    deferred.resolve(accessToken);
                                });
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
            });
        } catch (ex) {
            debug('error', 'createAuthToken',  { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        
        return deferred.promise;     
    }


    


    

    var getAccessToken = function(options){
        var deferred = Defer();
        //We may want to add a redis server to the mix to cache accessToken and RefreshTokens for performance since they both have expiration dates
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
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
            });
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
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
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
            });
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

    var getUserInfo = function (req, res) {
        try {
            
            //We strip and message the loginData to fit the application here

            var userInfo = cleanLoginData(res.locals.accessToken.loginData)
            
            res.json(userInfo);
            
            
        } catch (ex) {
            debug("error", "getUserInfo", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
    };

    //Login Unms
// routes.post('/login/loginNms', function (req, res) {
//     var loginData = {};
//     self.objOptions.uispApiRequestHandler.publicLoginNms(req.body).then(
//         function (data) {
//             try {
//                 uispToolsApiRequestHandler.createRefreshToken(data).then(
//                     function(data){
//                         delete data.loginData
//                         delete data.nmsAuthToken
//                         if(data.access_token){
//                             res.setHeader("Cache-Control", "no-store");
//                             res.setHeader("Pragma", "no-cache");
//                         }
//                         res.json(data);
//                     },
//                     function(error){
//                         handleHttpRequestError(req,res,error);    
//                     }
//                 )
//             } catch (ex) {
//                 handleHttpRequestError(req, res, ex);
//             }
//         },
//         function (error) {
//             handleHttpRequestError(req,res,error);
//         }
//     );
// });

// //Login Unms
// routes.post('/login/loginCms', function (req, res) {
//     var loginData = {};
//     self.objOptions.uispApiRequestHandler.publicLoginCrm(req.body).then(
//         function (data) {
//             try {
//                 uispToolsApiRequestHandler.createRefreshToken(data).then(
//                     function(data){
//                         delete data.loginData;
//                         if(data.access_token){
//                             res.setHeader("Cache-Control", "no-store");
//                             res.setHeader("Pragma", "no-cache");
//                         }
//                         res.json(data);
//                     },
//                     function(error){
//                         handleHttpRequestError(req,res,error);    
//                     }
//                 )
//             } catch (ex) {
//                 handleHttpRequestError(req, res, ex);
//             }
//         },
//         function (error) {
//             handleHttpRequestError(req, res, error);
//         }
//     );
// });

//Login CRM if not Successfull try login as unms
var loginBoth =  function (req, res) {
    var loginData = {};
    if(req.body && req.body.grant_type === "refresh_token"){
        try {
            getRefreshToken({refresh_token: req.body.refresh_token}).then(
                function(refreshToken){   
                    if(refreshToken === null){
                        debug("debug", "loginBoth refresh_token not found", req.body.refresh_token);
                        res.status(401).json({ "msg": "Invalid RefreshToken!", "error": "Invalid RefreshToken"});
                    }else{
                        var loginData = refreshToken.loginData 
                        delete refreshToken.loginData                 
                        createAccessToken({refreshToken: refreshToken,loginData:loginData}).then(
                            function(accessToken){
                                delete loginData.crmLoginData
                                delete accessToken._id
                                delete refreshToken._id
                                delete refreshToken.loginData
                                loginData.accessToken = accessToken;
                                loginData.refreshToken = refreshToken
                                res.setHeader("Cache-Control", "no-store");
                                res.setHeader("Pragma", "no-cache");
                                loginData = cleanLoginData(loginData);
                                res.json(loginData);
                            },
                            function(err){
                                handleHttpRequestError(req,res,err);                        
                            }
                        )
                    }
                    
                },
                function(err){
                    handleHttpRequestError(req,res,err);    
                }
            );
        }catch (ex) {
            handleHttpRequestError(req, res, ex);
        }
    }else{
        self.objOptions.uispApiRequestHandler.publicLoginCrm(req.body).then(
            function (loginData) {
                try {
                    createRefreshToken({loginData:loginData}).then(
                        function(refreshToken){                       
                            createAccessToken({refreshToken: refreshToken,loginData:loginData}).then(
                                function(accessToken){
                                    delete loginData.crmLoginData
                                    delete accessToken._id
                                    delete refreshToken._id
                                    loginData.accessToken = accessToken;
                                    loginData.refreshToken = refreshToken
                                    res.setHeader("Cache-Control", "no-store");
                                    res.setHeader("Pragma", "no-cache");
                                    loginData = cleanLoginData(loginData);
                                    res.json(loginData);
                                },
                                function(err){
                                    handleHttpRequestError(req,res,err);                        
                                }
                            )
                            
                        },
                        function(err){
                            handleHttpRequestError(req,res,err);    
                        }
                    )
                } catch (ex) {
                    handleHttpRequestError(req, res, ex);
                }
            },
            function (error) {
                //Try to login to NMS see if its an Admin loging in 
                self.objOptions.uispApiRequestHandler.publicLoginNms(req.body).then(
                    function (loginData) {
                        try {
                            createRefreshToken({loginData:loginData}).then(
                                function(refreshToken){
                                    createAccessToken({refreshToken: refreshToken, loginData:loginData}).then(
                                        function(accessToken){
                                            delete loginData.nmsLoginData
                                            delete loginData.nmsAuthToken
                                            delete accessToken._id
                                            delete refreshToken._id
                                            loginData.refreshToken = refreshToken
                                            loginData.accessToken = accessToken;
                                            res.setHeader("Cache-Control", "no-store");
                                            res.setHeader("Pragma", "no-cache");
                                            loginData = cleanLoginData(loginData);
                                            res.json(loginData);
                                        },
                                        function(err){
                                            handleHttpRequestError(req,res,err);                        
                                        }
                                    )
                                },
                                function(error){
                                    handleHttpRequestError(req,res,error);    
                                }
                            )  
                        } catch (ex) {
                            handleHttpRequestError(req,res,ex);
                        }
                    },
                    function (error) {
                        //Login Failed
                        handleHttpRequestError(req,res,error);
                    }
                );
            }
        );
    }
};

//Login Page Public Data
var getLoginData = function (req, res) {
    var loginData = {};
    self.objOptions.uispApiRequestHandler.publicLoginData().then(
        function (data) {
            try {
                res.json(data);
            } catch (ex) {
                handleHttpRequestError(req,res,ex);
            }
        },
        function (error) {
            handleHttpRequestError(req,res,error);
        }
    );
};

// var getUserInfo = function (req, res) {
//     var loginData = {};
//     self.objOptions.uispApiRequestHandler.loginUserInfo().then(
//         function (data) {
//             try {
//                 res.json(data);
//             } catch (ex) {
//                 handleHttpRequestError(req,res,ex);
//             }
//         },
//         function (error) {
//             handleHttpRequestError(req,res,error);
//         }
//     );
// }


var getErrorObject = function(error){
    //this is used to normolize errors that are raised and returned to the client
    var errorData = {
        error : {
            msg: "An Error Occured!", error: "An Error Occured!", stack: ""
        },
        statuscode:500
    }
    
    if (error.msg) {
        errorData.error.msg = errorData.error.msg + ' ' + error.msg;
    }
    if (error.message) {
        errorData.error.msg = errorData.error.msg + ' ' + error.message;
    }
    
    if (error.error) {
        if (typeof (error.error) === "string") {
            errorData.error.error = error.error;
        } else {
            if (error.error.msg) {
                errorData.error.error = error.error.msg;
            } else if (error.error.message) {
                errorData.error.error = error.error.message;
            }
            if (error.error.stack) {
                errorData.error.stack = error.error.stack;
            }
        }
    } else if (typeof (error) === "string") {
        errorData.error.error = error;
    }
    
    
    if (error.code) {
        errorData.statuscode = error.code;
    }else if (error.statusCode) {
        errorData.statuscode = error.statusCode;
    } else if (error.statuscode) {
        errorData.statuscode = error.statuscode;
    }
    return errorData;
}

var handleHttpRequestError = function (req, res, error) {
    let errorData = getErrorObject(error)
    res.status(errorData.statuscode).json(errorData.error);
};


    var getMenuItems = function (req, res) {
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection('ut_PageContent');
                    var findQuery = { linkMenuDisplay: true, deleted: false };
                    var projections = { linkText: 1, linkUrl: 1, linkTarget: 1, pageContentGuid: 1, roleId: 1, contentType: 1 };
                    var sort = [['displayOrder', 1]];
                    if (collection) {
                        collection.find(findQuery)
                            .project(projections)
                            .sort(sort)
                            .toArray(
                                function (err, docs) {
                                    assert.equal(err, null);
                                    res.json(docs);
                                    client.close();
                                });
                    } else {
                        return null;
                    }
                } catch (ex) {
                    debug("error", "getMenuItems", { "msg": ex.message, "stack": ex.stack });
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                    client.close();
                }
            });
        } catch (ex) {
            debug("error", "getMenuItems", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }

    };

    var getPage = function (req, res, options) {
        try {
            let findDefaults = { deleted: false }
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection('ut_PageContent');
                    var findQuery = extend({}, options.find, findDefaults);
                    var projections = { linkText: 1, linkUrl: 1, linkTarget: 1, pageContentGuid: 1, pageDescription: 1, pageKeywords: 1, updatedDate: 1, pageTitle: 1, contentType: 1, extendedData:1, content: 1 };
                    if (collection) {
                        collection.findOne(findQuery, { projection: projections },
                                function (err, docs) {
                                    assert.equal(err, null);
                                    res.json(docs);
                                    client.close();
                                });
                    } else {
                        return null;
                    }
                } catch (ex) {
                    debug("error", "getPage", { "msg": ex.message, "stack": ex.stack });
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                    client.close();
                }

            });
        } catch (ex) {
            debug("error", "getPage", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
    };


    var getPageByLinkUrl = function (req, res) {
        let linkPath = req.path.replace("/uisptools/api/PageContent/LinkUrl/", "");
        let options = { find: { linkUrl: linkPath }};
        getPage(req, res, options);
    }

    var getPageByPageContentGuid = function (req, res) {
        let options = {
            find: { pageContentGuid: req.params.guid }
        };
        getPage(req, res, options);
    }

    self.createRefreshToken = createRefreshToken;
    self.createAccessToken = createAccessToken;
    self.getRefreshToken = getRefreshToken;
    self.bindRoutes = BindRoutes;
    self.cleanLoginData = cleanLoginData;
    self.handleHttpRequestError = handleHttpRequestError
    self.getErrorObject = getErrorObject;
    self.checkApiAccess = checkApiAccess;
};
module.exports = UispToolsApiRequestHandler;