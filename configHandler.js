"use strict";

const path = require('path');
const extend = require('extend');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

var ConfigHandler = function (options) {
    var self = this;
    var defaultOptions = {
        configFileName: 'config/config.json'
    };
    var objOptions = extend({}, defaultOptions, options);
    self.objOptions = objOptions;

    var getConfig = function () {
        var defaultConfig = {
            "configDirectory": "config",
            "logDirectory": "log",
            "adminRoute": "/admin",
            "logLevel": "info",
            "useHttp": true,
            "useHttps": true,
            "httpport": 1336,
            "httpsport": 1337,
            "adminUsername": "admin",
            "adminPasswordHash": "25d5241c69a02505c7440e2b4fa7804c",  //  DEToolsPassword
            "httpsServerKey": "server.key",
            "httpsServerCert": "server.cert",
            "opensslPath":""
        };

        //localDebugOverides for testing runing localy add environment localDebug=True  or Set LocalDebug=True on Windows

        if (process.env.localDebug === 'true') {
            var localDebugConfig = {
                "configPath": "config/localDebug",
            };

            defaultConfig = extend({}, defaultConfig, localDebugConfig);

        }


        var configFileSettings = {};
        try {
            var strConfig = fs.readFileSync(path.join(__dirname, self.objOptions.configFileName));
            configFileSettings = JSON.parse(strConfig);
        } catch (ex) {
            //This needs to stay Console.log as writetolog will not function as no config
            try {
                console.log("error", "Error Reading Config File", ex);
                //if we Can't read the config its a new config or a broken config so we create it using the defaults
                fs.writeFileSync(path.join(__dirname, self.objOptions.configFileName), JSON.stringify(defaultConfig, null, 2));
            } catch (ex) {
                console.log("error", "Error Creating New Config File just using defaults", ex);
            }
        }
        var config = extend({}, defaultConfig, configFileSettings);
        return config;
    };

    self.getConfig = getConfig;
};
module.exports = ConfigHandler;