"use strict";

const path = require('path');
const extend = require('extend');
const winston = require('winston');
require('winston-daily-rotate-file');

var Logger = function (options) {
    var self = this;
    var defaultOptions = {
        appLogLevels:{
            application:{"app": "info"}
        },
        logEventHandler: null,
        logFolder: "log",
        debugUtilEnabled: true,
        debugUtilName:"app",
        logToFile: true
    }
    var objOptions = extend({}, defaultOptions, options);
    self.objOptions = objOptions;
   
    const debug = require('debug')(objOptions.debugUtilName);

    let winstonstreamerLogLevel = objOptions.logLevel;
    switch (options.logLevel) {
        case "panic":
        case "fatal":
            winstonstreamerLogLevel = "error";
            break;
        case "warning":
            winstonstreamerLogLevel = "warn";
            break;
        case "verbose":
            winstonstreamerLogLevel = "debug";
            break;
        case "trace":
            winstonstreamerLogLevel = "silly";
            break;
    }

    const logFile = null;
    
    if(objOptions.logToFile){
        logFile = winston.createLogger({
            level: winstonstreamerLogLevel,
            exitOnError: false,
            transports: [
                //new winston.transports.Console(),
                new (winston.transports.DailyRotateFile)({
                    filename: path.join(objOptions.logFolder, '%DATE%-' + objOptions.logName + '.log'),
                    datePattern: 'YYYY-MM-DD-HH',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d'
                })
            ]
        });
    }

    var isObject = function (a) {
        return (!!a) && (a.constructor === Object);
    };

    var isArray = function (a) {
        return (!!a) && (a.constructor === Array);
    };

    var arrayPrint = function (obj) {
        var retval = '';
        var i;
        for (i = 0; i < obj.length; i++) {
            if (retval.length > 0) {
                retval = retval + ', ';
            }
            retval = retval + objPrint(obj[i]);
        }

        return retval;
    };

    var objPrint = function (obj) {


        if (obj === null) {
            return 'null';
        } else if (obj === undefined) {
            return 'undefined';
        } else if (isArray(obj)) {
            return arrayPrint(obj);
        } else if (isObject(obj)) {
            return JSON.stringify(obj);
        } else {
            return obj.toString();
        }

    };



    var logLevels = {
        'quiet': -8, //Show nothing at all; be silent.
        'panic': 0, //Only show fatal errors which could lead the process to crash, such as an assertion failure.This is not currently used for anything.
        'fatal': 8, //Only show fatal errors.These are errors after which the process absolutely cannot continue.
        'error': 16, //Show all errors, including ones which can be recovered from.
        'warning': 24, //Show all warnings and errors.Any message related to possibly incorrect or unexpected events will be shown.
        'info': 32, //Show informative messages during processing.This is in addition to warnings and errors.This is the default value.
        'verbose': 40,  //Same as info, except more verbose.
        'debug': 48, //Show everything, including debugging information.
        'trace': 56
    };

    var getLevelIntegerValue = function (logLevelName) {

        if (logLevels[logLevelName]) {
            return logLevels[logLevelName];
        } else {
            return 100;  // Not found dump it to the screen like its a trace
        }
    };

    var getLogLevel = function ( appName, appSubname) {

        if (objOptions.appLogLevels[appName] && objOptions.appLogLevels[appName][appSubname]) {
            return getLevelIntegerValue(objOptions.appLogLevels[appName][appSubname]);
        } else {
            return 100;  // Not found dump it to the screen like its a trace
        }
    };

    var shouldLog = function ( appName, appSubname, logLevelName) {

        if (getLevelIntegerValue(logLevelName) <= getLogLevel( appName, appSubname) ) {
            return true;
        } else {
            return false;
        }
    };

    var log = function (appName, appSubname, logLevel) {
        try {
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

            
            if (shouldLog(appName, appSubname, logLevel, objOptions.logLevel) === true) {

                if(objOptions.debugUtilEnabled){
                    debug(arrayPrint(args));
                }
    
                if (args.length > 1) {
                    args.shift(); //remove the appName from the array
                }
                if (args.length > 1) {
                    args.shift(); //remove the appSubname from the array
                }
                if (args.length > 1) {
                    args.shift(); //remove the loglevel from the array
                }
                let logData = { timestamp: new Date(), appName: appName, appSubname:appSubname, logLevel: logLevel, args: args };

                let winstonLogLevel = logLevel;
                switch (logLevel) {
                    case "panic":
                    case "fatal":
                        winstonLogLevel = "error";
                        break;
                    case "warning":
                        winstonLogLevel = "warn";
                        break;
                    case "verbose":
                        winstonLogLevel = "debug";
                        break;
                    case "trace":
                        winstonLogLevel = "silly";
                        break;
                }
                if(objOptions.logToFile){
                    logFile.log({ timestamp: new Date(), level: winstonLogLevel, appName: appName, appSubname:appSubname, message: args });
                }
                
                

                try {
                    if (objOptions.logEventHandler) {
                        objOptions.logEventHandler(logData);
                    }
                } catch (ex) {
                    console.log("error", "logger.js", "An Error Occured calling logEventHandler", ex);
                }
            }

        } catch (ex) {
            console.log("error", "logger.js",  'Error on log', ex);
        }
    };

    self.log = log;
    self.isObject = isObject;
    self.isArray = isArray;
    self.arrayPrint = arrayPrint
    self.objPrint = objPrint;
};
module.exports = Logger;