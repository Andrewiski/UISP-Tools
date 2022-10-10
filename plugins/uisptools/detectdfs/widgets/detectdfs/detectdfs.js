    "use strict"
    import baseClientSide from "/plugins/baseClientSide.js";
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

    

    class detectdfs extends baseClientSide.widget
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
        fetchDevice(options){
            return $.uisptools.ajax("/uisptools/api/nms/devices/" + options.deviceId);
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
                
                var $deviceItem = options.$deviceItem
                self.updateDeviceStatus($deviceItem, "refresh");
                self.fetchDeviceConfiguration(device).then(
                    function(deviceConfig){
                        self.updateDeviceItem(options);
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

        

        onDeviceRefreshClick(evt){
            //<i class="fa-solid fa-arrow-rotate-right"></i>
            let $deviceItem = $(evt.currentTarget).parents(".deviceListItem");
            let deviceId = $deviceItem.attr("data-deviceId");
            self.updateDeviceStatus($deviceItem, "refresh");
            self.fetchDevice({deviceId:deviceId}).then(
                function(device){
                    self.updateDeviceItem({device:device, $deviceItem:$deviceItem})
                    //let device = {identification: {id:deviceId}};
                    self.fetchDeviceConfigurationUpdateDisplay({device:device, $deviceItem:$deviceItem}).then(
                        function(options){
                            //$deviceItem.addClass("table-success"); 
                            self.updateDeviceStatus($deviceItem, "ok");     
                        }
                    )
                },
                function(ex){

                }
            )
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

        onDeviceOpenClick(evt){
            let $deviceItem = $(evt.currentTarget).parents(".deviceListItem");
            let deviceId = $deviceItem.attr("data-deviceId");
            let deviceIp = $deviceItem.find(".deviceIpAddress").text();
            let subnetPosition = deviceIp.indexOf("/");
            if(subnetPosition > 0 ){
                deviceIp = deviceIp.substring(0, subnetPosition);
            }
            let url = '/uisptools/api/nms/devices/' + deviceId +  '/iplink/redirect';
            $.uisptools.ajax(url, {method:"POST"}).then(
                function(result){
                    //https://10.100.28.2/ticket.cgi?ticketid=a33e6abf434859a349e0699cb701e692
                    let httpsPort = "";
                    if(result.httpsPort && result.httpsPort !== 443){
                        httpsPort = ":" + result.httpsPort
                    }
                    window.open("https://" + deviceIp + httpsPort + "/ticket.cgi?ticketid=" + result.token, "_blank");
                },
                function(err){
                    window.open("https://" + deviceIp, "_blank");
                }
            )
        }
    

        updateDeviceStatus($deviceItem, status){

            if(status === "ok"){
                $deviceItem.find(".deviceStatus .deviceStatusOk").show();
            }else{
                $deviceItem.find(".deviceStatus .deviceStatusOk").hide();
            }
            if(status === "refresh"){
                $deviceItem.find(".deviceStatus .deviceStatusRefresh").show();
            }else{
                $deviceItem.find(".deviceStatus .deviceStatusRefresh").hide();
            }

            if(status === "warning"){
                $deviceItem.find(".deviceStatus .deviceStatusWarning").show();
            }else{
                $deviceItem.find(".deviceStatus .deviceStatusWarning").hide();
            }
            if(status === "error"){
                $deviceItem.find(".deviceStatus .deviceStatusError").show();
            }else{
                $deviceItem.find(".deviceStatus .deviceStatusError").hide();
            }
            

           
        }

        updateDeviceItem(options){
            let device = options.device;
            let $deviceItem = options.$deviceItem;
            $deviceItem.attr("data-deviceId", device.identification.id);
            $deviceItem.find(".deviceName").text(device.identification.name);
            $deviceItem.find(".deviceModel").text(device.identification.model);
            $deviceItem.find(".deviceIpAddress").text(device.ipAddress);
            $deviceItem.find(".deviceType").text(device.identification.type);
            if(device.attributes.ssid){
                $deviceItem.find(".deviceLinkName").text(device.attributes.ssid);
            }else{
                $deviceItem.find(".deviceLinkName").text("");
            }

            if(device.overview && device.overview.frequency){
                $deviceItem.find(".deviceFrequency").text(device.overview.frequency );
            }else{
                $deviceItem.find(".deviceFrequency").text("");
            }
        

            if(device.overview && device.overview.linkScore && device.overview.linkScore.linkScore){
                $deviceItem.find(".deviceLinkScore").text((device.overview.linkScore.linkScore * 100).toFixed(1).toString() + "%" );
            }else{
                $deviceItem.find(".deviceLinkScore").text("");
            }

            if(device.overview && device.overview.stationsCount){
                $deviceItem.find(".deviceStationCount").text(device.overview.stationsCount);
            }else{
                $deviceItem.find(".deviceStationCount").text("");
            }
            
            if(device.overview && device.overview.status === "active"){
                self.updateDeviceStatus($deviceItem, "ok");
                $deviceItem.removeClass("table-danger");
            }else{
                if(device.overview && device.overview.status){
                    
                    self.updateDeviceStatus($deviceItem, "offline");
                    
                }
                $deviceItem.addClass("table-danger");
                
            }


            //Look for data in the DeviceConfig
            if (device.deviceConfig){  

                
                let currentFrequency = null;
                let configFrequency = null;
                if(device.overview && device.overview.frequency){
                    currentFrequency = device.overview.frequency
                }
                switch(device.identification.type){
                    case "airMax":
                        if(device.deviceConfig.airmax && device.deviceConfig.airmax.airmax && device.deviceConfig.airmax.airmax.frequency){
                            currentFrequency = device.deviceConfig.airmax.airmax.frequency;
                        }
                        if(device.deviceConfig.airmaxConfigWireless && device.deviceConfig.airmaxConfigWireless.controlFrequency ){
                            configFrequency = device.deviceConfig.airmaxConfigWireless.controlFrequency;
                        }
                    case "airCube":
                        if(device.deviceConfig.aircube
                            && device.deviceConfig.aircube.aircube 
                            && device.deviceConfig.aircube.aircube.wifi5Ghz
                            && device.deviceConfig.aircube.aircube.wifi5Ghz.channel){
                                currentFrequency = self.wifi5GhzChannelToFrequency(device.deviceConfig.aircube.aircube.wifi5Ghz.channel);
                        }
                        if(device.deviceConfig.aircubeConfigWireless 
                            && device.deviceConfig.aircubeConfigWireless.wifi5Ghz 
                            && device.deviceConfig.aircubeConfigWireless.wifi5Ghz.channel){
                                configFrequency = self.wifi5GhzChannelToFrequency(device.deviceConfig.aircubeConfigWireless.wifi5Ghz.channel);
                        }
                }
                
                let displayFrequency = "";
                if(currentFrequency){
                    displayFrequency = displayFrequency + currentFrequency;
                }
                if(configFrequency ){
                    displayFrequency = displayFrequency + " (" + configFrequency + ")" ;
                }
                
                $deviceItem.find(".deviceFrequency").text(displayFrequency );
                
                //DFS Channel Change Detected
                if(currentFrequency && configFrequency                     
                    && currentFrequency != configFrequency){
                        $deviceItem.find(".deviceFrequency").addClass('table-warning');
                }else{
                    $deviceItem.find(".deviceFrequency").removeClass('table-warning');
                }
            }

        }

       

        bindDevices(devices){
            
            let $element = $(self.element);
            let $deviceList = $element.find(".deviceList").empty();
            let $deviceItemTemplate = $element.find(".templates").find(".deviceListTemplate").find(".deviceListItem");
            for(var i = 0; i < devices.length; i++){
           
                let device = devices[i];
                let $deviceItem = $deviceItemTemplate.clone();
                self.updateDeviceItem({device:device, $deviceItem: $deviceItem});
                $deviceList.append($deviceItem);
                if(device.overview && device.overview.status === "active"){
                    self.fetchDeviceConfigurationUpdateDisplay({device:device, $deviceItem:$deviceItem}).then(
                        function(options){
                            
                            //$deviceItem.addClass("table-success"); 
                            self.updateDeviceStatus($deviceItem, "ok");     
                        }
                    )
                }
            }
           
            $deviceList.find(".btnDeviceOpen").on("click",this.onDeviceOpenClick)
            $deviceList.find(".btnDeviceRestart").on("click", this.onDeviceRestartClick)
            $deviceList.find(".btnDeviceRefresh").on("click", this.onDeviceRefreshClick)
            
        }

        bind(){
            return new Promise((resolve, reject) => {
                Promise.all([self.fetchApDevices()]).then(
                    function(results){
                        let devices = results[0];
                        self.bindDevices(devices);
                        
                        
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

   
