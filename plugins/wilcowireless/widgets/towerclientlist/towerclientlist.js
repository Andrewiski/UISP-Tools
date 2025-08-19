    "use strict"
    import baseClientSide from "../../../baseClientSide.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2022 Wilco Wireless
    * Date: 2022-10-09
    */

    /** 
    @name wilcowireless.widget.towerclientlist
    @class This is the detectdfs widget class for the UISPTools widget framework
    @description We make a call to nms.devices/ap then for each device call the /devices/{id}/configuration /devices/airos/{id}/configuration and compare frequency to detect if device has changed channel due to dfs
    */

    class towerclientlist extends baseClientSide.widget
     {
        
        self = null;
        
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/towerclientlist/towerclientlist.htm";
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
                    var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during wilcowireless.loadWidget.");
                    reject(objError);
                }
            });
        }

        

        updateClientStatus($clientItem, status){

            if(status === "ok" || status === "active"){
                $clientItem.find(".clientStatus .clientStatusOk").show();
            }else{
                $clientItem.find(".clientStatus .clientStatusOk").hide();
            }
            if(status === "refresh"){
                $clientItem.find(".clientStatus .clientStatusRefresh").show();
            }else{
                $clientItem.find(".clientStatus .clientStatusRefresh").hide();
            }

            if(status === "warning"){
                $clientItem.find(".clientStatus .clientStatusWarning").show();
            }else{
                $clientItem.find(".clientStatus .clientStatusWarning").hide();
            }
            if(status === "error" || status==="offline"){
                $clientItem.find(".clientStatus .clientStatusError").show();
            }else{
                $clientItem.find(".clientStatus .clientStatusError").hide();
            }   
        }

        bindSites(sites){
            let $element = $(this.element);
            let $siteList = $element.find("#siteList").empty();
            sites.sort(this.compareName);
            for(var i = 0; i < sites.length; i++){
                let site = sites[i];
                let $siteItem = $("<option></option>").text(site.name).val(site.id);
                $siteList.append($siteItem);
            }
        }

        fetchSiteClients(options){
            return new Promise((resolve, reject) => {
                let url = this.getBaseUrlPath() + "/wilcowireless/api/sites/" + options.siteId + "/clients";
                if(options.deviceId && options.deviceId.length > 0){
                    url = this.getBaseUrlPath() + "/wilcowireless/api/datalinks/device/" + options.deviceId    
                }
                if(options.ipFilter && options.ipFilter.length > 0){
                    url += "?ipfilter=" + encodeURIComponent(options.ipFilter);
                }
                $.uisptools.ajax(url).then(
                    (results) => {resolve(results)},
                    (err)  => {reject(err)}
                );
            });
        }

        fetchSiteDevices(options){
            return new Promise((resolve, reject) => {
                $.uisptools.ajax(this.getBaseUrlPath() + "/wilcowireless/api/sites/" + options.siteId + "/devices").then(
                    (results) => {resolve(results)},
                    (err)  => {reject(err)}
                );
            });
        }

        fetchSites(){
            return new Promise((resolve, reject) => {
                $.uisptools.ajax(this.getBaseUrlPath() + "/wilcowireless/api/sites").then(
                    (results) => {resolve(results)},
                    (err)  => {reject(err)}                       
                );
            })
            
        }
        
        sortClientByActiveFrom(a,b){
            let aDate;
            if(a && a.ucrm && a.ucrm.service && a.ucrm.service.activeFrom){
                aDate = new Date(a.ucrm.service.activeFrom);
            }else{
                return -1;
            }
            
            let bDate;
            if(b && b.ucrm && b.ucrm.service && b.ucrm.service.activeFrom){
                bDate = new Date(b.ucrm.service.activeFrom);
            }else{
                return 1;
            }

            if (aDate < bDate) {
                return -1;
              }
              if (aDate > bDate) {
                return 1;
              }
              // a must be equal to b
              return 0;
        }

        bindClients(clients){
            clients.sort(self.sortClientByActiveFrom);
            let $element = $(self.element);
            let $clientList = $element.find(".clientList").empty();
            let $clientItemTemplate = $element.find(".templates").find(".clientListTemplate").find(".clientListItem");
            for(var i = 0; i < clients.length; i++){
                let client = clients[i];
                let $clientItem = $clientItemTemplate.clone();
                $clientList.append($clientItem);
                //self.fetchSiteDetails(clientId).then(
                //    function(client){
                        //$deviceItem.addClass("table-success"); 
                        $clientItem.attr("data-clientId", client.id);
                        $clientItem.find(".clientName").text(client.name);
                        $clientItem.find(".clientSite").text(client.siteName);
                        $clientItem.find(".clientAddress").text(client.address);
                        $clientItem.find(".clientPhone").text(client.phone);
                        $clientItem.find(".clientEmail").text(client.email);
                        $clientItem.find(".clientIpAddress").text(client.ipaddress);
                        if(client.activeFrom){
                            $clientItem.find(".clientActiveFrom").text(new Intl.DateTimeFormat("en-US").format(Date.parse(client.activeFrom)));
                        }
                        $clientItem.find(".clientStatus").text(client.status);
                        
                        
                        
                        if(client.status === "active"){
                            self.updateClientStatus($clientItem, "ok");
                            $clientItem.removeClass("table-danger");
                        }else{
                            if(client.identification && client.identification.status){
                                self.updateClientStatus($clientItem, "offline");
                            }
                            $clientItem.addClass("table-danger");
                        }
                  //  },
                    //function(err){
                    //    $clientItem.addClass("table-danger");
                   // }
                //)    
            }   
        }

        onSiteChange(evt){
            let $element = $(this.element);
            let siteId = $element.find("#siteList").val();
            this.fetchSiteDevices({siteId:siteId}).then(
                (devices) => {
                    this.bindSiteDevices(devices);
                }
            )
        }

        ///uisptools/api/pluginUserData/wilcowireless.widgets.towerclientlist
        onFetchClientsClick(evt)  {
            let $element = $(this.element);
            // let siteIds = $element.find("#siteList").val();
            // if(!siteIds || siteIds.length === 0){
            //     $.uisptools.notify({body: "Please select a site", type: "danger"});
            //     return;
            // }
            // let dataFetches = [];
            // siteIds.forEach(siteId => {
            //     dataFetches.push(this.fetchSiteClients({siteId: siteId}));
            // });
            let siteId = $element.find("#siteList").val();
            let deviceId = $element.find("#siteDeviceList").val();
            let ipFilter = $element.find("#ipFilter").val();
            let btnSpinner = $element.find("#btnFetchClients").find(".spinner");
            btnSpinner.show();
            this.fetchSiteClients({siteId: siteId, deviceId: deviceId, ipFilter: ipFilter}).then(
                function(results){
                    btnSpinner.hide();
                    var clients = []
                    results.forEach(siteClients => {
                        clients = clients.concat(siteClients);
                    });
                    self.bindClients(clients);
                    //let $element = $(self.element);
                    
                },
                function(err){
                    btnSpinner.hide();
                    $.uisptools.notify({body: "Error fetching clients: " + err.msg, type: "danger"});
                }
            )
        }

        compareName(a, b) {
            if (a.name < b.name) {
              return -1;
            } else if (a.name < b.name) {
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
            sites.sort(this.compareName);
            for(var i = 0; i < sites.length; i++){
                let site = sites[i];
                let $siteItem = $("<option></option>").text(site.name).val(site.id);
                $siteList.append($siteItem);
            }
        }

        bindSiteDevices(siteDevices){
            let $element = $(this.element);
            let $siteDeviceList = $element.find("#siteDeviceList").empty();
            let $siteDeviceItem = $("<option></option>").text("All Devices").val("");
            $siteDeviceList.append($siteDeviceItem);
            siteDevices.sort(this.compareName);
            for(var i = 0; i < siteDevices.length; i++){
                let device = siteDevices[i];
                let $siteDeviceItem = $("<option></option>").text(device.name).val(device.id);
                $siteDeviceList.append($siteDeviceItem);
            }
        }

        bind(){
            return new Promise((resolve, reject) => {
                //const parsedUrl = new URL(window.location.href);
                //const siteId = parsedUrl.searchParams.get("siteid");
               Promise.all([this.fetchSites()]).then(
                    (results) =>{
                        let sites = results[0];
                        this.bindSites(sites); 
                        $("#siteList").on("change", (evt) => {
                            this.onSiteChange(evt);
                        });
                       $("#btnFetchClients").on("click", (evt) => {
                            this.onFetchClientsClick(evt);
                        });

                         
                       
                        resolve();
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
    
    export {towerclientlist}
    export default towerclientlist
