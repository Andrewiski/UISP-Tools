    "use strict"
    import baseClientSide from "../../../baseClientSide.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2022 Wilco Wireless
    * Date: 2022-10-09
    */

    /** 
    @name wilcowireless.widget.freqmapper
    @class This is the detectdfs widget class for the UISPTools widget framework
    @description We make a call to nms.devices/ap then for each device call the /devices/{id}/configuration /devices/airos/{id}/configuration and compare frequency to detect if device has changed channel due to dfs
    */

    class freqmapper extends baseClientSide.widget
     {
        
        self = null;
        
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/freqmapper/freqmapper.htm";
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
                            $.logToConsole("Error: wilcowireless.loadWidget.onLoad.getWidgetHtml failed " + err);
                            reject(err);
                        }
                    );
                }catch(ex){
                    $.logToConsole("ERROR wilcowireless.loadWidget: " + ex.toString());
                    reject(ex);
                }
            });
        }

        fetchApDevices(){
            return $.uisptools.ajax("/" + this.getBaseUrlPath() + "wilcowireless/api/freqmapper/devices?role=ap");
        }

        wifi5GhzChannelToFrequency(channel){
            return 5000 + (channel * 5)
        }

        sortDeviceByFrequency(a,b){
            let aFreq = a.overview.frequency;
            let bFreq = b.overview.frequency
            if (aFreq < bFreq) {
                return -1;
              }
              if (aFreq > bFreq) {
                return 1;
              }
              // a must be equal to b
              return 0;
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
                                currentFrequency = this.wifi5GhzChannelToFrequency(device.deviceConfig.aircube.aircube.wifi5Ghz.channel);
                        }
                        if(device.deviceConfig.aircubeConfigWireless 
                            && device.deviceConfig.aircubeConfigWireless.wifi5Ghz 
                            && device.deviceConfig.aircubeConfigWireless.wifi5Ghz.channel){
                                configFrequency = this.wifi5GhzChannelToFrequency(device.deviceConfig.aircubeConfigWireless.wifi5Ghz.channel);
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
            let map = this.map;
            let $element = $(self.element);
            let $deviceList = $element.find(".deviceList").empty();
            let $deviceMapList = $element.find(".deviceMapList").empty();
            let $deviceItemTemplate = $element.find(".templates").find(".deviceTemplate").find(".deviceItem");
            let $deviceMapItemTemplate = $element.find(".templates").find(".deviceMapTemplate").find(".deviceMapItem");
            const aircubeImage = "/images/devices/aircube.png";
            const gpsLightImage = "/images/devices/gpslite.png";
            
            let latlngbounds = new google.maps.LatLngBounds();
            for(var i = 0; i < devices.length; i++){
           
                
                let device = devices[i];
                
                
                if(device.identification.type !== "airCube"){
                    
                    if(device.overview && device.overview.status === "active"){
                        
                        const deviceMarker = new google.maps.Marker({
                            position: { lat: device.location.latitude, lng: device.location.longitude },
                            map,
                            icon: gpsLightImage,
                            title: device.identification.displayName + " " + device.overview.frequency
                        });
                        latlngbounds.extend(new google.maps.LatLng(device.location.latitude, device.location.longitude))
                        let $deviceItem = $deviceItemTemplate.clone();
                        let $deviceMapItem = $deviceMapItemTemplate.clone();
                        this.updateDeviceItem({device:device, $deviceItem: $deviceItem});
                        this.updateDeviceItem({device:device, $deviceItem: $deviceMapItem});
                        $deviceList.append($deviceItem);
                        $deviceMapList.append($deviceMapItem);
                        const infowindow = new google.maps.InfoWindow({
                            content: $deviceMapItem[0],
                            ariaLabel: device.identification.displayName,
                          });
                        deviceMarker.addListener("click", () => {
                            infowindow.open({
                              anchor: deviceMarker,
                              map,
                            });
                          });
                    }

                }
            }
            this.map.fitBounds(latlngbounds);
           
            // $deviceList.find(".btnDeviceOpen").on("click",this.onDeviceOpenClick)
            // $deviceList.find(".btnDeviceRestart").on("click", this.onDeviceRestartClick)
            // $deviceList.find(".btnDeviceRefresh").on("click", this.onDeviceRefreshClick)
            
        }

        bind(){
            return new Promise((resolve, reject) => {
                const parsedUrl = new URL(window.location.href);

                const mapOptions = {
                    center: {
                      lat: 42.4117322,
                      lng: -85.4871588
                    },
                    zoom: 4,
                    gestureHandling:"auto",
                    fullscreenControl: false,
                    disableDoubleClickZoom: true,
                    disableDefaultUI: false,
                    keyboardShortcuts: false,
                    scrollwheel: true,
                    streetViewControl: false
                  };
                  this.waypoints = [];
                this.map = new google.maps.Map(document.getElementById("map"), mapOptions);
                Promise.all([self.fetchApDevices()]).then(
                    (results) => {
                        let devices = results[0];
                        devices.sort(this.sortDeviceByFrequency);
                        self.bindDevices(devices);
                        //let $element = $(self.element);
                        
                    }
                )
            });
        }

        init(){
            self = this;
            return new Promise((resolve, reject) => {
                try{
                    const googleLoader = new google.maps.plugins.loader.Loader({
                        apiKey: $.uisptools.common.settings.system.googleApiKey,
                        version: "weekly",
                        libraries: []
                    });
                    googleLoader.loadCallback((ex) => {
                        if (ex) {
                            $.logToConsole("ERROR google loader: " + ex.toString()); 
                        } else {
                          // new google.maps.Map(document.getElementById("map"), mapOptions);
                        }
                      });
                    Promise.all([googleLoader.load(),this.loadTemplate()]).then(
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
                }catch(ex){
                    $.logToConsole("ERROR loadWidget: " + ex.toString());
                    reject(ex);
                }
            })
        }
       
    }
    
    export {freqmapper}
    export default freqmapper
