'use strict';
const appName = "acmeCertificateManager"
const ACME = require('@root/acme');
//const ACME = require('acme');

const fs = require('fs');

const Keypairs = require('@root/keypairs');
const CSR = require('@root/csr');
const PEM = require('@root/pem');
const path = require('path');
const Deferred = require('node-promise').defer;
const moment = require('moment');
const punycode = require('punycode');

const { Certificate, PrivateKey } = require('@fidm/x509');

module.exports.create = function (defaults) {

    var debug = null;
    if (defaults.appLogger){
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
            defaults.appLogger.log(appName, "app", loglevel, args);
        }
    }else{
        debug = require('debug')(appName);
    }
    

    var handlers = {
        getOptions: function () {
            return handlers._private.options;
        }
        , _private: {
            inited: false,
            account: null,
            packageAgent: 'DE-acmeCertificateManager/1.3',
            directoryUrl: 'https://acme-v02.api.letsencrypt.org/directory', // 'https://acme-v02.api.letsencrypt.org/directory' 'https://acme-staging-v02.api.letsencrypt.org/directory' 
            acme: null,
            options: defaults,
            accountPrivateKey: null,
            accountPublicKey: null
        }
        , getAccount: function () {

            let deferred = Deferred();
            handlers.loadAccount().then(
                function () {
                    deferred.resolve();
                },
                function (ev, msg) {
                    handlers.generateAccount().then(
                        function () {
                            deferred.resolve();
                        },
                        function (ev, msg) {
                            deferred.reject(ev, msg);
                        }
                    );
                }
            );
            return deferred.promise;
        }

        , loadAccount: function () {

            let deferred = Deferred();
            let privateKey = null;
            let publicKey = null;
            let needToCreateAccount = false;
            try {
                debug('Loading saved ACME account ..');
                if (fs.existsSync(path.join(__dirname, handlers._private.options.acmeAccountFile))) {
                    let accountJson = fs.readFileSync(path.join(__dirname, handlers._private.options.acmeAccountFile));
                    let accountData = JSON.parse(accountJson);
                    handlers._private.account = accountData.account;
                    privateKey = accountData.privateKey;
                    publicKey = accountData.publicKey;
                } else {
                    needToCreateAccount = true;
                }
                
                if (needToCreateAccount === false) {
                        Keypairs.import({ pem: privateKey }).then(
                            function (loadedPrivateKey) {
                                debug('info', 'Loaded saved ACME account private key');
                                handlers._private.accountPrivateKey = loadedPrivateKey;
                            
                                Keypairs.import({ pem: publicKey }).then(
                                    function (loadedPublicKey) {
                                        debug('info', 'Loaded saved ACME account public key');
                                        handlers._private.accountPublicKey = loadedPublicKey;
                                        deferred.resolve();
                                    },
                                    function (ev, msg) {
                                        debug('error', 'Error Loading ACME account public key', ev, msg);
                                        deferred.reject(ev, msg);
                                    }
                                );
                            },
                            function (ev, msg) {
                                debug('error', 'Error Loading ACME account private key', ev, msg);
                                deferred.reject(ev, msg);
                            }
                        );
                } else {
                    deferred.reject('info', 'unable to load Acme account file');
                }
            } catch (ex) {
                debug('error', 'Error loading ACME account keyFiles', ex);
                deferred.reject('error', ex);
            }
            return deferred.promise;
        }

        , generateAccount: function () {

            let deferred = Deferred();
            try {
                debug('Creating new ACME account keypair..');
                Keypairs.generate({ kty: 'EC', format: 'jwk' }).then(
                    function (newKeyPairs) {
                        debug('info', 'Created new ACME account keypair');
                        handlers._private.accountPrivateKey = newKeyPairs.private;
                        handlers._private.accountPublicKey = newKeyPairs.public;
                        
                        let agreeToTerms = true;
                        debug('info','registering new ACME account...');
                        handlers._private.acme.accounts.create({
                            subscriberEmail: handlers._private.options.subscriberEmail,
                            agreeToTerms: agreeToTerms,
                            accountKey: handlers._private.accountPrivateKey
                        }).then(
                            function (account) {
                                debug('info', 'created new Lets Encrypt account with id', account.key.kid);
                                let accountData = {
                                    account: account,
                                    //pem: null
                                    privateKey: null,
                                    publicKey: null
                                };
                                Keypairs.export({ jwk: newKeyPairs.private, encoding: 'pem',  public: false }).then(
                                    function (pem) {
                                        accountData.privateKey = pem;
                                        Keypairs.export({ jwk: newKeyPairs.public, encoding: 'pem', public: true }).then(
                                            function (pem) {
                                                accountData.publicKey = pem;
                                                let accountJson = JSON.stringify(accountData);
                                                if (fs.existsSync(path.join(__dirname, handlers._private.options.acmeAccountFile))) {
                                                    fs.copyFileSync(path.join(__dirname, handlers._private.options.acmeAccountFile), path.join(__dirname, path.dirname(handlers._private.options.acmeAccountFile), moment().format("YYYYMMDDhhmmss") + '_' + path.posix.basename(handlers._private.options.acmeAccountFile)));
                                                    
                                                }
                                                fs.writeFileSync(path.join(__dirname, handlers._private.options.acmeAccountFile), accountJson);
                                                deferred.resolve();

                                            },
                                            function (ev, msg) {
                                                debug('error', 'Error Exporting Pem ', ev, msg);
                                                deferred.reject(ev, msg);
                                            }
                                        );       

                                    },
                                    function (ev, msg) {
                                        debug('error', 'Error Exporting Private Key to Pem ', ev, msg);
                                        deferred.reject(ev, msg);
                                    }
                                );


                                
                                
                            },
                            function (ev, msg) {
                                debug('error', 'Error creating new Lets Encrypt account ', ev, msg);
                                deferred.reject(ev, msg);
                            }
                        );
                    },
                    function (ev, msg) {
                        debug('error', 'Error creating new keypairs ', ev, msg);
                        deferred.reject(ev, msg);
                    }
                );
            } catch (ex) {
                debug('error', 'Error creating ACME account', ex);
                deferred.reject('error', ex);
            }
            return deferred.promise;
        }
        , getKeyPair: function (options) {
            let deferred = Deferred();
            try {
                handlers.loadRsaKeyPair(options).then(
                    function (loadedKeyPair) {
                        loadedKeyPair.fileMissing = false;
                        deferred.resolve(loadedKeyPair);
                    },
                    function (ev, msg) {
                        
                        
                        debug('warning', 'loading keypair from rsa key file failed! Generate New Key ', ev, msg || '');
                        
                        handlers.generateKeyPair(options).then(
                            function (generatedKeyPair) {
                                generatedKeyPair.fileMissing = true;
                                deferred.resolve(generatedKeyPair);
                            },
                            function (ev, msg) {
                                deferred.reject(ev, msg);
                            }
                        );
                        
                    }
                );
            }
            catch (ex) {
                debug('error', 'Error get Server Key Pair', ex);
                deferred.reject('error', ex);
            }
            return deferred.promise;
        }
        , generateKeyPair: function (options) {
            let deferred = Deferred();

            try {
                let serverKeys = {
                    privateKeyPem: null,
                    privateKey: null,
                    publicKey: null
                };

                Keypairs.generate({ kty: 'RSA', format: 'jwk' }).then(
                    function (newKeyPairs) {
                        serverKeys.privateKey = newKeyPairs.private;
                        serverKeys.publicKey = newKeyPairs.public;
                        Keypairs.export({ jwk: newKeyPairs.private, encoding: 'pem', public: false }).then(
                            function (pem) {
                                serverKeys.privateKeyPem = pem;                               
                                deferred.resolve(serverKeys);
                            },
                            function (ev, msg) {
                                debug('error', 'Error Exporting Private Key to Pem ', ev, msg);
                                deferred.reject(ev, msg);
                            }
                        );
                    },
                    function (ev, msg) {
                        debug('error', 'Error Generating Key Pair ', ev, msg);
                        deferred.reject(ev, msg);
                    }
                );
            } catch (ex) {
                debug('error', 'Error loading Public Server Key pair', ex);
                deferred.reject('error', ex);
            }
            return deferred.promise;
        }
        , loadServerX509PrivateKey: function (options) {
            let deferred = Deferred();
            try {
                let privateKeyPem = null;
                debug('Loading saved private Server Key File ..');
                if (fs.existsSync(path.join(__dirname, options.serverPrivateKeyFile))) {
                    fs.readFile(path.join(__dirname, options.serverPrivateKeyFile), { encoding: 'ascii' },
                        function (error, privateKeyPem) {
                            if (error) {
                                deferred.reject('error', error);

                            } else {
                                debug('Loading Private Pem into x509 Key ..');
                                let x509key = PrivateKey.fromPEM(privateKeyPem);
                                deferred.resolve(x509key);
                            }
                        },
                        function (ex) {
                            deferred.reject('error', ex);
                        }

                    );
                } else {
                    throw "Private Key File Not Found ";
                }
                
                

            } catch (ex) {
                debug('error', 'Error loading Server Private Key and Public Cert', ex);
                deferred.reject('error', ex);
            }
            return deferred.promise;
        }

        //, loadServerX509PublicCert: function (options) {
        //    let deferred = Deferred();

        //    try {

        //        debug('Loading saved public Server Cert File');
        //        if (fs.existsSync(path.join(__dirname, options.serverPublicKeyFile))) {
        //            fs.readFile(path.join(__dirname, options.serverPublicKeyFile), {encoding:'ascii'},
        //                function (error, publicKeyPem) {
        //                    try {
        //                        if (error) {
        //                            deferred.reject('error', error);

        //                        } else {
        //                            debug('Loading Public Pem into x509 Cert');
        //                            let x509cert = Certificate.fromPEM(publicKeyPem);
        //                            deferred.resolve(x509cert);
        //                        }
        //                    } catch (ex2) {
        //                        debug('error', 'Error Reading Public Cert Pem', ex2);
        //                        deferred.reject('error', ex2);
        //                    }
        //                }
        //            );
        //        } else {
        //            throw "Public Cert File Not Found";
        //        }
        //    } catch (ex) {
        //        debug('error', 'Error loading Server Private Key and Public Cert', ex);
        //        deferred.reject('error', ex);
        //    }
        //    return deferred.promise;
        //}

        

        , loadX509PublicCertSync: function (options) {
            
            try {

                let publicCertBuffer = null;

                if (Buffer.isBuffer(options.publicCertFile) === true) {
                    publicCertBuffer = options.publicCertFile;
                } else {
                    //debug('info', 'Reading public Server Cert File');
                    if (fs.existsSync(options.publicCertFile)) {
                        publicCertBuffer = fs.readFileSync(options.publicCertFile, { encoding: 'ascii' });
                    }
                }

                let privateKey = null;
                if (options.privateKeyFile) {
                    try {
                        let privateKeyBuffer = null;
                        if (Buffer.isBuffer(options.privateKeyFile) === true) {
                            privateKeyBuffer = options.privateKeyFile;
                        } else {
                            if (options.privateKeyFile && fs.existsSync(options.privateKeyFile)) {
                                privateKeyBuffer = fs.readFileSync(options.privateKeyFile, { encoding: 'ascii' });
                            }
                        }
                        privateKey = PrivateKey.fromPEM(privateKeyBuffer);
                    } catch (ex) {
                        debug('warning', 'Error Loading Private Pem Cert');
                    }

                }

                var certs = [];
                certs = Certificate.fromPEMs(publicCertBuffer);
                for (let i = 0; i < certs.length; i++) {
                    let x509cert = certs[i];
                    //default are checks to false
                    x509cert.isIssuerThisPem = false;
                    x509cert.foundIssuerThisPem = false;
                    x509cert.signatureIsValidIssuerThisPem = false;
                    x509cert.privateKeyValid = false;
                    if (privateKey) {
                        try {
                            const data = Buffer.allocUnsafe(100);
                            const signature = privateKey.sign(data, 'sha256');
                            x509cert.privateKeyValid = x509cert.publicKey.verify(data, signature, 'sha256');
                        } catch (ex) {
                            debug('warning', 'Error Loading Private Pem to Test x509 Cert');
                        }
                    }

                }

                //Check if any of the certs are signed by other certs is so check that they are valid
                for (let i = 0; i < certs.length; i++) {
                    let x509cert = certs[i];
                    //See if Pem contains the Authority Cert
                    for (var k = 0; k < certs.length; k++) {
                        let cert = certs[k];
                        if (k !== i && x509cert.isIssuer(cert)) {
                            try {
                                cert.isIssuerThisPem = true;
                                x509cert.foundIssuerThisPem = true;
                                if (cert.checkSignature(x509cert) === null) {
                                    x509cert.signatureIsValidIssuerThisPem = true;
                                }
                            } catch (ex) {
                                debug('warning', 'Error Validating Issuer In Same Pem x509 Cert');
                            }
                        }

                    }
                }
                

            } catch (ex) {
                debug('error', 'Error loading Public Cert', ex);
                throw ex;
            }
            return certs;

        }
        , loadX509PublicCert: function (options) {
            let deferred = Deferred();

            try {
                var certs = [];
                certs = this.loadX509PublicCertSync(options);
                deferred.resolve(certs);

            } catch (ex) {
                debug('error', 'Error loading Public Cert', ex);
                deferred.reject('error', ex);
            }
            return deferred.promise;

        }  
        , loadRsaKeyPair: function (options) {
            let deferred = Deferred();
            let RsaKeys = {
                privateKeyPem: null,
                privateKey: null,
                publicKey: null
            };
            try {

                debug('Loading saved private Rsa Key File ..');
                if (fs.existsSync(path.join(__dirname, options.privateKeyFile))) {
                    RsaKeys.privateKeyPem = fs.readFileSync(path.join(__dirname, options.privateKeyFile), 'ascii');
                    Keypairs.parse({ key: RsaKeys.privateKeyPem }).then(
                        function (loadedKeys) {
                            //debug('info', 'Loaded rsa key  file');

                            RsaKeys.privateKey = loadedKeys.private;
                            RsaKeys.publicKey = loadedKeys.public;

                            deferred.resolve(RsaKeys);

                        },
                        function (ev, msg) {
                            debug('error', 'Error Parsing RSA Key file', ev, msg || '');
                            deferred.reject(ev, msg);
                        }
                    );
                } else {
                    deferred.reject('error', 'unable to load RSA Key file.', 'File is Missing ');
                }
                
            } catch (ex) {
                debug('error', 'Error loading RSA Key file', ex, options.privateKeyFile);
                deferred.reject('error', ex);
            }
            return deferred.promise;
        }

       

        , createLetsEncryptSignedCert: function (options) {
            let deferred = Deferred();
            try {
                handlers.init().then(
                    function () {
                        //var domains = ['mananger.audio.digitalexample.com'];
                        var domains = options.domains.map(
                            function (name) {
                                return punycode.toASCII(name);
                            }
                        );

                        CSR.csr({ jwk: options.privateKey, domains: domains, encoding:'der' }).then(
                            function (csrDer) {
                                var csr = PEM.packBlock({ type: 'CERTIFICATE REQUEST', bytes: csrDer });

                                var challenges = {
                                    'http-01': handlers._private.options.http01
                                };

                                debug('info','validating domain authorization for ' + domains.join(' '));
                        
                                 handlers._private.acme.certificates.create({

                                    account: handlers._private.account,
                                    accountKey: handlers._private.accountPrivateKey,
                                    csr: csr,
                                    domains: domains,
                                     challenges: challenges,
                                     skipDryRun: handlers._private.options.skipDryRun
                                     
                                }).then(
                                    function (pems) {
                                        debug('info', 'domain validated certificate created ' + domains.join(' '));
                                        var fullchain = pems.cert + '\n' + pems.chain + '\n';
                                        deferred.resolve(fullchain);
                                    },
                                    function (ev, msg) {
                                        debug('error', 'Error Validating Certificate ' + domains.join(' '), ev, msg);
                                        deferred.reject(ev, msg);
                                    }

                                );
                        

                        
                        
                            },
                            function (ev, msg) {
                                debug('error', 'Error Generating CSR ', ev, msg);
                                deferred.reject(ev, msg);
                            }
                        );
                    }, function (ev, msg) {
                        debug('error', 'Error Init ACME', ev, msg);
                        deferred.reject(ev, msg);
                    }
                );

            } catch (ex) {
                debug('error', 'Error Creating Cert', ex);
                deferred.reject('error', ex);
            }
            return deferred.promise;
        }

        //, createLetsEncryptOrder: function (options) {
        //    let deferred = Deferred();
        //    try {

        //        handlers.init().then(
        //            function () {
        //                var domains = options.domains.map(
        //                    function (name) {
        //                        return punycode.toASCII(name);
        //                    }
        //                );

        //                CSR.csr({ jwk: options.serverKey, domains: domains, encoding: 'der' }).then(
        //                    function (csrDer) {
        //                        var csr = PEM.packBlock({ type: 'CERTIFICATE REQUEST', bytes: csrDer });

        //                        var challenges = {
        //                            'http-01': handlers._private.options.http01
        //                        };

        //                        debug('info', 'validating domain authorization for ' + domains.join(' '));

        //                        let orderOptions = {
        //                            account: handlers._private.account,
        //                            accountKey: handlers._private.accountPrivateKey,
        //                            csr: csr,
        //                            domains: domains,
        //                            challenges: challenges
        //                        };

        //                        handlers._private.acme.authorizations.get(orderOptions).then(
        //                            function (order) {
        //                                debug('info', 'Order Created for Domain' + domains.join(' '));
        //                                orderOptions.order = order;
        //                                deferred.resolve(orderOptions);
        //                            },
        //                            function (ev, msg) {
        //                                debug('error', 'Error Creating Order ' + domains.join(' '), ev, msg);
        //                                deferred.reject(ev, msg);
        //                            }

        //                        );

        //                    },
        //                    function (ev, msg) {
        //                        debug('error', 'Error Generating CSR ', ev, msg);
        //                        deferred.reject(ev, msg);
        //                    }
        //                );

        //            }, function (ev, msg) {
        //                debug('error', 'Error Init ACME', ev, msg);
        //                deferred.reject(ev, msg);
        //            }
        //        );
        //    } catch (ex) {
        //        debug('error', 'Error Creating Cert', ex);
        //        deferred.reject('error', ex);
        //    }
        //    return deferred.promise;
        //}


        //, finalizeLetsEncryptOrder: function (orderOptions) {
        //    let deferred = Deferred();
        //    try {
        //        handlers.init().then(
        //            function () {
        //                handlers._private.acme.authorizations.present(orderOptions).then(
        //                    function (pem) {
        //                        debug('info', 'Order Finalized for Domain' + orderOptions.domains.join(' '));
        //                        deferred.resolve(pem);
        //                    },
        //                    function (ev, msg) {
        //                        debug('error', 'Error Finalizing Order ' + orderOptions.domains.join(' '), ev, msg);
        //                        deferred.reject(ev, msg);
        //                    }
        //                );
        //            }, function (ev, msg) {
        //                debug('error', 'Error Init ACME', ev, msg);
        //                deferred.reject(ev, msg);
        //            }
        //        );

        //    } catch (ex) {
        //        debug('error', 'Error Finalizing Order ', ex);
        //        deferred.reject('error', ex);
        //    }
        //    return deferred.promise;
        //}

        , init: function () {
            let deferred = Deferred();
            try {
                if (handlers._private.inited === false) {
                    handlers._private.acme = ACME.create(
                        {
                            maintainerEmail: handlers._private.options.maintainerEmail,
                            packageAgent: handlers._private.packageAgent,
                            notify: handlers._notifyHandler,
                            retryInterval: handlers._private.options.retryInterval,
                            deauthWait: handlers._private.options.deauthWait || 30 * 1000,
                            retryPoll: handlers._private.options.retryPoll || 16,
                            retryPending: handlers._private.options.retryPending || 30,
                            debug: handlers._private.options.debug || false,
                            skipChallengeTest: handlers._private.options.skipChallengeTest || false,
                            skipDryRun: handlers._private.options.skipDryRun || false
                        }
                    );
                    handlers._private.acme.init(handlers._private.directoryUrl).then(
                        function () {
                            handlers.getAccount().then(
                                function () {
                                    handlers._private.inited = true;
                                    deferred.resolve();
                                },
                                function (ev, msg) {
                                    debug('error', 'Error getting Account ', ex);
                                    deferred.reject(ev, msg);
                                }

                            );
                        },
                        function (ev, msg) {
                            debug('error', 'Error on Acme Init ', ex);
                            deferred.reject(ev, msg);

                        }
                    );
                } else {
                    deferred.resolve();
                }
            } catch (ex) {
                debug('error', 'Error on Init', ex);
                deferred.reject('error', ex);
            }
            return deferred.promise;
        }
        , get: function (args, domain, token, cb) {
            // TODO keep in mind that, generally get args are just args.domains
            // and it is disconnected from the flow of setChallenge and removeChallenge
            cb(null, handlers._challenges[token]);
        }
        , remove: function (args, domain, token, cb) {
            delete handlers._challenges[token];
            cb(null);
        }
        , _notifyHandler: function (ev, msg) {
            if ('error' === ev || 'warning' === ev) {
                debug(ev, msg);

            } else {
                debug(ev, msg.altname || '', msg.status || '', msg.message || '');
            }
            if (handlers._private.options.notify) {
                handlers._private.options.notify(ev, msg);
            }
        }
        

    };


    return handlers;
};










