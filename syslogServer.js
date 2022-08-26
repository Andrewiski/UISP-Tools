
'use strict';
    
const appName = 'syslogserver';
const dgram = require("dgram");
const extend = require('extend');
const moment = require('moment');
//const Deferred = require('node-promise').defer;
var SyslogServer = function (options) {
    
    var self = this;
    var defaultOptions = {
        port: 514,
        sysLoggerEventHandler: null,
        sysLogToDebug: false,
        useIp6: false,
        logUtilHelper: null
    };

    var commonData = {
        connections : {}
    }
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

    var server4 = null;
    var server6 = null;

    var start = function (){
        try{
            server4 = dgram.createSocket("udp4");

            server4.on('listening', function() {
                var addressInfo = this.address();
                debug("info", "app", "syslog server listening " + addressInfo.address + ":" + addressInfo.port);
            });
            server4.on('close', function() {
                var addressInfo = this.address();
                debug("info",  "syslog server closed" + addressInfo.address + ":" + addressInfo.port);
            });
            server4.on('error', socketErrorHandler);
            server4.on('message', socketMessageHandler);
            server4.bind(self.options.port);

            if(self.options.useIp6){
                server6 = dgram.createSocket("udp6");
                server6.on('listening', function() {
                    var addressInfo = this.address();
                    debug("info",  "syslog server listening ipv6" + addressInfo.address + ":" + addressInfo.port);
                });
                server6.on('close', function() {
                    var addressInfo = this.address();
                    debug("info", "syslog server closed ipv6" + addressInfo.address + ":" + addressInfo.port);
                });
                server6.on('error', socketErrorHandler);
                server6.on('message', socketMessageHandler);
                server6.bind(self.options.port);
                    
                
            }   
        }catch(ex){
            debug("error", "start", ex);
            throw ex;
        }
    }
    
    var stop = function (){
        if(server4){
            server4.close();
        }
        if(server6){
            server6.close();
        }
    }
    
    /* * * *
        callback functions
     * * * */

    var grandstreamParser = function(msg){
        try{
            if(msg.startsWith("HT801") === true || msg.startsWith("HT802") === true){
                var retval = {};
                var position = 0;
                var index = 0;
                var startPosition = 0;
                retval.rawMsg = msg;
                while (position < msg.length){
                    
                    if (msg[position] === " "){
                        let value = ""; 
                        value = msg.substr(startPosition,position - startPosition);
                        index++;
                        position++;
                        startPosition = position;
                        switch(index){
                            case 1:
                                retval.deviceType = value;
                                break;
                            case 2:
                                retval.mac = value.replace("[", "").replace("]","");
                                break;
                            case 3:
                                // [1.0.27.2]TR069
                                let split3 = value.indexOf("]");
                                if(split3 > 0){
                                    retval.sourceVersion = value.substr(0,split3).replace("[", "").replace("]","");
                                    if(split3+1 < value.length){
                                        retval.source = value.substr(split3+1);
                                    }
                                }else{
                                    retval.source = value;
                                }
                                break;
                            case 4:
                                retval.logType = value.replace("[", "").replace("]","");
                                let logLevel = retval.logType.toLowerCase();
                                if(logLevel === "debug" || logLevel === "info" ||  logLevel === "error" || logLevel === "warning"  ){
                                    retval.logLevel = logLevel;
                                }else{
                                    retval.logLevel = "info";
                                }
                                break;
                            case 5:
                                retval.version = value.replace("[", "").replace("]","");
                                break;
                            case 6:
                                retval.msg = msg.substr(position);
                                break;
                        }
                    }else{
                        position++;
                    }
                }
                return retval;
            }
            else{
                return null;
            }
        }catch(ex){
             debug("error", "grandstreamParser", msg, ex);
             return null;       
        }
    }

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

    var getLogLevelNumber = function (logLevel){
        if(logLevels[logLevel]){
            return logLevels[logLevel];
        }else{
            return logLevels["info"];
        }
    }
    
    var socketMessageHandler = function(msg, rinfo) {
        
        
        try {
            // replace : in IPv6 addresses
            let ip = rinfo.address.replace(/:/g, ".");
        
            let now = moment().toISOString();
            if (!commonData.connections[ip]) {
                commonData.connections[ip] = {	date : now};    
            }

            let message  = msg.toString().replace(/^\s+|\s+$/g, '');
            
            var parsed = grandstreamParser(message);
            if (parsed !== null){
                message = parsed;
                message.ip = ip;
                message.timestamp = now;
                if(message.logLevel){
                    message.logLevelNum = getLogLevelNumber(message.logLevel);
                }else{
                    message.logLevel = "info";
                    message.logLevelNum = getLogLevelNumber(message.logLevel);
                }
                
            }else{
                message.ip = ip;
                message.logLevel = "info";
                message.logLevelNum = 12;
                message.timestamp = now;
                message.msg = msg;
            }

            if(self.options.sysLogToAppLogger && self.options.appLogger){
                debug("debug", ip, now,  message);               
            }
            if(self.options.sysLoggerEventHandler){
                try{
                    self.options.sysLoggerEventHandler(ip, now,  message) 
                }catch(ex){
                    debug( "error",  "socketMessageHandler", "sysLoggerEventHandler", "byref Event Handler has Errored",  ex);        
                }
            }
        }catch(err) {
            debug( "error",  "socketMessageHandler" ,err);
        }   
    };
    
    var socketErrorHandler = function(exception) {
        
        if (self.options.port < 1024) {
            debug( "warn",  'Your port is set lower than 1024, maybe you are not privileged to use it.');
        }
        debug("error",  "A Socketerror occured!", exception);
    };
    
    self.connections = commonData.connections;
    self.start = start;
    self.stop = stop;
};
module.exports =   SyslogServer;