$(function () {

    var Service = {
        socket: io.connect(),
        commonData: null,
        detailAudioStreamerId: null, 
        streamerConfigEditor: null,
        streamerFileUpdatesEditor: null
    };
    // Create our socket.io object and connect it to express

    Service.socket.on('connect_error', function (message) {
        console.log('socket.io connect_error', message);
        $(".browserConnected").removeClass("text-success").addClass("text-danger");
    });

    Service.socket.on('connect_timeout', function (message) {
        console.log('socket.io connect_timeout');
        $(".browserConnected").removeClass("text-success").addClass("text-danger");
    });

    Service.socket.on('reconnecting', function (message) {
        console.log('socket.io reconnecting', message);
        $(".browserConnected").removeClass("text-success").addClass("text-danger");
    });
    Service.socket.on('reconnect', function (message) {
        console.log('socket.io reconnect', message);
        $(".browserConnected").removeClass("text-danger").addClass("text-success");
    });

    Service.socket.on('ping', function (message) {
        console.log('socket.io ping sent to server', message || '');
    });
    Service.socket.on('pong', function (message) {
        console.log('socket.io pong received from server', message);
        $(".browserConnected").removeClass("text-danger").addClass("text-success");
    });

    Service.socket.on('commonData', function (message) {
        console.log('commonData', message);
        Service.commonData = message;
        $("div.audioStreamers").empty();
        updateServerCertificates(message.serverCertificates);
        updateServerCACertificates(message.serverCACertificates);
        updateServerCAManagementCertificates(message.serverCAManagementCertificates);
        $.each(message.audioStreamers, function (index) {
            Service.commonData.audioStreamers[index].div = updateAudioStreamer(message.audioStreamers[index]);
        });
    });

    Service.socket.on('audioStreamer', function (message) {
        console.log('audioStreamerConnect', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            $.extend(true, Service.commonData.audioStreamers[message.audioStreamerId], message);
        } else {
            Service.commonData.audioStreamers[message.audioStreamerId] = message;
        }
        updateAudioStreamer(Service.commonData.audioStreamers[message.audioStreamerId]);
    });

    Service.socket.on('serverLog', function (message) {
        console.log('serverLog', message);
        let $serverLogs = $(".serverLogs");
        addServerLog(message, $serverLogs);
    });

    Service.socket.on('serverLogs', function (message) {
        //response message for issuing a packageUpdate
        //console.log('serverLogs', message);
        let $serverLogs = $(".serverLogs");
        $serverLogs.empty();
        $.each(message, function (index, item) {
            addServerLog(item, $serverLogs);
        });
    });


    Service.socket.on('DownloadApplianceLogFiles', function (message, fileData) {
        //response message for issuing a packageUpdate
        //console.log('serverLogs', message);

        var fileDataBlob = new Blob([new Uint8Array(fileData)], { type: "application/zip" });
        //const objectURL = URL.createObjectURL(fileDataBlob);  
        // document says createObjectURL(), a new object URL is created, even if you've already created one for the same object. Each of these must be released by calling URL.revokeObjectURL() 
        //let newWindow = window.open('/public/filedownload.html');
        //Service.downloadFileWindow.onload = function () {
        //    Service.downloadFileWindow.close();
            
        //};
        //Service.downloadFileWindow.location = Service.downloadFileWindow.URL.createObjectURL(fileDataBlob); 
        const url = URL.createObjectURL(fileDataBlob);

        // Create a new anchor element
        const a = document.createElement('a');

        // Set the href and download attributes for the anchor element
        // You can optionally set other attributes like `title`, etc
        // Especially, if the anchor element will be attached to the DOM
        a.href = url;
        a.download = message.filename || 'download';

        // Click handler that releases the object URL after the element has been clicked
        // This is required for one-off downloads of the blob content
        const clickHandler = () => {
            setTimeout(() => {
                URL.revokeObjectURL(url);
                this.removeEventListener('click', clickHandler);
            }, 150);
        };

        // Add the click event listener on the anchor element
        // Comment out this line if you don't want a one-off download of the blob content
        a.addEventListener('click', clickHandler, false);

        // Programmatically trigger a click on the anchor element
        // Useful if you want the download to happen automatically
        // Without attaching the anchor element to the DOM
        // Comment out this line if you don't want an automatic download of the blob content
        a.click();
    });
    

    Service.socket.on('audioStreamerClientStats', function (message) {
        console.log('audioStreamerClientStats', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            Service.commonData.audioStreamers[message.audioStreamerId].clientStats = message.clientStats;
            var $audioStreamer = findAudioStreamer(message.audioStreamerId);
            updateAudioStreamerClientStats($audioStreamer, message.clientStats);
            if (Service.detailAudioStreamerId === message.audioStreamerId) {
                var $audioStreamerContainer = $(".audioStreamerDetailContainer");
                updateAudioStreamerClientStats($audioStreamerContainer, message.clientStats);
            }
        }

    });

    Service.socket.on('audioStreamerStartupStats', function (message) {
        console.log('audioStreamerStartupStats', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            Service.commonData.audioStreamers[message.audioStreamerId].startupStats = message.startupStats;
            var $audioStreamer = findAudioStreamer(message.audioStreamerId);
            updateAudioStreamerStartupStats($audioStreamer, message.startupStats);

            if (Service.detailAudioStreamerId === message.audioStreamerId) {
                var $audioStreamerContainer = $(".audioStreamerDetailContainer");
                updateAudioStreamerStartupStats($audioStreamerContainer, message.startupStats);
            }
        }

    });

    Service.socket.on('audioStreamerStreamStats', function (message) {
        console.log('audioStreamerStreamStats', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            Service.commonData.audioStreamers[message.audioStreamerId].streamStats = message.streamStats;
            var $audioStreamer = findAudioStreamer(message.audioStreamerId);
            updateAudioStreamerStreamStats($audioStreamer, message.streamStats);

            if (Service.detailAudioStreamerId === message.audioStreamerId) {
                var $audioStreamerContainer = $(".audioStreamerDetailContainer");
                updateAudioStreamerStreamStats($audioStreamerContainer, message.streamStats);
            }
        }

    });

    Service.socket.on('audioStreamerMachineStats', function (message) {
        console.log('audioStreamerMachineStats', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            Service.commonData.audioStreamers[message.audioStreamerId].machineStats = message.machineStats;
            var $audioStreamer = findAudioStreamer(message.audioStreamerId);
            updateAudioStreamerMachineStats($audioStreamer, message.machineStats);

            if (Service.detailAudioStreamerId === message.audioStreamerId) {
                var $audioStreamerContainer = $(".audioStreamerDetailContainer");
                updateAudioStreamerMachineStats($audioStreamerContainer, message.machineStats);
            }
        }

    });


    Service.socket.on('audioStreamerServerCertificates', function (message) {
        console.log('audioStreamerServerCertificates', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            Service.commonData.audioStreamers[message.audioStreamerId].serverCertificates = message.serverCertificates;
            if (Service.detailAudioStreamerId === message.audioStreamerId) {
                var $audioStreamerContainer = $(".audioStreamerDetailContainer");
                updateAudioStreamerServerCertificates($audioStreamerContainer, message.serverCertificates);
            }
        }
    });
    Service.socket.on('audioStreamerServerCACertificates', function (message) {
        console.log('audioStreamerServerCACertificates', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            Service.commonData.audioStreamers[message.audioStreamerId].serverCACertificates = message.serverCACertificates;
            if (Service.detailAudioStreamerId === message.audioStreamerId) {
                var $audioStreamerContainer = $(".audioStreamerDetailContainer");
                updateAudioStreamerServerCACertificates($audioStreamerContainer, message.serverCACertificates);
            }
        }
    });
    Service.socket.on('audioStreamerClientCertificates', function (message) {
        console.log('audioStreamerClientCertificates', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            Service.commonData.audioStreamers[message.audioStreamerId].clientCertificates = message.clientCertificates;
            if (Service.detailAudioStreamerId === message.audioStreamerId) {
                var $audioStreamerContainer = $(".audioStreamerDetailContainer");
                updateAudioStreamerClientCertificates($audioStreamerContainer, message.clientCertificates);
            }
        }
    });

    Service.socket.on('serverError', function (message) {
        console.log('serverError', message);
        $.notify({ message: message.msg || message.message || "General Error" + "<br/>" + (message.error|| '') }, { type: 'danger' });
    });

    Service.socket.on('EditAudioStreamerAlias', function (message) {
        try {
            if (Service.commonData.audioStreamers[message.audioStreamerId]) {
                Service.commonData.audioStreamers[message.audioStreamerId].audioStreamerAlias = message.audioStreamerAlias;
                var $audioStreamer = findAudioStreamer(message.audioStreamerId);
                $audioStreamer.find(".audioStreamerAlias").text(message.audioStreamerAlias);
                if (Service.detailAudioStreamerId === message.audioStreamerId) {
                    var $audioStreamerContainer = $(".audioStreamerDetailContainer");
                    $audioStreamerContainer.find(".audioStreamerAlias").text(message.audioStreamerAlias);
                    $audioStreamerContainer.find(".editAudioStreamerAlias").val(message.audioStreamerAlias);
                    $audioStreamerContainer.find(".audioStreamerAliasContainer").show();
                    $audioStreamerContainer.find(".editAudioStreamerAliasContainer").hide();
                }
            }
        } catch (ex) {
            console.error(ex)
        }
    });

    Service.socket.on('AudioStreamerAction', function (message) {
        console.log('AudioStreamerAction', message);
        if (Service.commonData.audioStreamers[message.audioStreamerId]) {
            let streamer = Service.commonData.audioStreamers[message.audioStreamerId];
            let $audioStreamerDetailContainer = $(".audioStreamerDetailContainer");
            let $audioStreamerRow = findAudioStreamer(message.audioStreamerId);
            switch (message.action) {
                case 'ReadConfig':
                    streamer.config = message.data;
                    if (Service.detailAudioStreamerId === message.audioStreamerId) {
                        
                        updateAudioStreamerConfig($audioStreamerDetailContainer, streamer.config);
                    }
                    break;
                case "ReadFileUpdates":
                    if (Service.detailAudioStreamerId === message.audioStreamerId) {
                        if (message.isStreamerReadUpdate) {
                            //message.data.isStreamerReadUpdate = message.isStreamerReadUpdate;
                            var data = Service.streamerFileUpdatesEditor.get();
                            data.downloadedTimestamp = message.data.downloadedTimestamp;
                            Service.streamerFileUpdatesEditor.set(data);

                        } else {
                            //updateAudioStreamerFileUpdate($audioStreamerContainer, message.data);
                            Service.streamerFileUpdatesEditor.set(message.data);
                        }
                        
                    }
                    break;
                
                case 'GetStreamerLogs':
                    if (Service.detailAudioStreamerId === message.audioStreamerId) {
                        
                        updateAudioStreamerLogs($audioStreamerDetailContainer, message.data);
                    }
                    break;
               
            }
        }

    });

    Service.socket.on('cleanGitRepository', function (message) {
        console.log('cleanGitRepository', message);
        //response message for issuing a cleanGitRepository
        if (message.success === true) {
            $.notify({ message: 'Clean Git Repository Success' }, { type: 'success' });
        } else {
            $.notify({ message: 'Clean Git Repository Failed' }, { type: 'danger' });
        }

    });
    Service.socket.on('packageUpdate', function (message) {
        //response message for issuing a packageUpdate
        console.log('packageUpdate', message);
        if (message.success === true) {
            $.notify({ message: 'Package Update Success to version ' + message.version + " for " + message.options.environment }, { type: 'success' });
        } else {
            $.notify({ message: 'Package Update Failed ' }, { type: 'danger' });
        }

    });

    Service.socket.on('serverCertificatesUpdate', function (message) {
        //response message for issuing a serverCertificateUpdate
        console.log('serverCertificatesUpdate', message);
        Service.commonData.serverCertificates = message;
        updateServerCertificates(message);

    });

    Service.socket.on('serverCACertificatesUpdate', function (message) {
        //response message for issuing a serverCertificateUpdate
        console.log('serverCACertificatesUpdate', message);
        Service.commonData.serverCACertificates = message;
        updateServerCACertificates(message);

    });
    Service.socket.on('serverCAManagementCertificatesUpdate', function (message) {
        //response message for issuing a serverCertificateUpdate
        console.log('serverCAManagementCertificatesUpdate', message);
        Service.commonData.serverCAManagementCertificates = message;
        updateServerCAManagementCertificates(message);

    });

    Service.socket.on('createLetsEncrypt', function (message) {
        //response message for issuing a packageUpdate
        console.log('createLetsEncrypt', message);
        let strData = '';
        if (message.data) {
            strData = JSON.stringify(message.data);
        }
        if (message.status === 'complete') {
            let type = 'success';
            if (message.success !== true) {
                type = 'danger';
            }
            $.notify({ message: 'Lets Encrypt Complete' + ' ' + strData }, { type: type });
            $("Button.btnLetsEncrypt").prop('disabled', false);
        } else {
            $("Button.btnLetsEncrypt").prop('disabled', true);
            if (message.error ) {
                $.notify({ message: message.msg + "<br/>" + + message.error + ' ' + strData }, { type: 'danger' });
            } else {
                $.notify({ message: message.msg + ' ' + strData }, { type: 'success' });
            }
        }
        

    });


    

    

    //repeat?
    //Service.socket.on('audioStreamerStats', function (message) {
    //     console.log('audioStreamerStats', message);
    //     updateAudioStreamerStats(message);
    // });
    //var serverTime = document.getElementById('serverTime');
    //function time() {
    //    var d = new Date();
    //    var dateISO = d.toISOString().slice(0, -5) + "Z";
    //    var s = d.getSeconds();
    //    var m = d.getMinutes();
    //    var h = d.getHours();
    //    //serverTime.textContent = h + ":" + m + ":" + s;
    //    serverTime.textContent = dateISO;
    //}

    var $serverLogRowTemplate = $('.htmlTemplates').find('.serverLogsTemplate').find('.logRow');


    var isObject = function (a) {
        return (!!a) && (a.constructor === Object);
    };



    var addServerLog = function (log, $serverLogs) {
        try {
            
            let $serverLogRow = $serverLogRowTemplate.clone();
            $serverLogRow.find('.logTs').text(moment(log.timestamp).format('L') + ' ' + moment(log.timestamp).format('LTS') );
            let logLevelClass = "info";
            switch (log.logLevel) {
                case 'error':
                case 'panic':
                case 'fatal':
                    logLevelClass = 'danger';
                    break;
                case 'warning':
                    logLevelClass = 'warning';
                    break;
                case 'trace':
                case 'verbose':
                case 'debug':
                    logLevelClass = 'light';
                    break;
            }
            $serverLogRow.attr('title',log.logLevel).addClass(logLevelClass);
            let logMessage = '';
            if (log.args) {
                $.each(log.args, function (index, item) {
                    try {
                        if (logMessage.length > 0) {
                            logMessage = logMessage + ', ';
                        }
                        if (isObject(log.args[index])) {
                            logMessage = logMessage + JSON.stringify(log.args[index]);
                        } else {
                            if (log.args[index] === undefined) {
                                logMessage = logMessage + 'undefined';
                            } else if (log.args[index] === null) {
                                logMessage = logMessage + 'null';
                            }
                            else {
                                logMessage = logMessage + log.args[index].toString();
                            }
                        }
                    } catch (ex) {
                        console.log('error', 'Error addServerLog args', ex);
                    }
                });
            }
            $serverLogRow.find('.logMsg').html(logMessage);
            $serverLogRow.hide();
            $serverLogs.prepend($serverLogRow);
            $serverLogRow.fadeIn("slow", function () {
                
            });
            if ($serverLogs.length > 1000) {
                $serverLogs.last().fadeOut("slow", function () {
                    $(this).remove();
                });
            }
        } catch (ex) {
            console.log('error', 'Error addServerLog', ex);
        }
    };

    var getFakeGuidS4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };

    var getFakeGuid = function () {
        return (getFakeGuidS4() + getFakeGuidS4() + "-" + getFakeGuidS4() + "-4" + getFakeGuidS4().substr(0, 3) + "-" + getFakeGuidS4() + "-" + getFakeGuidS4() + getFakeGuidS4() + getFakeGuidS4()).toLowerCase();
    };

    

   

    var updateAudioStreamerConfig = function ($audioStreamerContainer,configData) {
        Service.streamerConfigEditor.set(configData);
    };

   
    var $streamerLogRowTemplate = $('.htmlTemplates').find('.streamerLogsTemplate').find('.logRow');
    var addStreamerLog = function (log, $streamerLogs) {
        try {

            let $streamerLogRow = $streamerLogRowTemplate.clone();
            $streamerLogRow.find('.logTs').text(moment(log.timestamp).format('L') + ' ' + moment(log.timestamp).format('LTS'));
            let logLevelClass = "info";
            switch (log.logLevel) {
                case 'error':
                case 'panic':
                case 'fatal':
                    logLevelClass = 'danger';
                    break;
                case 'warning':
                    logLevelClass = 'warning';
                    break;
                case 'trace':
                case 'verbose':
                case 'debug':
                    logLevelClass = 'light';
                    break;
            }
            $streamerLogRow.attr('title', log.logLevel).addClass(logLevelClass);
            let logMessage = '';
            if (log.args) {
                $.each(log.args, function (index, item) {
                    try {
                        if (logMessage.length > 0) {
                            logMessage = logMessage + ', ';
                        }
                        if (isObject(log.args[index])) {
                            logMessage = logMessage + JSON.stringify(log.args[index]);
                        } else {
                            if (log.args[index] === undefined) {
                                logMessage = logMessage + 'undefined';
                            } else if (log.args[index] === null) {
                                logMessage = logMessage + 'null';
                            }
                            else {
                                logMessage = logMessage + log.args[index].toString();
                            }
                        }
                    } catch (ex) {
                        console.log('error', 'Error addServerLog args', ex);
                    }
                });
            }
            $streamerLogRow.find('.logMsg').html(logMessage);
            $streamerLogRow.hide();
            $streamerLogs.prepend($streamerLogRow);
            $streamerLogRow.fadeIn("slow", function () {

            });
            if ($streamerLogs.length > 1000) {
                $streamerLogs.last().fadeOut("slow", function () {
                    $(this).remove();
                });
            }
        } catch (ex) {
            console.log('error', 'Error addStreamerLog', ex);
        }
    };

    var updateAudioStreamerLogs = function ($audioStreamerContainer, logs) {
        let $streamerLogs = $audioStreamerContainer.find(".streamerLogs");
        $streamerLogs.empty();
        $.each(logs, function (index, item) {
            addStreamerLog(item, $streamerLogs);
        });
    };

    var updateCertificate = function (certificate, $certificateDetails) {
        try {
            if (certificate) {
                $certificateDetails.fadeOut('slow',
                    function () {
                        if (certificate.subject && certificate.subject.attributes) {
                            let subject = '';
                            let commonName = '';
                            let organizationName = '';
                            let countryName = '';
                            $.each(certificate.subject.attributes, function (index, item) {
                                if (item.name === "commonName") {
                                    commonName = item.value;
                                }
                                if (item.name === "organizationName") {
                                    organizationName = item.value;
                                }
                                if (item.name === "countryName") {
                                    countryName = item.value;
                                }
                                //issuer = issuer + item.name + ':' + item.value;
                            });
                            if (commonName) {
                                if (subject.length > 0) {
                                    subject = issuer + ', ';
                                }
                                subject = subject + commonName;
                            }
                            if (organizationName) {
                                if (subject.length > 0) {
                                    subject = subject + ', ';
                                }
                                subject = subject + organizationName;
                            }
                            if (countryName) {
                                if (subject.length > 0) {
                                    subject = subject + ', ';
                                }
                                subject = subject + countryName;
                            }
                            $certificateDetails.find('.certSubject').html(subject);
                        } else {
                            $certificateDetails.find('.certSubject').html('');
                        }
                        if (certificate.dnsNames) {
                            let dnsName = '';
                            $.each(certificate.dnsNames, function (index, item) {
                                if (dnsName.length > 0) {
                                    dnsName = dnsName + ', ';
                                }
                                dnsName = dnsName + item;
                            });
                            $certificateDetails.find('.certDnsNames').html(dnsName);
                        } else {
                            $certificateDetails.find('.certDnsNames').html('');
                        }

                        if (certificate.issuer && certificate.issuer.attributes) {
                            let issuer = '';
                            let commonName = '';
                            let organizationName = '';
                            let countryName = '';


                            $.each(certificate.issuer.attributes, function (index, item) {
                                if (issuer.length > 0) {
                                    issuer = issuer + ', ';
                                }
                                if (item.name === "commonName") {
                                    commonName = item.value;
                                }
                                if (item.name === "organizationName") {
                                    organizationName = item.value;
                                }
                                if (item.name === "countryName") {
                                    countryName = item.value;
                                }
                                //issuer = issuer + item.name + ':' + item.value;
                            });
                            if (commonName) {
                                if (issuer.length > 0) {
                                    issuer = issuer + ', ';
                                }
                                issuer = issuer + commonName;
                            }
                            if (organizationName) {
                                if (issuer.length > 0) {
                                    issuer = issuer + ', ';
                                }
                                issuer = issuer + organizationName;
                            }
                            if (countryName) {
                                if (issuer.length > 0) {
                                    issuer = issuer + ', ';
                                }
                                issuer = issuer + countryName;
                            }
                            $certificateDetails.find('.certIssuer').html(issuer);
                        } else {
                            $certificateDetails.find('.certIssuer').html('');
                        }
                        if (certificate.signatureAlgorithm) {
                            $certificateDetails.find('.certAlgorithm').text(certificate.signatureAlgorithm);
                        } else {
                            $certificateDetails.find('.certAlgorithm').text('');
                        }

                        if (certificate.validFrom) {
                            $certificateDetails.find('.certValidFrom').text(moment(certificate.validFrom).format('LLL'));
                        } else {
                            $certificateDetails.find('.certValidFrom').text('');
                        }

                        if (certificate.validTo) {
                            $certificateDetails.find('.certValidTo').text(moment(certificate.validTo).format('LLL'));
                        } else {
                            $certificateDetails.find('.certValidTo').text('');
                        }

                        if (certificate.isCA) {
                            $certificateDetails.find('.certIsCa').text("True");
                        } else {
                            $certificateDetails.find('.certIsCa').text('False');
                        }

                        if (certificate.privateKeyValid) {
                            $certificateDetails.find('.certPrivateKeyValid').text("True");
                        } else {
                            $certificateDetails.find('.certPrivateKeyValid').text('False');
                        }
                        if (certificate.foundIssuerThisPem) {
                            if (certificate.signatureIsValidIssuerThisPem) {
                                $certificateDetails.find('.certIssuerInPem').text("True, Valid Signature");
                            } else {
                                $certificateDetails.find('.certIssuerInPem').text("True, Invalid Signature");
                            }
                            
                        } else {
                            $certificateDetails.find('.certIssuerInPem').text('False');
                        }

                        if (certificate.serialNumber) {
                            $certificateDetails.find('.certSerialNumber').text(certificate.serialNumber);
                        } else {
                            $certificateDetails.find('.certSerialNumber').text('');
                        }
                        
                        $certificateDetails.fadeIn('slow');
                    });


            }
        } catch (ex) {
            console.error('updatecertificate', ex);
        }
    };

    var $certificateDetailsTemplate = $('.certificateDetailsTemplate');


    var updateServerCertificates = function (serverCertificates, $certificateDetails) {
        try {
            var $serverCertificates = $(".serverCertificates");
            $serverCertificates.empty();
            if (serverCertificates) {
                serverCertificates.forEach(function (certificate) {
                    var $certificateDetail = $certificateDetailsTemplate.clone();
                    $serverCertificates.append($certificateDetail);
                    updateCertificate(certificate, $certificateDetail);
                });
            }
        } catch (ex) {
            console.error('updateServerCertificate', ex);
        }
    };

    var updateServerCACertificates = function (serverCACertificates) {
        try {
            var $serverCACertificates = $(".serverCACertificates");
            $serverCACertificates.empty();
            if (serverCACertificates) {
                serverCACertificates.forEach(function (certificate) {
                    var $certificateDetail = $certificateDetailsTemplate.clone();
                    $serverCACertificates.append($certificateDetail);
                    updateCertificate(certificate, $certificateDetail);
                });
            }
        } catch (ex) {
            console.error('updateServerCACertificate', ex);
        }
    };

    var updateServerCAManagementCertificates = function (serverCAManagementCertificates) {
        try {
            var $serverCAManagementCertificates = $(".serverCAManagementCertificates");
            $serverCAManagementCertificates.empty();
            if (serverCAManagementCertificates) {
                serverCAManagementCertificates.forEach(function (certificate) {
                    var $certificateDetail = $certificateDetailsTemplate.clone();
                    $serverCAManagementCertificates.append($certificateDetail);
                    updateCertificate(certificate, $certificateDetail);
                });
            }
        } catch (ex) {
            console.error('updateServerCAManagementCertificate', ex);
        }
    };


    var updateAudioStreamerServerCertificates = function ($audioStreamer,serverCertificates) {
        try {
            var $serverCertificates = $audioStreamer.find(".serverCertificates");
            $serverCertificates.empty();
            if (serverCertificates) {
                serverCertificates.forEach(function (certificate) {
                    var $certificateDetail = $certificateDetailsTemplate.clone();
                    $serverCertificates.append($certificateDetail);
                    updateCertificate(certificate, $certificateDetail);
                    //CheckServerCertEqualClientCert();
                });
            }
        } catch (ex) {
            console.error('updateServerCertificate', ex);
        }
    };

    var updateAudioStreamerServerCACertificates = function ($audioStreamer,serverCACertificates) {
        try {
            var $serverCACertificates = $audioStreamer.find(".serverCACertificates");
            $serverCACertificates.empty();
            if (serverCACertificates) {
                serverCACertificates.forEach(function (certificate) {
                    var $certificateDetail = $certificateDetailsTemplate.clone();
                    $serverCACertificates.append($certificateDetail);
                    updateCertificate(certificate, $certificateDetail);
                });
            }
        } catch (ex) {
            console.error('updateServerCACertificate', ex);
        }
    };

    var updateAudioStreamerClientCertificates = function ($audioStreamer,clientCertificates) {
        try {
            var $clientCertificates = $audioStreamer.find(".clientCertificates");
            $clientCertificates.empty();
            if (clientCertificates) {
                clientCertificates.forEach(function (certificate) {
                    var $certificateDetail = $certificateDetailsTemplate.clone();
                    $clientCertificates.append($certificateDetail);
                    updateCertificate(certificate, $certificateDetail);
                   // CheckServerCertEqualClientCert();
                });
            }
        } catch (ex) {
            console.error('updateClientCertificate', ex);
        }
    };


    var updateAudioStreamerMachineStats = function ($audioStreamer, machineStats) {

        if ($audioStreamer) {
            if (machineStats) {
                $audioStreamer.find(".cpuUsage").text(machineStats.cpuUsage + ' (Avg1: ' + machineStats.loadAvg1 + ') (Avg5: ' + machineStats.loadAvg5 + ') (Avg15:' + machineStats.loadAvg15 + ')' );
                $audioStreamer.find(".freeMem").text(machineStats.freeMem);
                //$audioStreamer.find(".sysUptime").text(moment(machineStats.sysUptime, 'x').format('HH:mm'));
                $audioStreamer.find(".sysUptime").text(moment.duration(machineStats.sysUptime,'s').asHours().toFixed(2)+' hrs');
            } else {
                $audioStreamer.find(".cpuUsage").text(""); 
                $audioStreamer.find(".freeMem").text("");
                $audioStreamer.find(".sysUptime").text("");
            }
        }

    };

    var updateAudioStreamerStartupStats = function ($audioStreamer, startupStats) {

        if ($audioStreamer) {
            if (startupStats) {
                $audioStreamer.find(".audioStreamerStartupTime").text(moment(startupStats.startupDate).format('lll'));
                $audioStreamer.find(".nodeVersion").text(startupStats.nodeVersion);
                $audioStreamer.find(".platform").text(startupStats.platform);
                $audioStreamer.find(".arch").text(startupStats.arch);
                $audioStreamer.find('.streamerVersion').text(startupStats.streamerVersion);
                $audioStreamer.find('.containerVersion').text(startupStats.containerVersion);
                $audioStreamer.find('.hostVersion').text(startupStats.hostVersion);
                $audioStreamer.find('.ipAddress').text(startupStats.ipAddress);
                $audioStreamer.find('.serverVersion').text(startupStats.serverVersion);
            } else {
                $audioStreamer.find(".audioStreamerStartupTime").text("");
                $audioStreamer.find(".nodeVersion").text("");
                $audioStreamer.find(".platform").text("");
                $audioStreamer.find(".arch").text("");
                $audioStreamer.find('.streamerVersion').text("");
                $audioStreamer.find('.containerVersion').text("");
                $audioStreamer.find('.hostVersion').text("");
                $audioStreamer.find('.ipAddress').text("");
                $audioStreamer.find('.serverVersion').text("");
            }
        }

    };

    var updateAudioStreamerStreamStats = function ($audioStreamer, streamStats) {

        if ($audioStreamer) {
            if (streamStats) {
                $audioStreamer.find(".streamStatus").text(streamStats.status);
                $('.chunkCounter').text(streamStats.chunkCounter);
                if (streamStats.metadata) {
                    $audioStreamer.find('.icyDescription').text(streamStats.metadata.icydescription);
                    $audioStreamer.find('.icyGenre').text(streamStats.metadata.icygenre);
                    $audioStreamer.find('.icyName').text(streamStats.metadata.icyname);
                    $audioStreamer.find('.icyPub').text(streamStats.metadata.icypub);
                    $audioStreamer.find('.icyUrl').text(streamStats.metadata.icyurl);
                    $audioStreamer.find('.streamTitle').text(streamStats.metadata.StreamTitle);
                } else {
                    $audioStreamer.find('.icyDescription').text('');
                    $audioStreamer.find('.icyGenre').text('');
                    $audioStreamer.find('.icyName').text('');
                    $audioStreamer.find('.icyPub').text('');
                    $audioStreamer.find('.icyUrl').text('');
                    $audioStreamer.find('.streamTitle').text('');
                }
                if (streamStats.info) {
                    $audioStreamer.find('.streamTime').text(streamStats.info.time);
                    $audioStreamer.find('.streamSize').text(streamStats.info.size);
                    $audioStreamer.find('.streamBitrate').text(streamStats.info.bitrate);
                    $audioStreamer.find('.streamSpeed').text(streamStats.info.speed);
                } else {
                    $audioStreamer.find('.streamTime').text('');
                    $audioStreamer.find('.streamSize').text('');
                    $audioStreamer.find('.streamBitrate').text('');
                    $audioStreamer.find('.streamSpeed').text('');
                }
                if (streamStats.status === 'connected') {
                    $audioStreamer.find(".streamConnected").removeClass("text-danger").addClass("text-success");
                } else {
                    $audioStreamer.find(".streamConnected").removeClass("text-success").addClass("text-danger");
                };

            } else {
                $audioStreamer.find(".streamStatus").text("");
                $audioStreamer.find('.icyDescription').text('');
                $audioStreamer.find('.icyGenre').text('');
                $audioStreamer.find('.icyName').text('');
                $audioStreamer.find('.icyPub').text('');
                $audioStreamer.find('.icyUrl').text('');
                $audioStreamer.find('.streamTitle').text('');
                $audioStreamer.find('.streamTime').text('');
                $audioStreamer.find('.streamSize').text('');
                $audioStreamer.find('.streamBitrate').text('');
                $audioStreamer.find('.streamSpeed').text('');
                $audioStreamer.find(".streamConnected").removeClass("text-success").removeClass("text-danger");
            }
        }

    };




    var updateAudioStreamerClientStats = function ($audioStreamer, clientStats) {

        if ($audioStreamer) {
            if (clientStats) {
                $audioStreamer.find(".clientCount").text(clientStats.clientCounter);
                $audioStreamer.find(".maxClients").text(clientStats.maxClients);
            } else {
                $audioStreamer.find(".clientCount").text("");
                $audioStreamer.find(".maxClients").text("");
            }
        }

    };

    var $audioStreamerTemplate = $(".audioStreamerDetailContainer").find(".audioStreamer").clone();

     var audioStreamerDetailClose = function () {
        Service.detailAudioStreamerId = null;
        $(".audioStreamerDetailContainer").hide();
        //reset the container to the blank so if we open all the data is empty

        $(".audioStreamersListContainer").show();

    };

    var isEmptyObject = function (obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                return false;
        }
        return true;
    };

    var openStreamerDetails = function (evt) {
        

        var $audioStreamer = $(evt.currentTarget).parents(".audioStreamer");
        var audioStreamerId = $audioStreamer.attr("data-audioStreamerId");
        Service.detailAudioStreamerId = audioStreamerId;
        var audioStreamer = Service.commonData.audioStreamers[audioStreamerId];
        var $audioStreamerContainer = $(".audioStreamerDetailContainer").empty().append($audioStreamerTemplate.clone());
        $audioStreamerContainer.find(".btnAudioStreamerBack").on('click', audioStreamerDetailClose);
        //this handles all of the audio Streamer Action buttons
        $audioStreamerContainer.find(".btn").on("click", streamerDetailAction);
        Service.streamerConfigEditor = new JSONEditor($audioStreamerContainer.find(".queueStreamerConfigJson")[0], {});
        Service.streamerFileUpdatesEditor = new JSONEditor($audioStreamerContainer.find(".queueStreamerFileUpdatesJson")[0], {});
        //Handle the Tab Click events so we can subscribe to streamer Logs.
        $audioStreamerContainer.find('a[data-toggle="tab"]').on('shown.bs.tab', function (evt) {
            var target = $(evt.target).attr("href"); // activated tab
            var $audioStreamer = $(evt.currentTarget).parents(".audioStreamer");
            var audioStreamerId = $audioStreamer.attr("data-audioStreamerId");
            switch (target) {
                case "#queueStreamerLogs":
                    Service.socket.emit("AudioStreamerAction", { "actionId": getFakeGuid(), "audioStreamerId": audioStreamerId, "action": "GetStreamerLogs" });
                    break;
                case "#queueStreamerConfig":
                    
                    if (isEmptyObject(Service.streamerConfigEditor.get()) === true) {
                        Service.socket.emit("AudioStreamerAction", { "actionId": getFakeGuid(), "audioStreamerId": audioStreamerId, "action": "ReadConfig" });
                    }
                    break;
                case "#queueStreamerFileUpdates":
                    if (isEmptyObject(Service.streamerFileUpdatesEditor.get()) === true) {
                        Service.socket.emit("AudioStreamerAction", { "actionId": getFakeGuid(), "audioStreamerId": audioStreamerId, "action": "ReadFileUpdates" });
                    }
                    break;
            }
        });

        updateAudioStreamerDetails($audioStreamerContainer, audioStreamer);
        $audioStreamerContainer.find(".editAudioStreamerAliasContainer").hide();
        $audioStreamerContainer.find(".btnEditAudioStreamerAlias").on("click", function () {
            $audioStreamerContainer.find(".audioStreamerAliasContainer").hide();
            $audioStreamerContainer.find(".editAudioStreamerAliasContainer").show();
        });
        $audioStreamerContainer.find(".btnEditAudioStreamerAliasSave").on("click", function () {
            
            var audioStreamerAlias = $audioStreamerContainer.find(".editAudioStreamerAlias").val();
            if (audioStreamerAlias && audioStreamerAlias !== "") {
                Service.socket.emit("EditAudioStreamerAlias", { "audioStreamerId": audioStreamerId, "audioStreamerAlias": audioStreamerAlias });
            }

            //update the audioStreamerName
        });
        $audioStreamerContainer.find(".btnEditAudioStreamerAliasCancel").on("click", function () {
            $audioStreamer.find(".editAudioStreamerAlias").val($audioStreamer.find(".audioStreamerAlias").text());
            $audioStreamerContainer.find(".editAudioStreamerAliasContainer").hide();
            $audioStreamerContainer.find(".audioStreamerAliasContainer").show();
            
        });


        $(".audioStreamersListContainer").hide();
        $audioStreamerContainer.show();

    };

    var streamerDetailAction = function (evt) {
        var $audioStreamer = $(evt.currentTarget).parents(".audioStreamer");
        var audioStreamerId = $audioStreamer.attr("data-audioStreamerId");
        var audioStreamer = Service.commonData.audioStreamers[audioStreamerId];
        var action = $(evt.currentTarget).attr("data-action");
        var message = { "actionId": getFakeGuid(), "audioStreamerId": audioStreamerId, "action": action };

        switch (action) {
            case "SaveConfig":
                message.data = Service.streamerConfigEditor.get();
                break;
            case "SaveFileUpdates":
                message.data = Service.streamerFileUpdatesEditor.get();
                break;
            //case "DownloadApplianceLogFiles":
            //    if (Service.downloadFileWindow === undefined) {
            //        Service.downloadFileWindow = window.open('/filedownload.htm');
            //    }
            //    break;
        }

        Service.socket.emit("AudioStreamerAction", message);
    };

    var findAudioStreamer = function (audioStreamerId) {

        var $audioStreamer = null;
        if (Service.commonData.audioStreamers[audioStreamerId] && Service.commonData.audioStreamers[audioStreamerId].div !== undefined) {
            $audioStreamer = Service.commonData.audioStreamers[audioStreamerId].div;
        } else {
            $.each($(".audioStreamers").find('.audioStreamer'), function (index, element) {
                if ($(element).attr("data-audioStreamerId") === audioStreamerId) {
                    $audioStreamer = $(element);
                    return;
                }
            });
        }
        return $audioStreamer;
    };

    var updateAudioStreamer = function (audioStreamer) {
        var $audioStreamer = findAudioStreamer(audioStreamer.audioStreamerId);
        var newElement = false;
        if ($audioStreamer === null) {
            $audioStreamer = $("div.audioStreamerTemplate").find('.audioStreamer').clone();
            $audioStreamer.attr("data-audioStreamerId", audioStreamer.audioStreamerId);
            newElement = true;
            //$audioStreamer.find(".btnStreamerOpen").on('click', openStreamerDetails);
            $audioStreamer.find("td").on('click', openStreamerDetails);
            $audioStreamer.find(".asCmd").on('click', streamerDetailAction);
        }
        updateAudioStreamerRow($audioStreamer, audioStreamer);
        if (newElement) {
            $(".audioStreamers").append($audioStreamer);
        }
        if (Service.detailAudioStreamerId === audioStreamer.audioStreamerId) {
            var $audioStreamerContainer = $(".audioStreamerDetailContainer");
            updateAudioStreamerDetails($audioStreamerContainer, audioStreamer);
        }
        return $audioStreamer;
    };


    var updateAudioStreamerRow = function ($audioStreamer, audioStreamer) {
        if (audioStreamer.audioStreamerAlias) {
            $audioStreamer.find(".audioStreamerAlias").text(audioStreamer.audioStreamerAlias);
        } else {
            $audioStreamer.find(".audioStreamerAlias").text(audioStreamer.audioStreamerId);
        }
        if (audioStreamer.audioStreamerId) {
            $audioStreamer.find(".audioStreamerId").text(audioStreamer.audioStreamerId);
        }
        //we are populating information from a save file that if 
        if (audioStreamer.status === undefined) {
            audioStreamer.status === 'fromFile';
        }
        if (audioStreamer.connectDate) {
            $audioStreamer.find(".audioStreamerConnectDate").text(moment(audioStreamer.connectDate).format('lll'));
        }
        if (audioStreamer.startupDate) {
            $audioStreamer.find(".audioStreamerStartupDate").text(moment(audioStreamer.startupDate).format('lll'));
        }
        
        if (audioStreamer.connInfo) {
            $audioStreamer.find(".connectionIp").text(audioStreamer.connInfo.ip);
        }
        if (audioStreamer.version) {
            $audioStreamer.find(".version").text(audioStreamer.version);
        }
        if ($audioStreamer.environment) {
            $audioStreamer.find(".environment").text(audioStreamer.environment);
        }
        if (audioStreamer.status === "connected") {
             $audioStreamer.find(".managmentServerConnected").removeClass("text-danger").removeClass('text-warning').addClass("text-success"); 
        } else if (audioStreamer.status === "invalid certificate") {
            $audioStreamer.find(".managmentServerConnected").removeClass("text-danger").removeClass("text-success").addClass("text-warning");
        } else { 
            $audioStreamer.find(".managmentServerConnected").removeClass("text-warning").removeClass('text-success').addClass("text-danger");
        }
        if (audioStreamer.clientStats) {
            updateAudioStreamerClientStats($audioStreamer, audioStreamer.clientStats);
        }
        if (audioStreamer.streamStats) {
            updateAudioStreamerStreamStats($audioStreamer, audioStreamer.streamStats);
        }
        if (audioStreamer.startupStats) {
            updateAudioStreamerStartupStats($audioStreamer, audioStreamer.startupStats);
        }
        if (audioStreamer.machineStats) {
            updateAudioStreamerMachineStats($audioStreamer, audioStreamer.machineStats);
        }

        
        
        return $audioStreamer;
    };

    var updateAudioStreamerDetails = function ($audioStreamer, audioStreamer) {

        $audioStreamer.find(".audioStreamer").attr("data-audioStreamerId", audioStreamer.audioStreamerId);
        if (audioStreamer.audioStreamerAlias) {
            $audioStreamer.find(".audioStreamerAlias").text(audioStreamer.audioStreamerAlias);
            $audioStreamer.find(".editAudioStreamerAlias").val(audioStreamer.audioStreamerAlias);
        } else {
            $audioStreamer.find(".audioStreamerAlias").text(audioStreamer.audioStreamerId);
            $audioStreamer.find(".editAudioStreamerAlias").val(audioStreamer.audioStreamerId);
        }

        
       
        $audioStreamer.find(".audioStreamerId").text(audioStreamer.audioStreamerId);
        
        
        if (audioStreamer.connectDate) {
            $audioStreamer.find(".audioStreamerConnectDate").text(moment(audioStreamer.connectDate).format('lll'));
        }
        if (audioStreamer.startupDate) {
            $audioStreamer.find(".audioStreamerStartupDate").text(moment(audioStreamer.startupDate).format('lll'));
        }
        if (audioStreamer.audioStreamerId) {
            $audioStreamer.find(".audioStreamerId").text(audioStreamer.audioStreamerId);
        }
        if (audioStreamer.connInfo) {
            $audioStreamer.find(".connectionIp").text(audioStreamer.connInfo.ip);
        }
        if (audioStreamer.version) {
            $audioStreamer.find(".version").text(audioStreamer.version);
        }
        if (audioStreamer.environment) {
            $audioStreamer.find(".environment").text(audioStreamer.environment);
        }
        
                                
        if (audioStreamer.status === "connected") {
            $audioStreamer.find(".managmentServerConnected").removeClass("text-danger").removeClass('text-warning').addClass("text-success");
        } else if (audioStreamer.status === "invalid certificate") {
            $audioStreamer.find(".managmentServerConnected").removeClass("text-danger").removeClass("text-success").addClass("text-warning");
        } else {
            $audioStreamer.find(".managmentServerConnected").removeClass("text-warning").removeClass('text-success').addClass("text-danger");
        }

        if (audioStreamer.clientStats) {
            updateAudioStreamerClientStats($audioStreamer, audioStreamer.clientStats);
        }
        if (audioStreamer.streamStats) {
            updateAudioStreamerStreamStats($audioStreamer, audioStreamer.streamStats);
        }
        if (audioStreamer.startupStats) {
            updateAudioStreamerStartupStats($audioStreamer, audioStreamer.startupStats);
        }
        if (audioStreamer.machineStats) {
            updateAudioStreamerMachineStats($audioStreamer, audioStreamer.machineStats);
        }

        if (audioStreamer.serverCertificates) {
            updateAudioStreamerServerCertificates($audioStreamer, audioStreamer.serverCertificates);
        }
        if (audioStreamer.serverCACertificates) {
            updateAudioStreamerServerCACertificates($audioStreamer, audioStreamer.serverCACertificates);
        }
        if (audioStreamer.clientCertificates) {
            updateAudioStreamerClientCertificates($audioStreamer, audioStreamer.clientCertificates);
        }
        return $audioStreamer;
    };

    
    //setInterval(time, 1000);

    

    $("Button.btnDeployBuildProd").on('click', function () {
        Service.socket.emit('packageUpdate', { environment: 'production' });
    });
    $("Button.btnDeployBuildBeta").on('click', function () {
        Service.socket.emit('packageUpdate', { environment: 'beta' });
    });
    $("Button.btnDeployBuildAlpha").on('click', function () {
        Service.socket.emit('packageUpdate', { environment: 'alpha' });
    });

    $("Button.btnCleanGit").on('click', function () {
        Service.socket.emit('cleanGitRepository');
    });

    $("Button.btnTest").on('click', function () {
        Service.socket.emit('btnTest');
    });

    $("Button.btnLetsEncrypt").on('click', function () {
        Service.socket.emit('createLetsEncrypt');
    });

    $("Button.btnCreateDefaultApplianceCertificate").on('click', function () {
        Service.socket.emit('createDefaultApplianceCertificate');
    });
    

    $("i.btnRefreshServerLogs").on('click', function () {
        Service.socket.emit('serverLogs');
    });
    

    Service.socket.on('createClientCertificate', function (message, fileData) {
        //response message for issuing a packageUpdate
        console.log('createClientCertificate', message);
        let strMessage = '';

        if (message.message) {
            strMessage = message.message;
        }
        if (message.error) {
            strMessage = strMessage + message.error;
        }
        if (message.status === 'complete') {
            let type = 'success';
            if (message.success !== true) {
                type = 'danger';
                $('.createClientCertificateError').text(strMessage).show();
            } else {
                if (fileData) { 
                    const fileDataBlob = new Blob([new Uint8Array(fileData)], { type: "application/x-pkcs12" });
                    const url = URL.createObjectURL(fileDataBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = message.filename || 'download';
                    const clickHandler = () => {
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                            this.removeEventListener('click', clickHandler);
                        }, 150);
                    };
                    a.addEventListener('click', clickHandler, false);
                    a.click();
                }
            }
            $.notify({ message: 'Client Certificate Creation Complete' + ' ' + strMessage }, { type: type });

            $("Button.btnCreateClientCertificate").prop('disabled', false).find('.status').hide();
            //$("Button.btnCreateLetsEncryptClientCertificate").prop('disabled', false).find('.status').hide();


        } else {
            $("Button.btnCreateClientCertificate").prop('disabled', true).find('.status').show();
            //$("Button.btnCreateLetsEncryptClientCertificate").prop('disabled', true).find('.status').show();

            
            if (message.error) {
                $.notify({ message: message.msg + "<br/>" + + message.error + ' ' + strMessage }, { type: 'danger' });
            } else {
                $.notify({ message: message.msg + ' ' + strMessage }, { type: 'success' });
            }
        }


    });

    $(".btnCreateClientCertificate").on('click', function () {
        $('.createClientCertificateError').hide();
        let clientId = $('input.clientId').val();
        if (clientId === '') {
            $('.createClientCertificateError').text('clientName Is Required').show();
            return;
        }
        
        if (clientId.includes('.')) {
            $('.createClientCertificateError').text('clientName can not contain a period! ClientName Without the Domain Name').show();
            return;
        }
        let pfxPassword = $('input.pfxPassword').val();
        if (pfxPassword === '') {
            pfxPassword = 'password';
        }
        Service.socket.emit('createClientCertificate', { clientId: clientId, pfxPassword: pfxPassword });
    });


    

    //$(".btnCreateLetsEncryptClientCertificate").on('click', function () {
    //    $('.createClientCertificateError').hide();
    //    let clientId = $('input.clientId').val();
    //    if (clientId === '') {
    //        $('.createClientCertificateError').text('clientName Is Required').show();
    //        return;
    //    }
    //    if (clientId.includes('.')) {
    //        $('.createClientCertificateError').text('clientName can not contain a period! ClientName Without the Domain Name').show();
    //        return;
    //    }
    //    let pfxPassword = $('input.pfxPassword').val();
    //    if (pfxPassword === '') {                                                               
    //        pfxPassword = 'password';
    //    }
    //    Service.socket.emit('createLetsEncryptClientCertificate', { clientId: clientId, pfxPassword: pfxPassword });
    //});

   
    //
});