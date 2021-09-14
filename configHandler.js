"use strict";

const path = require('path');
const extend = require('extend');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const { now } = require('moment');

var ConfigHandler = function (options, defaultConfig) {
    var self = this;
    var defaultOptions = {
        configFileName: 'config.json',
        configDirectory: "config"
    };
    var objOptions = extend({}, defaultOptions, options);
    self.objOptions = objOptions;

    var getConfig = function () {
        
        var configFileSettings = {};
        var configFileFolder = path.join(__dirname, self.objOptions.configDirectory);
        var configFileFullPath = path.join(configFileFolder, self.objOptions.configFileName);
        console.log("info", "Config File Path", configFileFullPath);
        try {
            if(fs.existsSync(configFileFullPath) === false){
                console.log("info", "Config File Missing Creating with Defaults");
                try {
                    if(fs.existsSync(configFileFolder)=== false){
                        fs.mkdirSync(configFileFolder,{recursive:true})
                    }
                    //if we Can't read the config its a new config or a broken config so we create it using the defaults
                    fs.writeFileSync(configFileFullPath, JSON.stringify(defaultConfig, null, 2));
                } catch (ex) {
                    console.log("error", "Error Creating New Config File just using defaults", ex);
                }
            }else{
                var strConfig = fs.readFileSync(configFileFullPath);
                configFileSettings = JSON.parse(strConfig);
            }
        } catch (ex) {
            //This needs to stay Console.log as writetolog will not function as no config
            try {
                console.log("error", "Error Reading or Creating a Config File", configFileFullPath, ex);
                //if we Can't read the config its a new config or a broken config so we create it using the defaults
                if(fs.existsSync(configFileFullPath) === true){
                    let now = new Date();
                    var badConfigFilePath = configFileFolder +  now.getFullYear() + "-"+ now.getMonth() + "-" + now.getDate() + "-" + now.getHours() + "-" + now.getMinutes() + "-" + now.getSeconds() + "-" + self.objOptions.configFileName +  ".bad";
                    console.log("error", "Error Reading Existing Config File moving to ", badConfigFilePath);
                    fs.copyFileSync(configFileFullPath, badConfigFilePath);
                    
                }
                fs.writeFileSync(configFileFullPath, JSON.stringify(defaultConfig, null, 2));
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