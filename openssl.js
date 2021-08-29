"use strict";

const { spawn } = require('child_process');
const debug = require('debug')('openssl');
const path = require('path');
const extend = require('extend');
const Deferred = require('node-promise').defer;
const fs = require('fs');

var OpenSSL = function (options) {
    var self = this;
    var defaultOptions = {
        opensslPath: 'openssl'
    };

    var objOptions = extend({}, defaultOptions, options);
    self.objOptions = objOptions;

    var createPfx = function (options) {
        // options.certFile
        // options.keyFile
        // options.pfxPassword
        // options.pfxFile
        // options.caCertFile
        let deferred = Deferred();
        try {
            let cliOptions = ['pkcs12', '-inkey', options.keyFile, '-in', options.certFile, '-export', '-out', options.pfxFile, '-passout', 'pass:' + options.pfxPassword];
            if (options.caCertFile) {
                cliOptions.push('-certfile');
                cliOptions.push(options.caCertFile);
                cliOptions.push('-chain');
            }
            const opensslCmd = spawn(objOptions.opensslPath, cliOptions );
            let stderr = '';
            let stdout = '';
            opensslCmd.stdout.on('data', (data) => {
                debug(`createPfx stdout:`, data.toString('utf8'));
                stdout = stdout + data.toString('utf8');
            });

            opensslCmd.stderr.on('data', (data) => {
                stderr = stderr + data.toString('utf8');
                debug(`createPfx stderr:`, data.toString('utf8'));
            });

            opensslCmd.on('close', (code) => {
                debug(`createPfx child process exited with code ${code}`);
                if (code === 0) {
                    deferred.resolve({ code: code, stdout: stdout, stderr: stderr });
                } else {
                    deferred.reject({ code: code, stdout: stdout, stderr: stderr });
                }

            });
        } catch (ex) {
            deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
        }
        return deferred.promise;
    };


    var signCSR = function (options) {
        // options.caCertFile
        // options.caKeyFile
        // options.caPassword
        // options.csrFile
        // options.signedCrtFile
        // options.days
        // options.cnfFile
        let deferred = Deferred();
        try {
            let cliOptions = ['x509', '-req', '-days', options.days, '-CA', options.caCertFile, '-CAkey', options.caKeyFile, '-in', options.csrFile, '-extfile', options.cnfFile, '-extensions', 'v3_client',  '-CAcreateserial', '-out', options.signedCrtFile];
            //Used if the CA Key is Password Protected
            if (options.caPassword) {
                cliOptions.push('-passin');
                cliOptions.push('pass:' + options.caPassword);
            }

            const opensslCmd = spawn(objOptions.opensslPath, cliOptions);
            let stderr = '';
            let stdout = '';
            opensslCmd.stdout.on('data', (data) => {
                debug(`signCSR stdout:`, data.toString('utf8'));
                stdout = stdout + data.toString('utf8');
            });

            opensslCmd.stderr.on('data', (data) => {
                stderr = stderr + data.toString('utf8');
                debug(`signCSR stderr:`, data.toString('utf8'));
            });

            opensslCmd.on('close', (code) => {
                debug(`signCSR child process exited with code ${code}`);
                if (code === 0) {
                    deferred.resolve({ code: code, stdout: stdout, stderr: stderr });
                } else {
                    deferred.reject({ code: code, stdout: stdout, stderr: stderr });
                }

            });
        } catch (ex) {
            deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
        }
        return deferred.promise;
    };


    var caSignCSR = function (options) {
        // options.caCertFile
        // options.caKeyFile
        // options.caConfigFile
        // options.caPassword
        // options.csrFile
        // options.signedCrtFile
        // options.days
        let deferred = Deferred();
        try {
            let cliOptions = ['ca', '-verbose', '-config', options.caConfigFile, '-days', options.days, '-cert', options.caCertFile, '-keyfile', options.caKeyFile,   '-in', options.csrFile, '-extensions' , 'v3_ca', '-create_serial', '-selfsign', '-out', options.signedCrtFile];

            if (options.caPassword) {
                cliOptions.push('-key');
                cliOptions.push(options.caPassword);
            }
            
            const opensslCmd = spawn(objOptions.opensslPath, cliOptions, { cwd: path.dirname(options.caConfigFile) });
            let stderr = '';
            let stdout = '';
            opensslCmd.stdout.on('data', (data) => {
                debug(`signCSR stdout:`, data.toString('utf8'));
                stdout = stdout + data.toString('utf8');
            });

            opensslCmd.stderr.on('data', (data) => {
                stderr = stderr + data.toString('utf8');
                debug(`signCSR stderr:`, data.toString('utf8'));
            });

            opensslCmd.on('close', (code) => {
                debug(`signCSR child process exited with code ${code}`);
                if (code === 0) {
                    deferred.resolve({ code: code, stdout: stdout, stderr: stderr });
                } else {
                    deferred.reject({ code: code, stdout: stdout, stderr: stderr });
                }

            });
        } catch (ex) {
            deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
        }
        return deferred.promise;
    };


    var createKey = function (options) {
        //options.keyFile
        let deferred = Deferred();

        try {
            let keyFileExists = fs.existsSync(options.keyFile);
            if (keyFileExists === false || (keyFileExists === true && options.overwriteExistingKeyFile === true))
            {

                let cliOptions = ['genrsa', '-out', options.keyFile];

                const opensslCmd = spawn(objOptions.opensslPath, cliOptions);
                let stderr = '';
                let stdout = '';
                opensslCmd.stdout.on('data', (data) => {
                    var strData = data.toString('utf8');
                    //Filter Out the '.', '..' , '+'  keygen outputs
                    if (strData.length > 2) {
                        debug(`createKey stdout:`, strData);
                        stdout = stdout + strData;
                    }
                });

                opensslCmd.stderr.on('data', (data) => {
                    var strData = data.toString('utf8');
                    //Filter Out the '.', '..' , '+'  keygen outputs
                    if (strData.length > 2) {
                        stderr = stderr + strData;
                        debug(`createKey stderr:`, strData);
                    }
                });

                opensslCmd.on('close', (code) => {
                    debug(`createKey child process exited with code ${code}`);
                    if (code === 0) {
                        deferred.resolve({ code: code, stdout: stdout, stderr: stderr });
                    } else {
                        deferred.reject({ code: code, stdout: stdout, stderr: stderr });
                    }

                });
            } else {
                deferred.resolve({ code: 1, stdout: "Keyfile Exists", stderr: "" });
            }
        } catch (ex) {
            deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
        }
        return deferred.promise;
    };

    var createCsr = function (options) {
        //options.keyFile
        //options.csrFile
        //options.subject
        //options.cnfFile
        let deferred = Deferred();
        try {
            //'-extensions', 'v3_client', '-reqexts', 'v3_req',
            let cliOptions = ['req', '-new', '-config', options.cnfFile,  '-subj=' + options.subject, '-key', options.keyFile, "-out", options.csrFile];

            const opensslCmd = spawn(objOptions.opensslPath, cliOptions);
            let stderr = '';
            let stdout = '';
            opensslCmd.stdout.on('data', (data) => {
                debug(`createCsr stdout:`, data.toString('utf8'));
                stdout = stdout + data.toString('utf8');
            });

            opensslCmd.stderr.on('data', (data) => {
                stderr = stderr + data.toString('utf8');
                debug(`createCsr stderr:`, data.toString('utf8'));
            });

            opensslCmd.on('close', (code) => {
                debug(`createCsr child process exited with code ${code}`);
                if (code === 0) {
                    deferred.resolve({ code: code, stdout: stdout, stderr:stderr });
                } else {
                    deferred.reject({ code: code, stdout: stdout, stderr: stderr });
                }

            });
        } catch (ex) {
            deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
        }
        return deferred.promise;
    };


   


    var createCertificate = function (options) {
        
        //options.certificateId
        //options.configFolder
        //options.certificateFolder
        //options.overwriteExistingKeyFile
        let deferred = Deferred();

        try {
            let keyFile = path.join(options.certificateFolder, options.certificateId + '.key');
            let csrFile = path.join(options.certificateFolder, options.certificateId + '.csr');
            let signedCrtFile = path.join(options.certificateFolder, options.certificateId + '.cert');
            let pfxFile = path.join(options.certificateFolder, options.certificateId + '.pfx');
            let caKeyFile = path.join(options.configFolder, 'ca-key.pem');
            let caCertFile = path.join(options.configFolder, 'ca-crt.pem');
            let caPassword = options.caPassword;
            //let caConfigFile = path.join(options.configFolder, 'ca.cnf');
            let cnfFile = path.join(options.configFolder, 'client.cnf');
            let days = 999;
            let subject = options.subject;
            let createPfxFile = options.createPfxFile;
            let pfxPassword = options.pfxPassword;
            let overwriteExistingKeyFile = options.overwriteExistingKeyFile || false;
            debug('info', 'openssl', 'createCertificate', { opensslPath: objOptions.opensslPath, keyFile: keyFile, csrFile: csrFile, signedCrtFile: signedCrtFile, pfxFile: pfxFile, caKeyFile: caKeyFile, caCertFile: caCertFile, caPassword: caPassword, cnfFile: cnfFile, days: days, subject: subject, createPfxFile: createPfxFile, pfxPassword: pfxPassword, overwriteExistingKeyFile: overwriteExistingKeyFile });
            createKey({ keyFile: keyFile, overwriteExistingKeyFile: overwriteExistingKeyFile }).then(
                function () {
                    try {
                        createCsr({
                            keyFile: keyFile,
                            csrFile: csrFile,
                            subject: subject,
                            cnfFile: cnfFile
                        }).then(
                            function () {
                                try {
                                    signCSR({
                                        caCertFile: caCertFile,
                                        caKeyFile: caKeyFile,
                                        caPassword: caPassword,
                                        csrFile: csrFile,
                                        signedCrtFile: signedCrtFile,
                                        days: days,
                                        cnfFile: cnfFile
                                    })
                                    
                                        .then(
                                        function () {
                                            try {
                                                //Delete the CSR as we are done with it as we have a cert now
                                                fs.unlinkSync(csrFile);
                                                //we need to inject the CA Cert into the client cert so it chains correctly
                                                fs.appendFileSync(signedCrtFile, '\n');
                                                fs.appendFileSync(signedCrtFile, fs.readFileSync(caCertFile));
                                                if (createPfxFile === true) {
                                                    createPfx({
                                                        certFile: signedCrtFile,
                                                        keyFile: keyFile,
                                                        pfxPassword: pfxPassword,
                                                        pfxFile: pfxFile
                                                    }).then(
                                                        function (result) {
                                                            try {
                                                                deferred.resolve({ pfxFile: pfxFile, keyFile: keyFile, certFile: signedCrtFile });
                                                            } catch (ex) {
                                                                deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
                                                            }
                                                        }
                                                        ,
                                                        function (result) {
                                                            deferred.reject(result);
                                                        }
                                                    );
                                                } else {
                                                    deferred.resolve({ pfxFile: null, keyFile: keyFile, certFile: signedCrtFile });
                                                }
                                            } catch (ex) {
                                                deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
                                            }
                                        },
                                        function (result) {
                                            deferred.reject(result);
                                        }

                                    );
                                } catch (ex) {
                                    deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
                                }
                            },
                            function (result) {
                                deferred.reject(result);
                            }

                        );
                    } catch (ex) {
                        deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
                    }
                },
                function (result) {

                    deferred.reject(result);
                }

            );
        } catch (ex) {
            deferred.reject({ code: 999, stdout: ex.message, stderr: ex });
        }
        return deferred.promise;
    };

    // assign the functions we want to export
    self.createPfx = createPfx;
    self.createCertificate = createCertificate;
    self.createCsr = createCsr;
    self.createKey = createKey;
    self.signCSR = signCSR;
};

module.exports = OpenSSL;


