"use strict";
const appName = "uispToolsApiRequestHandler";
const extend = require('extend');
const Defer = require('node-promise').defer;

var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');

var UispToolsApiRequestHandler = function (options) {
    var self = this;
    var defaultOptions = {
        mongoDbServerUrl: "",
        mongoDbDatabaseName:"",
        mongoClientOptions: {useUnifiedTopology: true},
        logUtilHelper:null
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
            routes.get('/uisptools/api/UserInfo', getUserInfo);    

        } catch (ex) {
           debug("error", ex.msg, ex.stack);
        }
        
    }

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



    var getUserInfo = function (req, res) {
        try {
            let access_token = req.headers.authorization;
            if(access_token && access_token.startsWith("Bearer ")){
                access_token = access_token.substring(7);
                getAccessToken({access_token:access_token}).then(
                    function(accessToken){
                        if(accessToken != null){
                            res.json(accessToken.loginData);
                        }else{
                            debug("debug", "getUserInfo access_token not found", req.headers.authorization);
                            res.status(401).json({ "msg": "Invalid AccessToken!", "error": "Invalid AccessToken"});    
                        }
                    },
                    function(err){
                        debug("error", "getUserInfo Error", { "msg": err.message, "stack": err });
                        res.status(500).json({ "msg": "An Error Occured!", "error": err});
                    }
                )
            }else{
                debug("debug", "getUserInfo access_token is invalid", req.headers.authorization);
                res.status(401).json({ "msg": "Invalid AccessToken!", "error": "Invalid AccessToken"}); 
            }
            
        } catch (ex) {
            debug("error", "getUserInfo", { "msg": ex.message, "stack": ex.stack });
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
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
                    var projections = { linkText: 1, linkUrl: 1, linkTarget: 1, pageContentGuid: 1, roleId: 1 };
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
                    var projections = { linkText: 1, linkUrl: 1, linkTarget: 1, pageContentGuid: 1, pageDescription: 1, pageKeywords: 1, updatedDate: 1, pageTitle: 1, content: 1 };
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
    self.bindRoutes = BindRoutes;
};
module.exports = UispToolsApiRequestHandler;