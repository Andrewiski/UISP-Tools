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

        //localDebugOverides for testing runing localy add environment localDebug=True  or Set LocalDebug=True on Windows

        if (process.env.localDebug === 'true') {
            var localDebugConfig = {
                "configPath": "config/localDebug",
            };

            defaultConfig = extend({}, defaultConfig, localDebugConfig);

        }


        var configFileSettings = {};
        try {
            if(fs.existsSync(path.join(__dirname, self.objOptions.configFileName)) === false){
                console.log("info", "Config File Missing Creating with Defaults", ex);
                try {
                    //if we Can't read the config its a new config or a broken config so we create it using the defaults
                    fs.writeFileSync(path.join(__dirname, self.objOptions.configFileName), JSON.stringify(defaultConfig, null, 2));
                } catch (ex) {
                    console.log("error", "Error Creating New Config File just using defaults", ex);
                }
            }else{
                var strConfig = fs.readFileSync(path.join(__dirname, self.objOptions.configFileName));
                configFileSettings = JSON.parse(strConfig);
            }
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