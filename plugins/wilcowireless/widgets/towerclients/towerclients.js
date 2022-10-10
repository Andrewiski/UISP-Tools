    "use strict"
    import baseClientSide from "/plugins/baseClientSide.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2022 Wilco Wireless
    * Date: 2022-10-09
    */

    /** 
    @name wilcowireless.widget.towerclients
    @class This is the detectdfs widget class for the UISPTools widget framework
    @description We make a call to nms.devices/ap then for each device call the /devices/{id}/configuration /devices/airos/{id}/configuration and compare frequency to detect if device has changed channel due to dfs
    */

    class towerclients extends baseClientSide.widget
     {
        
        self = null;
        
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/towerclients/towerclients.htm";
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

        fetchSiteClients(siteId){
            return $.uisptools.ajax("/uisptools/api/nms/sites/" + siteId + "/clients");
        }
        
        fetchSiteDetails(siteId){
            return $.uisptools.ajax("/uisptools/api/nms/sites/" + siteId);
        }

        fetchSiteClientsWithDetails(siteId){
            return new Promise((resolve, reject) => {
                try{
                    
                    var clientDetailPromise = [];
                    self.fetchSiteClients(siteId).then(
                        function(clientIds){
                            for(var i = 0; i < clientIds.length; i++){
                                let clientId = clientIds[i];
                                clientDetailPromise.push(self.fetchSiteDetails(clientId))
                            }
                            Promise.all(clientDetailPromise).then(
                                function(clients){
                                    resolve(clients)
                                },
                                function(err){
                                    var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during wilcowireless.towerclients.fetchSiteClientsWithDetailes.");
                                    reject(objError);        
                                }
                            )
                        },
                        function(err){
                            var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during wilcowireless.towerclients.fetchSiteClientsWithDetailes.");
                            reject(objError);        
                        }
                    )
                }catch(ex){
                    $.logToConsole("ERROR wilcowireless.towerclients.fetchSiteClientsWithDetailes: " + ex.toString());
                    var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during wilcowireless.loadWidget.");
                    reject(objError);
                }
            })
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
        
        sortClientByActiveFrom(a,b){
            let aDate = new Date(a.ucrm.service.activeFrom);
            let bDate =new Date(b.ucrm.service.activeFrom)
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
                        $clientItem.find(".clientName").text(client.identification.name);
                        $clientItem.find(".clientActiveFrom").text(moment(client.ucrm.service.activeFrom).format("MM/DD/YYYY"));
                        if(client.identification && client.identification.status === "active"){
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

        bind(){
            return new Promise((resolve, reject) => {
                const parsedUrl = new URL(window.location.href);
                const siteId = parsedUrl.searchParams.get("siteid");
                Promise.all([self.fetchSiteClientsWithDetails(siteId)]).then(
                    function(results){
                        let clients = results[0];
                        self.bindClients(clients);
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
    
    export {towerclients}
    export default towerclients
