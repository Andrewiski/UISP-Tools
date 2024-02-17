"use strict"


import baseClientSide from "../baseClientSide.js";
import {detectdfs} from "./widgets/detectdfs/detectdfs.js"
import {testapicalls} from "./widgets/testapicalls/testapicalls.js"
import {fccfabricdata} from "./widgets/fccfabricdata/fccfabricdata.js"
import {contenteditor} from "./widgets/contenteditor/contenteditor.js"
class widgetFactory extends baseClientSide.widgetFactory
    {
        init(){
            return new Promise((resolve, reject) => {
                //this is where if I needed to excute some one time code would go
                super.init().then(
                    function(){
                        resolve();
                    },
                    function(err){
                        reject(err);
                    }
                )
                $.logToConsole("INFO: uisptools widget factory init");
            });
        }
        //This gets called once per widget created
        createWidget(widgetName, element, options){
            return new Promise((resolve, reject) => {
                let widget = null;
                switch(widgetName){
                    case "detectdfs":
                        //constructor(widgetFactory, widgetname, element, options) 
                        widget = new detectdfs(this, widgetName, element,options);
                        resolve(widget);
                        break;
                    case "fccfabricdata":
                        //constructor(widgetFactory, widgetname, element, options) 
                        widget = new fccfabricdata(this, widgetName, element,options);
                        resolve(widget);
                        break;
                    case "contenteditor":
                        //constructor(widgetFactory, widgetname, element, options) 
                        widget = new contenteditor(this, widgetName, element,options);
                        resolve(widget);
                        break;
                    case "testapicalls":
                        //constructor(widgetFactory, widgetname, element, options) 
                        widget = new testapicalls(this, widgetName, element,options);
                        resolve(widget);
                        break;
                    }
                }
            );
        }
    }





    export {widgetFactory}
    export {detectdfs}
    export {fccfabricdata}
    export {testapicalls}
    export {contenteditor}
    export default widgetFactory