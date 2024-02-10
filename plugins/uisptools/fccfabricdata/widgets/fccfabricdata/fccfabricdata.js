    "use strict"
    import baseClientSide from "/uisptools/plugins/baseClientSide.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2022 Digital Example
    * Date: 2022-09-15
    */

    /** 
    @name uisptools.fccfabricdata.widget.fccfabricdata
    @class This is the fccfabricdata widget class for the UISPTools widget framework
    @description We make a call to nms.devices/ap then for each device call the /devices/{id}/configuration /devices/airos/{id}/configuration and compare frequency to detect if device has changed channel due to dfs
    */

    

    class fccfabricdata extends baseClientSide.widget
     {
        
        self = null;
        
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/fccfabricdata/fccfabricdata.htm";
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

        fetchCrmServicePlans(){
            return $.uisptools.ajax("/uisptools/api/crm/service-plans");
        }
        fetchCrmServices(options){
            return $.uisptools.ajax("/uisptools/api/crm/clients/services");
        }

        bindServicePlans(servicePlans){
            let $element = $(self.element);
            let $servicePlanList = $element.find(".servicePlanList").empty();
            let $servicePlanItemTemplate = $element.find(".templates").find(".servicePlanListTemplate").find(".servicePlanListItem");
            for(var i = 0; i < servicePlans.length; i++){
                let servicePlan = servicePlans[i];
                let $servicePlanItem = $servicePlanItemTemplate.clone();
                $servicePlanItem.attr("data-servicePlanId", servicePlan.id);
                $servicePlanItem.find(".servicePlanName").text(servicePlan.name);
                $servicePlanItem.find(".servicePlanType").text(servicePlan.servicePlanType);
                $servicePlanItem.find(".downloadSpeed").text(servicePlan.downloadSpeed);
                $servicePlanItem.find(".uploadSpeed").text(servicePlan.uploadSpeed);
                $servicePlanItem.find(".clientCount").text(servicePlan.clientCount);
                
                $servicePlanList.append($servicePlanItem);
            }
        }

        bindCensusTracks(censusTracks){
            let $element = $(self.element);
            let $censusTrackList = $element.find(".censusTrackList").empty();
            let $censusTrackItemTemplate = $element.find(".templates").find(".censusTrackListTemplate").find(".censusTrackListItem");
            for(var i = 0; i < censusTracks.length; i++){
                let censusTrack = censusTracks[i];
                let $censusTrackItem = $censusTrackItemTemplate.clone();
                $censusTrackItem.attr("data-servicePlanId", censusTrack.id);
                $censusTrackItem.find(".censusTrackName").text(servicePlan.name);
                $censusTrackItem.find(".servicePlanType").text(servicePlan.servicePlanType);
                $censusTrackItem.find(".downloadSpeed").text(servicePlan.downloadSpeed);
                $censusTrackItem.find(".uploadSpeed").text(servicePlan.uploadSpeed);
                $censusTrackItem.find(".clientCount").text(servicePlan.clientCount);
                
                $servicePlanList.append($servicePlanItem);
            }
        }

        bind(){
            return new Promise((resolve, reject) => {
                Promise.all([self.fetchCrmServicePlans(), self.fetchCrmServices()]).then(
                    function(results){
                        let servicePlans = results[0];
                        let services = results[1];
                        self.data = {
                            servicePlanList: servicePlans,
                            serviceList: services,
                            servicePlans: {}, 
                            services: {},
                            censusTracks: {}
                            
                        }

                        for(var i = 0; i < servicePlans.length; i++){
                            let servicePlan = servicePlans[i];
                            servicePlan.clientCount = 0;
                            servicePlan.clients = [];
                            self.data.servicePlans[servicePlan.id] = servicePlan;
                        }

                        for(var i = 0; i < services.length; i++){
                            let service = services[i];
                            self.data.services[service.id] = service;
                            let servicePlan = self.data.servicePlans[service.servicePlanId];
                            servicePlan.clients.push(service);
                            servicePlan.clientCount = servicePlan.clientCount + 1;

                            let censusTrackId = null;
                            if(service.fccBlockId !== undefined &&  service.fccBlockId !== null && service.fccBlockId.length > 11 ){
                                censusTrackId = service.fccBlockId.substring(0, 11);
                            }else{
                                censusTrackId = "invalid";
                            }
                            if(self.data.censusTracks[censusTrackId] === undefined){
                                self.data.censusTracks[censusTrackId] = {
                                    censusTrackId:censusTrackId,
                                    count: 0,
                                    services: {}
                                    
                                };
                            }
                            let censusTrack = self.data.censusTracks[censusTrackId];
                            censusTrack.count = censusTrack.count + 1;
                            censusTrack.services[service.id] = service;
                        }
                        self.bindServicePlans(servicePlans);
                        
                        
                        self.bindCensusTracks(self.data.censusTracks);
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
    
    export {fccfabricdata}
    export default fccfabricdata

   
