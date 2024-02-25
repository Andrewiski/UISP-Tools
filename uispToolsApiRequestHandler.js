"use strict";
const appName = "uispToolsApiRequestHandler";
const extend = require('extend');
const Defer = require('node-promise').defer;


var moment = require('moment');

const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const { nextTick } = require('process');
const { noop } = require('jquery');

var UispToolsApiRequestHandler = function (options) {
    var self = this;
    var defaultOptions = {
        logUtilHelper:null,
        uispToolsApiHandler: null,
        urlPrefix: "",
        allowDirectUispQuerys: true
    };
    
    self.options = extend({}, defaultOptions, options);

    var debug = null;
    if (self.options.logUtilHelper){
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
            self.options.logUtilHelper.log(appName, "app", loglevel, args);
        }
    }else{
        debug = require('debug')(appName);
    }

    
    self.cache = {};
    

    

    var BindRoutes = function (routes) {
        
        try {
            
            routes.get('/' + self.options.urlPrefix + 'api/PageContent/MenuItems', getMenuItems);
            routes.get('/' + self.options.urlPrefix + 'api/PageContent/PageContentGuid/:guid', getPageByPageContentGuid);
            routes.get('/' + self.options.urlPrefix + 'api/PageContent/LinkUrl/*', getPageByLinkUrl);
            routes.post('/' + self.options.urlPrefix + 'login/loginBoth', loginBoth);
            
            routes.get('/' + self.options.urlPrefix + 'login/loginData', getLoginData);
            routes.get('/' + self.options.urlPrefix + 'errorHandlerTest', errorHandlerTest);
            routes.get('/' + self.options.urlPrefix + 'errorHandlerTestRawError', errorHandlerTestRawError);
            routes.get('/' + self.options.urlPrefix + 'api/settings/anonymousClientSideSettings', getAnonymousClientSideSettings);
            //Any Routes above this line are not Checked for Auth and are Public
            routes.get('/' + self.options.urlPrefix + 'api/*', checkApiAccess);
            routes.get('/' + self.options.urlPrefix + 'api/UserInfo', getUserInfo);
            routes.get('/' + self.options.urlPrefix + 'login/logout', checkApiAccess);
            routes.get('/' + self.options.urlPrefix + 'login/logout', logout);
            
            //Any /uisptools/api Routes above this are basic User Authed if below then only SuperAdmin can call them
            routes.get('/' + self.options.urlPrefix + 'api/*', checkSuperAdminApiAccess);
            routes.post('/' + self.options.urlPrefix + 'api/*', checkSuperAdminApiAccess);
            routes.delete('/' + self.options.urlPrefix + 'api/*', checkSuperAdminApiAccess);

            //These should be accessed server side via the baseServerSideJs calls so not to reveil contents
            //routes.get('/' + self.options.urlPrefix + '/api/pluginUserData/:pluginName', handlePluginUserDataRequest);
            // routes.post('/' + self.options.urlPrefix + '/api/pluginData/:pluginName', savePluginData);
            // routes.post('/' + self.options.urlPrefix + '/api/pluginUserData/:pluginName', savePluginUserData);
            // routes.delete('/' + self.options.urlPrefix + '/api/pluginData/:pluginName', deletePluginData);
            // routes.delete('/' + self.options.urlPrefix + '/api/pluginUserData/:pluginName', deletePluginUserData);

            //Only Admin plugins can call these directly plugins should only expose what should exposed as you can pull credit card data etc.
            if(self.options.allowDirectUispQuerys){
                routes.get('/' + self.options.urlPrefix + 'api/crm/*', getCRMData);
                routes.get('/' + self.options.urlPrefix + 'api/nms/*', getNMSData);
                routes.post('/' + self.options.urlPrefix + 'api/crm/*', getCRMData);
                routes.post('/' + self.options.urlPrefix + 'api/nms/*', getNMSData);
                routes.delete('/' + self.options.urlPrefix + 'api/crm/*', getCRMData);
                routes.delete('/' + self.options.urlPrefix + 'api/nms/*', getNMSData);
            }
        } catch (ex) {
           debug("error", ex.msg, ex.stack);
        }
        
    }

    

    var getAnonymousClientSideSettings = function(req, res, next){
        try {
            
            var clientSideSettings = {
                googleApiKey: self.options.googleApiKey
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
                self.options.uispToolsApiHandler.getAccessToken({access_token:access_token}).then(
                    function(accessToken){
                        if(accessToken != null){
                            //double check not Expired etc but not sure why Mongo would not delete it
                            res.locals.accessToken = accessToken;
                            if(next){
                                next("route")
                            }
                        }else{
                            debug("debug", "checkApiAccess access_token not found", req.headers.authorization);
                            res.status(401).json({ "msg": "Invalid AccessToken!", "error": "Invalid AccessToken"});    
                        }
                    },
                    function(err){
                        debug("error", "checkApiAccess Error", { "msg": err.message, "stack": err });
                        if(res.writable === true){
                            res.status(500).json({ "msg": "An Error Occured!", "error": err});
                        }
                    }
                )
            }else{
                debug("debug", "checkApiAccess access_token is invalid", req.headers.authorization);
                if(res.writable === true){ //if(res.closed === false){
                    res.status(401).json({ "msg": "Invalid AccessToken!", "error": "Invalid AccessToken"}); 
                }
            }
            
        } catch (ex) {
            debug("error", "checkApiAccess", { "msg": ex.message, "stack": ex.stack });
            if(res.writable === true){
                res.status(500).json({ "msg": "An Error Occured!", "error": ex });
            }
        }
    }

    var checkSuperAdminApiAccess = function (req, res, next) {
        try {

            let isSuperAdminNext = function(){
                if(res.locals.accessToken && res.locals.accessToken.loginData.userType === "nms" && res.locals.accessToken.loginData.nmsLoginData.role === "superadmin" ){
                    if(next !== undefined || next !== null){
                        next("route")
                    }
                }else{
                    debug("debug", "checkSuperAdminApiAccess", "Not Super Admin", req.headers.authorization);
                    res.status(403).json({ "msg": "Invalid AccessToken Not Super Admin!", "error": "Invalid AccessToken Not Super Admin"});    
                }
            }

            if(res.locals.accessToken == undefined){
                checkApiAccess(req,res,isSuperAdminNext)
            }else{
            
                isSuperAdminNext();
            }
                    
            
        } catch (ex) {
            debug("error", "checkSuperAdminApiAccess", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
    }

    var getCRMUrl = function(req){
        //We have to strip the _ querystring value sent with Ajax calls else NMS will complain

        var url = req.path;
        url = url.replace('/' + self.options.urlPrefix + '/api/crm/', '');
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

    var crmApiQuery = function (options) {
        return new Promise((resolve, reject) => {
            //Need to add Code to Validate that the AccessToken is valid, requester is a Valid NMS Login and then get the NMS Auth Token from nmsLoginData
            let crmOptions = {
                url:options.url,  
                rejectUnauthorized: options.rejectUnauthorized || true, 
                method : options.method,
                sendAppKey: options.sendAppKey || true,
            }
            self.options.uispToolsApiHandler.handleCrmRequest(crmOptions).then(
                function(data){
                    resolve(data);
                },
                function(err){
                    debug("error", "crmApiQuery", { "msg": err.message, "stack": err.stack });
                    reject(err);
                }
            )
        });            
    };


    var getCRMData = function (req, res) {
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
            crmApiQuery(ucrmOptions).then(
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
        url = url.replace('/' + self.options.urlPrefix + '/api/nms/', "");
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


    var nmsApiQuery = function (options) {
        return new Promise((resolve, reject) => {
            //Need to add Code to Validate that the AccessToken is valid, requester is a Valid NMS Login and then get the NMS Auth Token from nmsLoginData
            let unmsOptions = {
                url:options.url,  //figure this out from request 
                rejectUnauthorized: options.rejectUnauthorized || true, 
                nmsAuthToken:options.accessToken.loginData.nmsLoginData["x-auth-token"],
                method : options.method
            }
            self.options.uispToolsApiHandler.handleUnmsRequest(unmsOptions).then(
                function(data){
                    resolve(data);
                },
                function(err){
                    debug("error", "nmsApiQuery", { "msg": err.message, "stack": err.stack });
                    reject(err);
                }
            )
        });            
    };

    var getNMSData = function (req, res) {
        try {            
            let unmsOptions = {
                url:getNMSUrl(req),
                method : req.method,
                accessToken:res.locals.accessToken,
                rejectUnauthorized: true
            }
            nmsApiQuery(unmsOptions).then(
                function(data){
                    res.json(data);
                },
                function(err){
                    debug("error", "getCRM", { "msg": err.message, "stack": err.stack });
                    res.status(500).json({ "msg": "An Error Occured!", "error": err });
                }
            );
        } catch (ex) {
            debug("error", "getNMSRaw", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }

    };

    var getUserInfo = function (req, res) {
        try {
            
            //We strip and message the loginData to fit the application here

            var userInfo = self.options.uispToolsApiHandler.cleanLoginData(res.locals.accessToken.loginData)
            
            res.json(userInfo);
            
            
        } catch (ex) {
            debug("error", "getUserInfo", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
    };

    


var loginBoth =  function (req, res) {
    var loginData = {};
    if(req.body && req.body.grant_type === "refresh_token"){
        try {
            self.options.uispToolsApiHandler.getRefreshToken({refresh_token: req.body.refresh_token}).then(
                function(refreshToken){   
                    if(refreshToken === null){
                        debug("debug", "loginBoth refresh_token not found", req.body.refresh_token);
                        res.status(401).json({ "msg": "Invalid RefreshToken!", "error": "Invalid RefreshToken"});
                    }else{
                        var loginData = refreshToken.loginData 
                        delete refreshToken.loginData                 
                        self.options.uispToolsApiHandler.createAccessToken({refreshToken: refreshToken,loginData:loginData}).then(
                            function(accessToken){
                                delete loginData.crmLoginData
                                delete accessToken._id
                                delete refreshToken._id
                                delete refreshToken.loginData
                                loginData.accessToken = accessToken;
                                loginData.refreshToken = refreshToken
                                res.setHeader("Cache-Control", "no-store");
                                res.setHeader("Pragma", "no-cache");
                                loginData = self.options.uispToolsApiHandler.cleanLoginData(loginData);
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
        self.options.uispToolsApiHandler.publicLoginCrm(req.body).then(
            function (loginData) {
                try {
                    self.options.uispToolsApiHandler.createRefreshToken({loginData:loginData}).then(
                        function(refreshToken){                       
                            self.options.uispToolsApiHandler.createAccessToken({refreshToken: refreshToken,loginData:loginData}).then(
                                function(accessToken){
                                    delete loginData.crmLoginData
                                    delete accessToken._id
                                    delete refreshToken._id
                                    loginData.accessToken = accessToken;
                                    loginData.refreshToken = refreshToken
                                    res.setHeader("Cache-Control", "no-store");
                                    res.setHeader("Pragma", "no-cache");
                                    loginData = self.options.uispToolsApiHandler.cleanLoginData(loginData);
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
                self.options.uispToolsApiHandler.publicLoginNms(req.body).then(
                    function (loginData) {
                        try {
                            self.options.uispToolsApiHandler.createRefreshToken({loginData:loginData}).then(
                                function(refreshToken){
                                    self.options.uispToolsApiHandler.createAccessToken({refreshToken: refreshToken, loginData:loginData}).then(
                                        function(accessToken){
                                            delete loginData.nmsLoginData
                                            delete loginData.nmsAuthToken
                                            delete accessToken._id
                                            delete refreshToken._id
                                            loginData.refreshToken = refreshToken
                                            loginData.accessToken = accessToken;
                                            res.setHeader("Cache-Control", "no-store");
                                            res.setHeader("Pragma", "no-cache");
                                            loginData = self.options.uispToolsApiHandler.cleanLoginData(loginData);
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


var logout =  function (req, res) {

    var refresh_token = res.locals.accessToken.refresh_token;
    
    var isNmsLogin = (res.locals.accessToken.loginData.userType === "nms");
    
    var logoutPromises = []
    if(isNmsLogin){
        var nmsAuthToken = res.locals.accessToken.loginData.nmsLoginData["x-auth-token"];
        let unmsOptions = {
            url:'user/logout',  //figure this out from request 
            rejectUnauthorized: true, 
            nmsAuthToken:nmsAuthToken,
            method : "POST"
        }
        logoutPromises.push(self.options.uispToolsApiHandler.handleUnmsRequest(unmsOptions))
    }
    logoutPromises.push(self.options.uispToolsApiHandler.deleteRefreshToken({refresh_token: refresh_token}));
    logoutPromises.push(self.options.uispToolsApiHandler.deleteAccessToken({refresh_token: refresh_token}))
    Promise.all(logoutPromises)
    .then(
        function(){
            res.json({success:true});
        },
        function(ex){
            handleHttpRequestError(req,res,ex, "logout" );                        
        }
    )
        
    
};


//Login Page Public Data
var getLoginData = function (req, res) {
    var loginData = {};
    self.options.uispToolsApiHandler.publicLoginData().then(
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
//     self.options.uispToolsApiHandler.loginUserInfo().then(
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

var handleHttpRequestError = function (req, res, err, debugData) {
    let errorData = getErrorObject(err)
    if (debugData){
        debug("error", "handleHttpRequestError", debugData, errorData);
    }else{
        debug("error", "handleHttpRequestError", errorData);
    }
    res.status(errorData.statuscode).json(errorData.error);
};


var getMenuItems = function (req, res, next) {
    try {
        let options = {}
        self.options.uispToolsApiHandler.getMenuItems(options).then(
            function (docs) {
                res.json(docs);
            },
            function(err){
                handleHttpRequestError(req, res, err);
            }
        )
    } catch (ex) {
        handleHttpRequestError(req, res, ex);
    }
}
    

    var getPage = function (req, res, options) {
        try {
            let defaultOptions = {
                find: { deleted: false },
                projections: { linkText: 1, linkUrl: 1, linkTarget: 1, pageContentGuid: 1, pageDescription: 1, pageKeywords: 1, updatedDate: 1, pageTitle: 1, contentType: 1, extendedData:1, content: 1 }
            }
            let m_options = extend({}, options, defaultOptions); 
            m_options.find = extend({}, options.find, defaultOptions.find);
            m_options.projections = extend({}, options.projections, defaultOptions.projections);
            self.options.uispToolsApiHandler.getPageContent(m_options).then(
                function (docs) {
                    res.json(docs);
                },
                function(err){
                    handleHttpRequestError(req, res, err);
                }
            )
        } catch (ex) {
            handleHttpRequestError(req, res, ex);
        }
    };


    var getPageByLinkUrl = function (req, res) {
        let linkPath = req.path.replace('/' + self.options.urlPrefix + 'api/PageContent/LinkUrl/', "/");
        let options = { find: { linkUrl: linkPath }};
        getPage(req, res, options);
    }

    var getPageByPageContentGuid = function (req, res) {
        let options = {
            find: { pageContentGuid: req.params.guid }
        };
        getPage(req, res, options);
    }

    
    self.bindRoutes = BindRoutes;
    self.handleHttpRequestError = handleHttpRequestError
    self.getErrorObject = getErrorObject;
    self.checkApiAccess = checkApiAccess;
    self.checkSuperAdminApiAccess = checkSuperAdminApiAccess;
    self.nmsApiQuery = nmsApiQuery;
    self.crmApiQuery = crmApiQuery;

};
module.exports = UispToolsApiRequestHandler;