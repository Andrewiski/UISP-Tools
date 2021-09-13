"use strict";
const debug = require('debug')('deApiRequestHandler');
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
        mongoDbDatabaseName:""
    };
    var objOptions = extend({}, defaultOptions, options);
    self.objOptions = objOptions;
    self.appLogger = null;
    self.cache = {};
    var appLogHandler = function (logData) {
        //add to the top of the
        privateData.logs.push(logData);

        if (privateData.logs.length > objOptions.maxLogLength) {
            privateData.logs.shift();
        }
        var debugArgs = [];
        //debugArgs.push(logData.timestamp);
        debugArgs.push(logData.logLevel);
        for (let i = 0; i < logData.args.length; i++) {
            debugArgs.push(logData.args[i]);
        }
        debug(appLogger.arrayPrint(debugArgs));
    }
    if (objOptions.enableLog) {
        self.appLogger = new Logger({
            logLevel: objOptions.logLevel,
            logName: "deapirequesthandler",
            logEventHandler: appLogHandler,
            logFolder: objOptions.logDirectory
        })
    }

    var writeToLog = function (loglevel) {

        if (self.appLogger) {
            self.appLogger(arguments);
        } else {
            let args = []
            for (let i = 0; i < arguments.length; i++) {
                if (arguments[i] === undefined) {
                    args.push("undefined");
                } else if (arguments[i] === null) {
                    args.push("null");
                }
                else {
                    args.push(JSON.parse(JSON.stringify(arguments[i])))
                }

            }
            debug(args);
        }
    };


    var BindRoutes = function (routes) {
        
        try {

            routes.get('/detools/api/PageContent/MenuItems', getMenuItems);
            routes.get('/detools/api/PageContent/PageContentGuid/:guid', getPageByPageContentGuid);
            routes.get('/detools/api/PageContent/LinkUrl/*', getPageByLinkUrl);
                

        } catch (ex) {
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }
        
    }

    

    var getMenuItems = function (req, res) {
        try {
            const client = new MongoClient(objOptions.mongoDbServerUrl);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    console.log("Connected correctly to server");

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
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                    client.close();
                }
            });
        } catch (ex) {
            res.status(500).json({ "msg": "An Error Occured!", "error": ex });
        }

    };

    var getPage = function (req, res, options) {
        try {
            let findDefaults = { deleted: false }

            const client = new MongoClient(objOptions.mongoDbServerUrl);
            // Use connect method to connect to the Server
            client.connect(function (err, client) {
                try {
                    assert.equal(null, err);
                    console.log("Connected correctly to server");

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
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                    client.close();
                }

            });
        } catch (ex) {
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