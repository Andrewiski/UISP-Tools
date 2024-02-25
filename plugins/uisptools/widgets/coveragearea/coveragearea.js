    "use strict"
    import baseClientSide from "../../../baseClientSide.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2023 Digital Example
    * Date: 2024-2-21
    */

    /** 
    @name uisptools.widget.coveragearea
    @class This is the coveragearea widget class for the UISPTools widget framework
    @description We make a call to nms.sites then for each site draw a coverage circle on a google map
    */

    class freqmapper extends baseClientSide.widget
     {
        
        self = null;
        
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/coveragearea/coveragearea.htm";
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
                    reject(ex);
                }
            });
        }

        


        bindTowerSites(towerSites){
            let map = this.map;
            let $element = $(self.element);
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
                Promise.all([self.getPluginData({pluginName: 'uisptools.coveragearea' })]).then(
                    (results) => {
                        if(results){
                            let towerSites = results[0];
                            self.bindTowerSites(towerSites);
                        }
                        resolve();
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
