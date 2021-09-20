"use strict";
const appName = 'ucrmApiRequestHandler';
const extend = require('extend');
const Defer = require('node-promise').defer;
const http = require('http');
const https = require('https');
const Logger = require("./logger.js");
//const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

var UcrmApiRequestHandler = function (options) {
    var self = this;
    var defaultOptions = {
        ucrmAppKey: null,
        ucrmUrl:null
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
    

    

    var remoteDownloader = function (options) {
        var deferred = Defer();
        try {
            if (options.url.startsWith('http://') === true) {
                protocol = http;
            }
            else {
                protocol = https;
            }

            if (!options.url) {
                debug("warning", "remoteDownloader", "No url to download");
                
                deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": new Error('No url to download') }); 
                return deferred.promise;
            }
            var protocol;
            var opc = {};
            try {

                if (options.cert && options.cert !== '') {
                    opc.cert = fs.readFileSync(path.join(__dirname, options.cert));
                } 
                if (opc.key && opc.key !== '') {
                    opc.key = fs.readFileSync(path.join(__dirname, options.key));
                } 
            } catch (ex) {
                debug('error', 'remoteDownloader', ' error reading certificate files ', ex);
                if (opc.key) {
                    delete opc.key;
                }
                if (opc.cert) {
                    delete opc.cert;
                }
            }
            if (options.rejectUnauthorized !== undefined) {
                opc.rejectUnauthorized = options.rejectUnauthorized
            }
            opc.followAllRedirects = true;
            if (options.method) {
                opc.method = options.method;
            }else {
                opc.method = "GET";
            
            }
            var request = protocol.request(options.url, opc, function (res) {

                var data = '';

                res.on('data', function (d) {
                    data = data + d;
                });

                res.on('end', function () {
                    var error = null;
                    try {
                        if (res.statusCode === 200) {
                            data = JSON.parse(data); 
                            if (options.injectCookies) {
                                data.cookies = res.cookies;
                            }
                            if (options.injectHeaders) {
                                data.headers = res.headers;
                            }
                            deferred.resolve(data);
                        } else {
                            debug('warning', 'remoteDownloader', 'Error downloading the remote JSON', 'download.error', data);
                            try {
                                data = JSON.parse(data); 
                                if (data.message | data.message === "") {
                                    data.msg = data.message;
                                    delete data.message;
                                }
                                if (data.msg === undefined || data.msg === "") {
                                    data.msg = "An Error Occured!";
                                }
                            } catch (ex) {
                                debug('error', 'remoteDownloader',  {msg:ex.message, stack:ex.stack});
                                data = { "code": 500, "msg": "An Error Occured!", "error": e };
                            }
                            deferred.reject(data);
                        }
                    } catch (e) {
                        debug('error', 'remoteDownloader', 'Error reading the downloaded JSON:', 'download.error', {
                            e: e,
                            response: data,
                            url: url
                        });
                        deferred.reject({"code": 500, "msg": "An Error Occured!", "error": e }); 
                        return;
                    }
                    
                });

            });

            request.on('error', function (e) {
                debug('error', 'remoteDownloader', 'Error downloading the remote JSON', 'download.error',e);
                deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": e }); 
            });
            if (options.headers) {
                for (let [key, value] of Object.entries(options.headers)) {
                    request.setHeader(key, value);
                }               
            } 
            let body = null;
            if (options.data) {
                if (typeof (options.data) === "object") {
                    body = JSON.stringify(options.data);
                } else {
                    body = options.data;
                }
            }
            request.end(body);
        } catch (ex) {
            debug('error', 'remoteDownloader',  {msg:ex.message, stack:ex.stack});
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex }); 
        }
        return deferred.promise;
    };

    var handleUcrmRequest = function (options) {
        
        
        options.url = objOptions.ucrmUrl + options.url; 

        if (options.headers === undefined) {
            options.headers = {};
        }
        if (options.headers['Content-Type'] === undefined) {
            options.headers['Content-Type'] = 'application/json';
        }
        if (objOptions.rejectUnauthorized !== undefined) {
            options.rejectUnauthorized = objOptions.rejectUnauthorized;
        }
        if (options.sendAppKey !== false) {
            options.headers['X-Auth-App-Key'] = objOptions.ucrmAppKey;
        }

        return remoteDownloader(options);
    };

    var handleUnmsRequest = function (options) {
        options.url = objOptions.unmsUrl + options.url;

        if (options.headers === undefined) {
            options.headers = {};
        }
        if (options.headers['Content-Type'] === undefined) {
            options.headers['Content-Type'] = 'application/json';
        }
        if (objOptions.rejectUnauthorized !== undefined) {
            options.rejectUnauthorized = objOptions.rejectUnauthorized;
        }
        if (options.sendAppKey !== false) {
            options.headers['X-Auth-App-Key'] = objOptions.unmsAppKey;
        }
        if (options.authtoken) {
            options.headers['x-auth-token'] = options.authtoken;
        }
        return remoteDownloader(options);
    };

    var publicLoginCrm = function (options) {
        var deferred = Defer();
        try {
            var normLogin = { username: options.username, password: options.password };
            var myOptions = extend({}, { url: 'clients/authenticated', method: "POST", data:normLogin }  );
            handleUcrmRequest(myOptions).then(
                function (data) {
                    try {
                        if (data.code === 404) {
                            //data.msg = "Invalid Username or Password!";
                            debug('warning', 'publicLoginCrm',  "Invalid UserName or Password", options.username );
                            deferred.reject({ "code": 500, "msg": "Invalid Username or Password!", "error": "Invalid Username or Password!" });
                        }else{
                            let retval = {
                                firstName : data.firstName,
                                lastName : data.lastName,
                                username : data.username,
                                userType : "crm",
                                userId : data.id
                                ,loginData : data //we can limit what comes back here so not to reveal to much information 
                            }; 
                            deferred.resolve(retval);
                        }
                    } catch (ex) {
                        debug('error', 'publicLoginCrm',  {msg:ex.message, stack:ex.stack});
                        deferred.reject({ "code": 500, "msg": "An Error Occured during Login!", "error": ex });
                    }

                },
                function (error) {
                    if (error.code === 404) {
                        error.msg = "Invalid Username or Password!";
                    }
                    debug('error', 'publicLoginCrm', error);
                    deferred.reject(error);
                }
            );

        } catch (ex) {
            debug('error', 'publicLoginCrm', {msg:ex.message, stack:ex.stack});
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    };

    var publicLoginMobile = function (options) {
        var deferred = Defer();
        try {
            var normLogin = { user: options.username, password: options.password, expiration: 604800, sliding: 1, deviceName:"UISPTools" };
            handleUcrmRequest({ url: 'mobile/login', data: normLogin, method: "POST", sendAppKey: false }).then(
                function (data) {
                    try {
                        if (data.code === 404) {
                            debug('warning', 'publicLoginMobile',  "Invalid Username or Password!", options.username );
                            //data.msg = "Invalid Username or Password!";
                            deferred.reject({ "code": 500, "msg": "Invalid Username or Password!", "error": "Invalid Username or Password!" });
                        }else{
                            deferred.resolve(data);
                        }
                    } catch (ex) {
                        debug('error', 'publicLoginMobile',  "Invalid Username or Password!", ex );
                        deferred.reject({ "code": 500, "msg": "An Error Occured during Login!", "error": ex });
                    }

                },
                function (error) {
                    if (error.code === 404) {
                        error.msg = "Invalid Username or Password!";
                    }
                    debug('error', 'publicLoginMobile', error );
                    deferred.reject(error);
                }
            );

        } catch (ex) {
            debug('error', 'publicLoginMobile', ex );
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    };

    var publicLoginNms = function (options) {
        var deferred = Defer();
        try {
            var normLogin = { username: options.username, password: options.password, sessionTimeout: 259200000 };
            handleUnmsRequest({ url: 'user/login', data: normLogin, method: "POST", sendAppKey: false, injectHeaders: true}).then(
                function (data) {
                    try {
                        if (data.code === 401) {
                            //data.msg = "Invalid Username or Password!";
                            debug('error', 'publicLoginNms',  "Invalid Username or Password!", options.username );
                            //deferred.resolve(data);
                            deferred.reject({ "code": 500, "msg": "Invalid Username or Password!", "error": "Invalid Username or Password!" });
                        } else {
                            if (data.headers["x-auth-token"]) {
                                data["x-auth-token"] = data.headers["x-auth-token"];
                                delete data.headers;
                            }
                            let retval = {
                                firstName : data.firstName,
                                lastName : data.lastName,
                                username : data.username,
                                userType : "nms",
                                userId : data.id,
                                nmsAuthToken : data["x-auth-token"]
                                ,loginData : data //we can limit what comes back here so not to reveal to much information 
                            };
                            deferred.resolve(retval);
                        }
                        
                    } catch (ex) {
                        debug('error', 'publicLoginNms', ex);
                        deferred.reject({ "code": 500, "msg": "An Error Occured during Login!", "error": ex });
                    }

                },
                function (error) {
                    if (error.statusCode === 401) {
                        error.msg = "Invalid Username or Password!";
                    }
                    debug('error', 'publicLoginNms', error);
                    deferred.reject(error);
                }
            );

        } catch (ex) {
            debug('error', 'publicLoginNms', ex);
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }

    var publicLoginData = function (options) {
        var deferred = Defer();
        try {

            if (self.cache.loginData) {
                deferred.resolve(self.cache.loginData);
            } else {



                var loginData = {};
                
                handleUcrmRequest({ url: 'organizations' }).then(
                    function (data) {
                        try {
                            for (let i = 0; i < data.length; i++) {
                                let item = data[i];
                                if (item.selected) {
                                    loginData.organization = { name: item.name, email: item.email, street1: item.street1, street2: item.street2, city: item.city, zipCode: item.zipCode, countryId: item.countryId, stateId: item.stateId, locale: item.locale, website: item.website, phone: item.phone };
                                    break;
                                }
                            }
                            loginData.ucrmUrl = objOptions.ucrmUrl.substring(0, objOptions.ucrmUrl.indexOf('/', 8) + 1);
                            self.cache.loginData = loginData;
                            if (loginData.organization) {
                                handleUcrmRequest({ url: 'countries/' + loginData.organization.countryId }).then(
                                    function (country) {
                                        try {
                                            loginData.organization.country = country.name;
                                            loginData.organization.countryCode = country.code;
                                            //Retrieve collection of States.Available for United States and Canada only.
                                            if (loginData.organization.countryCode === "US" || loginData.organization.countryCode === "CA") {
                                                handleUcrmRequest({ url: 'countries/states/' + loginData.organization.stateId }).then(
                                                    function (state) {
                                                        try {
                                                            loginData.organization.state = state.name;
                                                            loginData.organization.stateCode = state.code;
                                                            //Retrieve collection of States.Available for United States and Canada only.
                                                            deferred.resolve(loginData);
                                                        } catch (ex) {
                                                            debug('error', 'publicLoginData', "An Error Occured Fetching Country!", ex);
                                                            deferred.reject({ "msg": "An Error Occured Fetching Country!", "error": ex });
                                                        }

                                                    },
                                                    function (error) {
                                                        debug('error', 'publicLoginData', "An Error Occured Fetching Country!", error);
                                                        deferred.reject({ "code": 500, "msg": "An Error Occured Fetching Country!", "error": error });
                                                    }

                                                )
                                            } else {
                                                //Not US or Canada so just populate Country
                                                deferred.resolve(loginData);
                                            }

                                        } catch (ex) {
                                            debug('error', 'publicLoginData', "An Error Occured Fetching Country!", ex);
                                            deferred.reject({ "code": 500, "msg": "An Error Occured Fetching Country!", "error": ex });
                                        }
                                    },
                                    function (error) {
                                        debug('error', 'publicLoginData', error);
                                        deferred.reject(error);
                                    }
                                )
                            } else {
                                deferred.resolve(loginData);
                            }

                        } catch (ex) {
                            debug('error', 'publicLoginData', ex);
                            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
                        }

                    },
                    function (error) {
                        debug('error', 'publicLoginData', error);
                        deferred.reject(error);
                    }
                );
            }
        } catch (ex) {
            debug('error', 'publicLoginData', ex);
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }


    var ucrmVersion = function (options) {
        var deferred = Defer();
        try {

            if (self.cache.ucrmVersion) {
                deferred.resolve(self.cache.ucrmVersion);
            } else {
                handleRequest({ url: 'version' }).then(
                    function (data) {
                        try {
                           
                            self.cache.ucrmVersion = data;
                            debug('debug', 'ucrmVersion', self.cache.ucrmVersion);
                            deferred.resolve(data);

                        } catch (ex) {
                            debug('error', 'ucrmVersion', ex);
                            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
                        }

                    },
                    function (error) {
                        debug('error', 'ucrmVersion', error);
                        deferred.reject(error);
                    }
                );
            }
        } catch (ex) {
            debug('error', 'ucrmVersion', ex);
            deferred.reject({ "code": 500, "msg": "An Error Occured!", "error": ex });
        }
        return deferred.promise;
    }

    var flushCache = function () {
        self.cache = {};
    }

    
    self.handleUcrmRequest = handleUcrmRequest;
    self.publicLoginData = publicLoginData;
    self.flushCache = flushCache;
    self.publicLoginCrm = publicLoginCrm;
    self.publicLoginNms = publicLoginNms;
    self.publicLoginMobile = publicLoginMobile;
    self.ucrmVersion = ucrmVersion;
};
module.exports = UcrmApiRequestHandler;