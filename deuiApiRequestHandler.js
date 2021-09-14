"use strict";
const appName = "deApiRequestHandler";
const extend = require('extend');
const Defer = require('node-promise').defer;
const Logger = require("./logger.js");
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
const assert = require('assert');


var DeApiRequestHandler = function (options) {
    var self = this;
    var defaultOptions = {
        mongoDbServerUrl: "",
        mongoDbDatabaseName:"",
        mongoClientOptions: {useUnifiedTopology: true}
    };
    var objOptions = extend({}, defaultOptions, options);
    self.objOptions = objOptions;

    var debug = null;
    if (self.objOptions.appLogger){
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
            self.objOptions.appLogger.log(appName, "app", loglevel, args);
        }
    }else{
        debug = require('debug')(appName);
    }

    
    self.cache = {};
    

    

    var BindRoutes = function (routes) {
        
        try {

            routes.get('/detools/api/PageContent/MenuItems', getMenuItems);
            routes.get('/detools/api/PageContent/PageContentGuid/:guid', getPageByPageContentGuid);
            routes.get('/detools/api/PageContent/LinkUrl/*', getPageByLinkUrl);
                

        } catch (ex) {
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
        
    }

    var createRefreshToken = function (data){
        var deferred = Defer();
        
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection('de_RefreshToken');
                    if (collection) {
                        collection.insertOne(data,                            
                                function (err, doc) {
                                    assert.equal(err, null);
                                    
                                    client.close();
                                    deferred.resolve(doc);
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

    var getMenuItems = function (req, res) {
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection('de_PageContent');
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
                    const collection = db.collection('de_PageContent');
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
        let linkPath = req.path.replace("/detools/api/PageContent/LinkUrl/", "");
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
};
module.exports = DeApiRequestHandler;