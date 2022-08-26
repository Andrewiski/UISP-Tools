"use strict";
const appName = "syslogMongo";
const extend = require('extend');
const path = require('path');
const Defer = require('node-promise').defer;
//const Logger = require("./logger.js");
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');

var SyslogMongo = function (options) {
    var self = this;
    var defaultOptions = {
        mongoDbServerUrl: "",
        mongoDbDatabaseName:"",
        mongoClientOptions: {useUnifiedTopology: true},
        mongoSyslogCollectionName: "syslog",
        mongoDeviceCollectionName: "devices",
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
    

    

    var BindRoutes = function (routes, rootPath) {
        
        try {
            routes.get(path.join(rootPath,'logItems/:ip'), getLogItemsByIp);
            routes.get(path.join(rootPath,'logItems/:mac'), getLogItemsByMac);
        } catch (ex) {
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
        
    }


    var upsertDevice = function (data){
        var deferred = Defer();
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection(objOptions.mongoDeviceCollectionName);
                    if (collection) {
                        collection.insertOne(data,                            
                                function (err, doc) {
                                    assert.equal(err, null);
                                    client.close();
                                    deferred.resolve(data);
                                });
                    } else {
                        debug("error", "upsertDevice", { "msg": "Not Able to Open MongoDB Connection", "stack": "" });
                        client.close();
                        deferred.reject({ "code": 500, "msg": "Not Able to Open MongoDB Connection", "error": "collection is null"});
                    }
                } catch (ex) {
                    debug("error", "upsertDevice", { "msg": ex.message, "stack": ex.stack });
                    try{
                        client.close();
                    }catch(ex4){
                        debug("error", "upsertDevice", "client.close()", { "msg": ex4.message, "stack": ex4.stack });
                    }
                    deferred.reject({ "code": 500, "msg": ex.message, "error": ex });
                }
            });
        } catch (ex) {
            debug('error', 'upsertDevice',  { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        
        return deferred.promise;     
    }

    var insertLogItem = function (data){
        var deferred = Defer();
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection(objOptions.mongoSyslogCollectionName);
                    if (collection) {
                        if (data.expireAt === undefined || data.expireAt === null){
                            data.expireAt = 259200; // 3 * 24 * 60 * 60;  //expire Token in 3 days ie it will get auto deleted by Mongo
                        }
                        collection.insertOne(data,                            
                                function (err, doc) {
                                    assert.equal(err, null);
                                    client.close();
                                    deferred.resolve(data);
                                });
                    } else {
                        debug("error", "insertLogItem", { "msg": "Not Able to Open MongoDB Connection", "stack": "" });
                        client.close();
                        deferred.reject({ "code": 500, "msg": "Not Able to Open MongoDB Connection", "error": "collection is null"});
                    }
                } catch (ex) {
                    debug("error", "insertLogItem", { "msg": ex.message, "stack": ex.stack });
                    try{
                        client.close();
                    }catch(ex4){
                        debug("error", "insertLogItem", "client.close()", { "msg": ex4.message, "stack": ex4.stack });
                    }
                    deferred.reject({ "code": 500, "msg": ex.message, "error": ex });
                }
            });
        } catch (ex) {
            debug('error', 'insertLogItem',  { "msg": ex.message, "stack": ex.stack });
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        
        return deferred.promise;     
    }

    var MongoErrorHandler = function (req,res,err){
        res.status(500).json({"msg": "An Error Occured!", "error": err});
    }

    var getLogItems = function (req, res, options) {
        try {
            let findDefaults = { deleted: false }
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection(objOptions.mongoSyslogCollectionName);
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

    var getDevices = function (options) {
        var deferred = Defer();
        try {
            let findDefaults = null;
            var projectionDefaults = null;
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection(objOptions.mongoDeviceCollectionName);
                    
                    var findQuery = null; 
                    if(options && (options.find || findDefaults)){
                        findQuery = extend({}, options.find, findDefaults);
                    }
                    if (collection) {
                        collection.find(findQuery).toArray().then(
                            function(results){
                                deferred.resolve(results);
                                client.close();
                            },
                            function(err){
                                //{"msg": "An Error Occured!", "error": err}
                                deferred.reject(err);
                                client.close();
                            }
                            
                        )
                                
                    } else {
                        return null;
                    }
                } catch (ex) {
                    debug("error", "getDevices", { "msg": ex.message, "stack": ex.stack });
                    deferred.reject(ex);
                    client.close();
                }

            });
        } catch (ex) {
            debug("error", "getDevices", { "msg": ex.message, "stack": ex.stack });
            deferred.reject(ex);
        }
        return deferred.promise;
    };

    var getDevice = function (req, res, options) {
        try {
            let findDefaults = { deleted: false }
            const client = new MongoClient(objOptions.mongoDbServerUrl,objOptions.mongoClientOptions);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    const db = client.db(objOptions.mongoDbDatabaseName);
                    const collection = db.collection(objOptions.mongoDeviceCollectionName);
                    var findQuery = extend({}, options.find, findDefaults);
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


   

    
    self.bindRoutes = BindRoutes;
    self.insertLogItem = insertLogItem;
    self.upsertDevice = upsertDevice;
    self.getLogItems = getLogItems;
    self.getDevices = getDevices;
};
module.exports = SyslogMongo;