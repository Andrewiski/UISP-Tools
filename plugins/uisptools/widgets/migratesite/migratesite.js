    "use strict"
    import baseClientSide from "../../../baseClientSide.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2022 Digital Example
    * Date: 2022-09-15
    */

    /** 
    @name uisptools.widget.migratesite
    @class This is the detectdfs widget class for the UISPTools widget framework
    @description We make a call to nms.devices/ap then for each device call the /devices/{id}/configuration /devices/airos/{id}/configuration and compare frequency to detect if device has changed channel due to dfs
    */
    class migratesite extends baseClientSide.widget
     {
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/migratesite/migratesite.htm";
                    $.uisptools.ajax({
                        method: 'GET',
                        url:  url,
                        dataType: 'html'
                    }).then(
                        (widgetHtml)  => {
                            $element.html(widgetHtml);
                            resolve();
                        },
                         (err)  => {
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

        fetchSites(){
            return new Promise((resolve, reject) => {
                $.uisptools.ajax(this.getBaseUrlPath() + "/uisptools/api/nms/sites").then(
                    (results) => {resolve(results)},
                    (err)  => {reject(err)}                       
                );
            })
            
        }

        fetchSiteDevices(options){
            return new Promise((resolve, reject) => {
                $.uisptools.ajax(this.getBaseUrlPath() + "/uisptools/api/nms/devices?siteId=" + options.siteId).then(
                    (results) => {resolve(results)},
                    (err)  => {reject(err)}                       
                );
            })
            
        }
        
        compareSiteName(a, b) {
            if (a.identification.name < b.identification.name) {
              return -1;
            } else if (a.identification.name < b.identification.name) {
              return 1;
            }
            // a must be equal to b
            return 0;
        }
        bindSites(sites){
            let $element = $(this.element);
            let $siteList = $element.find("#siteList").empty();
            let $siteItem = $("<option></option>").text("Select Site").val("");
            $siteList.append($siteItem);
            sites.sort(this.compareSiteName);
            for(var i = 0; i < sites.length; i++){
                let site = sites[i];
                let $siteItem = $("<option></option>").text(site.identification.name).val(site.id);
                $siteList.append($siteItem);
            }
        }

        onMigrateClick(evt){
            let $element = $(this.element);
            let unmsKey = $element.find("#unmsKey").val();
            let devices = $element.find(".deviceList").find("input[name='deviceSelected']:checked").map(function() {
                return $(this).val();
            }).get();
            let data = {unmsKey:unmsKey, deviceIds:devices};
            if(devices.length === 0){
                $.uisptools.notify({body: "No devices selected", type: "danger"});
            }else{
                $.uisptools.ajax({
                    method: 'POST',
                    url:  this.getBaseUrlPath() + "/uisptools/api/nms/devices/system/unms/key",
                    data: JSON.stringify(data),
                    contentType: "application/json"
                }).then(
                    (results) => {
                        
                        $.uisptools.notify({body: "Site migration initiated", type: "success"});
                    },
                    (err)  => {
                        $.uisptools.notify({body: "Site migration failed", type: "danger"});
                    }
                );
            }
        }

        bindDevices(devices){
            
            let $element = $(this.element);
            let $deviceList = $element.find(".deviceList").empty();
            let $deviceItemTemplate = $element.find(".templates").find(".deviceListTemplate").find(".deviceListItem");
            for(var i = 0; i < devices.length; i++){
                let device = devices[i]; 
                if(device.overview && device.overview.status === "active" && device.identification.type!== "blackBox" ){
                       
                    let $deviceItem = $deviceItemTemplate.clone();
                    this.updateDeviceItem({device:device, $deviceItem: $deviceItem});
                    $deviceList.append($deviceItem);
                
                    $deviceItem.removeClass("table-danger");
                }  
            } 
        }

        updateDeviceItem(options){
            let device = options.device;
            let $deviceItem = options.$deviceItem;
            $deviceItem.attr("data-deviceId", device.identification.id);
            $deviceItem.find("input[name='deviceSelected']").val(device.identification.id);
            $deviceItem.find(".deviceName").text(device.identification.name);
            $deviceItem.find(".deviceModel").text(device.identification.model);
            $deviceItem.find(".deviceIpAddress").text(device.ipAddress);
            $deviceItem.find(".deviceType").text(device.identification.type);
            if(device.attributes && device.attributes.ssid){
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
                //this.updateDeviceStatus($deviceItem, "ok");
                $deviceItem.removeClass("table-danger");
            }else{
                if(device.overview && device.overview.status){
                    
                    //this.updateDeviceStatus($deviceItem, "offline");
                    
                }
                $deviceItem.addClass("table-danger");
            }

        }

        onSiteChange(evt){
            let $element = $(this.element);
            let siteId = $element.find("#siteList").val();
            this.fetchSiteDevices({siteId:siteId}).then(
                (devices) => {
                    this.bindDevices(devices);
                }
            )
        }
        onSelectAllDevicesChange(evt){
            if(evt.target.checked){
                $(this.element).find(".deviceList").find("input[name='deviceSelected']").prop("checked", true);
            }
        }
        bind(){
            return new Promise((resolve, reject) => {
                Promise.all([this.fetchSites()]).then(
                    (results) =>{
                        let sites = results[0];
                        this.bindSites(sites); 
                        $("#siteList").on("change", (evt) => {
                            this.onSiteChange(evt);
                        });
                        $("#selectAllDevices").on("change", (evt) => {
                            this.onSelectAllDevicesChange(evt);
                        });
                        $("#btnMigrateSite").on("click", (evt) => {
                            this.onMigrateClick(evt);
                        });
                        resolve();
                    }
                )
            });
        }

        init(){
            
            return new Promise((resolve, reject) => {
                
                this.loadTemplate().then(
                    () => {
                        
                        this.bind().then(
                            () => {
                                resolve();
                            },
                            (err) => {
                                reject(err)
                            }

                        );
                    },
                    (err) =>{
                        reject(err)
                    } 
                )
            })
        }
       
    }
    
    export {migratesite}
    export default migratesite

   
