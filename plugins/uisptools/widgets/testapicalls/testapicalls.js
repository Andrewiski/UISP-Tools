"use strict"
    import baseClientSide from "../../../baseClientSide.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2022 Digital Example
    * Date: 2022-09-15
    */

    /** 
    @name uisptools.widget.testapicall
    @class This is the testapicalls widget class for the UISPTools widget framework
    @description We make a call to nms.devices/ap then for each device call the /devices/{id}/configuration /devices/airos/{id}/configuration and compare frequency to detect if device has changed channel due to dfs
    */

    

    class testapicalls extends baseClientSide.widget
     {
        
        self = null;    
    
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/testapicalls/testapicalls.htm";
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

        //This gets called once per widget created
        bind(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(self.element)
                    $.logToConsole("INFO: " + this.name + " create");
                    $element.find(".btnSubmit").on("click", 
                        function(){
                            $element.find("#uisptools_API_results").text("");
                            let apiPath = $element.find("#uisptools_API_Path").val();
                            $.uisptools.ajax(apiPath).then(
                                function(results){
                                    $element.find("#uisptools_API_results").text(JSON.stringify(results, null, 2))
                                },
                                function(err){
                                    $.logToConsole("ERROR: uisptools.testing.testapicall");
                                    $.uisptools.displayError(err);
                                }
                            )
                        }
                    );

                    $element.find("#uisptools_API_Path_Select").on("change",
                        function(evt){
                            $element.find("#uisptools_API_Path").val($element.find("#uisptools_API_Path_Select").val());
                        }
                    )
                    resolve();
                }catch(ex){
                    reject(ex);
                }
            })
        }

        
        init(){
            self = this;
            return new Promise((resolve, reject) => {
                self.loadTemplate().then(
                    () =>
                    {
                        self.bind().then(() =>
                            {
                                resolve();
                            }
                        ).catch((err)=>{
                            reject(err)
                        });
                    } 
                ).catch((err)=>{
                        reject(err)
                })
            })
        }
       
    }
    
    export {testapicalls}
    export default testapicalls
    
 
    