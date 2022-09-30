    "use strict"
    import uisptools from "/plugins/uisptools/uispTools.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2022 Digital Example
    * Date: 2022-09-15
    */

    /** 
    @name uisptools.detectdfs.widget.detectdfs
    @class This is the detectdfs widget class for the UISPTools widget framework
    @description We make a call to nms.devices/ap then for each device call the /devices/{id}/configuration /devices/airos/{id}/configuration and compare frequency to detect if device has changed channel due to dfs
    */

    

    class detectdfs extends uisptools.widget
     {
        
        self = null;
        
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/detectdfs/detectdfs.htm";
                    $.uisptools.ajax({
                        method: 'GET',
                        url:  url,
                        dataType: 'html'
                    }).then(
                        function (widgetHtml) {
                            $element.html(widgetHtml);
                            resolve();
                        },
                        function (err) {
                            $.logToConsole("Error: uisptools.loadWidget.onLoad.getWidgetHtml failed " + err);
                            reject(err);
                        }
                    );
                }catch(ex){
                    $.logToConsole("ERROR uisptools.loadWidget: " + ex.toString());
                    var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during uisptools.loadWidget.");
                    reject(objError);
                }
            });
        }

        fetchApDevices(){
            return $.uisptools.ajax("/uisptools/api/nms/devices?role=ap");
        }

        
        // fetchApDevicesWithConfigurations(){
        //     return new Promise((resolve, reject) => {
        //         $.uisptools.ajax("/uisptools/api/nms/devices/aps/profiles").then(
        //             function(devices){
        //                 let configCalls = [];
        //                 for(var i = 0; i < devices.length; i++){
        //                     let device = devices[i];
        //                     configCalls.push(fetchDeviceConfiguration(device));
        //                 }
        //                 Promise.all(configCalls).then(
        //                     function(results){
        //                         resolve(devices);
        //                     },
        //                     function(err){
        //                         reject(err);
        //                     }
        //                 )
        //             },
        //             function(err){
        //                 reject(err);
        //             }
        //         )
                
        //     })
            
        // }

        fetchDeviceConfiguration(device){
            return new Promise((resolve, reject) => {
                var deviceType = ""
                if(device.identification && device.identification.type === "airMax"){
                    deviceType = "airmax"; 
                }
                if(device.identification && device.identification.type === "airCube"){
                    deviceType = "aircube"; 
                }
                
                switch(deviceType){
                    case "airmax":
                        Promise.all([self.fetchDeviceAirMax(device), self.fetchDeviceAirMaxWirelessConfig(device)]).then(
                            function(results){
                                let airmax, airmaxConfigWireless;
                                airmax = results[0];
                                airmaxConfigWireless = results[1];
                                if(device.deviceConfig === undefined){
                                    device.deviceConfig = {};
                                }
                                device.deviceConfig.airmax = airmax;
                                device.deviceConfig.airmaxConfigWireless = airmaxConfigWireless;
                               
                                resolve(device.deviceConfig);
                            },
                            function(err){
                                resolve(null);
                            }
                        )
                        break;
                        case "aircube":
                            Promise.all([self.fetchDeviceAirCube(device), self.fetchDeviceAirCubeWirelessConfig(device)]).then(
                                function(results){
                                    let aircube, aircubeConfigWireless;
                                    aircube = results[0];
                                    aircubeConfigWireless = results[1];
                                    if(device.deviceConfig === undefined){
                                        device.deviceConfig = {};
                                    }
                                    device.deviceConfig.aircube = aircube;
                                    device.deviceConfig.aircubeConfigWireless = aircubeConfigWireless;
                                   
                                    resolve(device.deviceConfig);
                                },
                                function(err){
                                    resolve(null);
                                }
                            )
                            break;
                    default:
                        return resolve(null);
                }
                
            })
        }

        fetchDeviceAirOsConfiguration(device){
            var deviceId = null;
            if(device.identification && device.identification.id){
                deviceId=device.identification.id;
            }
            if(deviceId){
                return $.uisptools.ajax("/uisptools/api/nms/devices/airos/" + deviceId + "/configuration",{showErrorDialog:false});
            }else{
                return Promise.resolve(null);
            }
        }

        fetchDeviceAirMaxWirelessConfig(device){
            var deviceId = null;
            if(device.identification && device.identification.id){
                deviceId=device.identification.id;
            }
            if(deviceId){
                return $.uisptools.ajax("/uisptools/api/nms/devices/airmaxes/" + deviceId + "/config/wireless",{showErrorDialog:false});
            }else{
                return Promise.resolve(null);
            }
        }

        fetchDeviceAirMax(device){
            var deviceId = null;
            if(device.identification && device.identification.id){
                deviceId=device.identification.id;
            }
            if(deviceId){
                return $.uisptools.ajax("/uisptools/api/nms/devices/airmaxes/" + deviceId, {showErrorDialog:false});
            }else{
                return Promise.resolve(null);
            }
        }

        fetchDeviceAirCubeWirelessConfig(device){
            var deviceId = null;
            if(device.identification && device.identification.id){
                deviceId=device.identification.id;
            }
            if(deviceId){
                return $.uisptools.ajax("/uisptools/api/nms/devices/aircubes/" + deviceId + "/config/wireless",{showErrorDialog:false});
            }else{
                return Promise.resolve(null);
            }
        }

        fetchDeviceAirCube(device){
            var deviceId = null;
            if(device.identification && device.identification.id){
                deviceId=device.identification.id;
            }
            if(deviceId){
                return $.uisptools.ajax("/uisptools/api/nms/devices/aircubes/" + deviceId, {showErrorDialog:false});
            }else{
                return Promise.resolve(null);
            }
        }


        


        

        fetchDeviceConfigurationUpdateDisplay(options){

            return new Promise((resolve, reject) => {
                var device = options.device;

            
                self.fetchDeviceConfiguration(device).then(
                    function(deviceConfig){
                        self.updateDeviceConfiguration(options);
                        resolve(options);
                    },
                    function(err){
                        resolve(options);
                    }
                );
            });
        }

        wifi5GhzChannelToFrequency(channel){
            return 5000 + (channel * 5)
        }

        updateDeviceConfiguration(options){
            var device = options.device;
            var $deviceItem = options.$element
            if (device.deviceConfig){  //wireless.interfaces[0].frequency
                
                // if(device.deviceConfig.wireless 
                //     && device.deviceConfig.wireless.interfaces 
                //     && device.deviceConfig.wireless.interfaces.length > 0
                //     && device.deviceConfig.wireless.interfaces[0].apMode === true
                //     && device.deviceConfig.wireless.interfaces[0].frequency                    
                //     && device.frequency != device.deviceConfig.wireless.interfaces[0].frequency.tx){

                //overview.frequency

                //Get Detail
                let currentFrequency = null;
                if(device.deviceConfig.airmax && device.deviceConfig.airmax.airmax && device.deviceConfig.airmax.airmax.frequency){
                    currentFrequency = device.deviceConfig.airmax.airmax.frequency;
                }else if(device.deviceConfig.aircube
                    && device.deviceConfig.aircube.aircube 
                    && device.deviceConfig.aircube.aircube.wifi5Ghz
                    && device.deviceConfig.aircube.aircube.wifi5Ghz.channel){
                        currentFrequency = self.wifi5GhzChannelToFrequency(device.deviceConfig.aircube.aircube.wifi5Ghz.channel);
                }else if(device.overview && device.overview.frequency){
                    currentFrequency = device.overview.frequency
                }

                let configFrequency = null;
                if(device.deviceConfig.airmaxConfigWireless && device.deviceConfig.airmaxConfigWireless.controlFrequency ){
                    configFrequency = device.deviceConfig.airmaxConfigWireless.controlFrequency;
                }else if(device.deviceConfig.aircubeConfigWireless 
                    && device.deviceConfig.aircubeConfigWireless.wifi5Ghz 
                    && device.deviceConfig.aircubeConfigWireless.wifi5Ghz.channel){
                        configFrequency = self.wifi5GhzChannelToFrequency(device.deviceConfig.aircubeConfigWireless.wifi5Ghz.channel);
                }else if(device.deviceConfig.airmaxConfigWireless && device.deviceConfig.airmaxConfigWireless.controlFrequency ){
                    configFrequency = device.deviceConfig.airmaxConfigWireless.controlFrequency;
                }

                

                

                // if(currentFrequency && configFrequency                     
                //     && currentFrequency != configFrequency){
                //     $deviceItem.addClass('table-warning');
                // }else{
                //     //$deviceItem.addClass('table-info');
                // }
                let displayFrequency = "";
                if(currentFrequency){
                    displayFrequency = displayFrequency + currentFrequency;
                }
                if(configFrequency ){
                    displayFrequency = displayFrequency + " (" + configFrequency + ")" ;
                }
                
                
                

                if(currentFrequency && configFrequency                     
                    && currentFrequency != configFrequency){
                        let $deviceFrequency = $deviceItem.find(".deviceFrequency");
                        $deviceFrequency.addClass('table-warning').html(displayFrequency);
                        $('<a class="deviceRestart" href="javascript:void(0)"><i class="fa-solid fa-arrow-rotate-right"></i></a>')
                        .on("click", self.onDeviceRestartClick)
                        .appendTo($deviceFrequency)
                
                }else{
                    $deviceItem.find(".deviceFrequency").text(displayFrequency );
                }
            }
        }

        onDeviceRestartClick(evt){
            
            let $deviceItem = $(evt.currentTarget).parents(".deviceListItem");
            let deviceId = $deviceItem.attr("data-deviceId");
            
            
            let url = '/uisptools/api/nms/devices/' + deviceId +  '/restart';
            let notifyToast;
            $.uisptools.ajax(url, {method:"POST"}).then(
                function(result){
                     
                    if(result.result === true){
                        notifyToast = $.uisptools.notify({title:"Device Reset Success", body:'<span>Device has been sent a reset</span>', type:"success"});
                        
                    }else{
                        $.uisptools.notify({title:"Device Reset Failed", body:'<span>Device failed to reset</span>', type:"danger"}).then(
                            function(toast){
                                notifyToast = toast;
                            }

                        );
                        
                    }
                },
                function(err){
                    $.uisptools.notify({title:"Device Reset Error", body:'<span>Device failed to reset</span></br>' + err, type:"danger"}).then(
                        function(toast){
                            notifyToast = toast;
                        }

                    );
                }
            )
        
            
        }

        bindDevices(devices){
            
            let $element = $(self.element);
            let $deviceList = $element.find(".deviceList").empty();
            let $deviceItemTemplate = $element.find(".templates").find(".deviceListTemplate").find(".deviceListItem");
            for(var i = 0; i < devices.length; i++){
            //for(var i = 0; i < 10; i++){
                let device = devices[i];
                let $deviceItem = $deviceItemTemplate.clone();
                /*
                <td class="deviceName"></td>
                <td class="deviceModel"></td>
                <td class="deviceUptime"></td>
                <td class="deviceIpAddress"></td>
                <td class="deviceLinkName"></td>
                <td class="deviceFrequency"></td>
                */
                $deviceItem.attr("data-deviceId", device.identification.id);
                $deviceItem.find(".deviceName").text(device.identification.name);
                $deviceItem.find(".deviceModel").text(device.identification.model);
                $deviceItem.find(".deviceIpAddress").html('<a class="deviceOpenLink" href="javascript:void(0)">' + device.ipAddress + '</a>');
                $deviceItem.find(".deviceType").text(device.identification.type);
                if(device.attributes.ssid){
                    $deviceItem.find(".deviceLinkName").text(device.attributes.ssid);
                }

                if(device.overview && device.overview.frequency){
                    $deviceItem.find(".deviceFrequency").text(device.overview.frequency );
                }

                if(device.overview && device.overview.linkScore && device.overview.linkScore.linkScore){
                    $deviceItem.find(".deviceLinkScore").text((device.overview.linkScore.linkScore * 100).toFixed(1).toString() + "%" );
                }

                if(device.overview && device.overview.stationsCount){
                    $deviceItem.find(".deviceStationCount").text(device.overview.stationsCount);
                }
                
                $deviceList.append($deviceItem);
                if(device.overview && device.overview.status === "active"){

                    self.fetchDeviceConfigurationUpdateDisplay({device:device, $element:$deviceItem}).then(
                        function(options){
                            //$deviceItem.addClass("table-success"); 
                            
                            $deviceItem.find(".deviceStatus").html('<i class="fa-solid fa-check"></i>');
                            
                                   
                        }
                    )
                }else{
                    if(device.overview && device.overview.status){
                        //$deviceItem.find(".deviceStatus").text(device.overview.status );
                        $deviceItem.find(".deviceStatus").html('<i class="fa-solid fa-circle-exclamation"></i>');
                    }
                    $deviceItem.addClass("table-danger");
                    //$deviceList.append(options.$element);
                }

                
                
                
                
            }
            //.https://billing.digitalexample.com/nms/api/v2.1/devices/2b44668c-11fb-4fac-ad3e-0a0ca9dd90fb/iplink/redirect
            $deviceList.find(".deviceOpenLink").on("click",
                function(evt){
                    let $deviceItem = $(evt.currentTarget).parents(".deviceListItem");
                    let deviceId = $deviceItem.attr("data-deviceId");
                    let deviceIp = $deviceItem.find(".deviceOpenLink").text();
                    let subnetPosition = deviceIp.indexOf("/");
                    if(subnetPosition > 0 ){
                        deviceIp = deviceIp.substring(0, subnetPosition);
                    }
                    let url = '/uisptools/api/nms/devices/' + deviceId +  '/iplink/redirect';
                    $.uisptools.ajax(url, {method:"POST"}).then(
                        function(result){
                            //https://10.100.28.2/ticket.cgi?ticketid=a33e6abf434859a349e0699cb701e692
                            let httpsPort = "";
                            if(result.httpsPort !== 443){
                                httpsPort = ":" + result.httpsPort
                            }
                            window.open("https://" + deviceIp + httpsPort + "/ticket.cgi?ticketid=" + result.token, "_blank");
                        }
                    )
                }
            )
            
            
        }

        bind(){
            return new Promise((resolve, reject) => {
                Promise.all([self.fetchApDevices()]).then(
                    function(results){
                        let devices = results[0];
                        self.bindDevices(devices);
                        //let $element = $(self.element);
                        
                    }
                )
            });
        }

        init(){
            self = this;
            return new Promise((resolve, reject) => {
                self.loadTemplate().then(
                    function(){
                        self.bind().then(
                            function(){
                                resolve();
                            },
                            function(err){
                                reject(err)
                            }

                        );
                    },
                    function(err){
                        reject(err)
                    } 
                )
            })
        }
       
    }
    
    export {detectdfs}
    export default detectdfs

    // $(function(){
    //     //This is excuted after the document is ready 
    //     //This is a double check to see if the script is loaded make suere it onLoadDeferred if resolved to Bind any elements on a page 
    //     //This allows us to Debug in Chrome by adding the script in the header manualy instead of dynamicaly

    //     //let widget = $.uisptools.widgetFactory.getWidget("uisptools.testing.testapicalls");
    //     let widget = $.uisptools.widgetFactory.getWidget({widgetNamespace: "uisptools.testing.testapicalls", caller:"uisptools.testing.testapicalls.js"});
    //     if(widget.widgetObject.onJSLoadCompleteDeferred.state() === "pending"){
    //         widget.widgetObject.onJSLoadCompleteDeferred.resolve({widgetNamespace:"uisptools.testing.testapicalls", caller:"uisptools.testing.testapicalls.js" });
    //     }

        
    // })
