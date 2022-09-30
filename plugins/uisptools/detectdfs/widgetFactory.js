"use strict"

import uisptools from "/plugins/uisptools/uispTools.js";
import {detectdfs} from "./widgets/detectdfs/detectdfs.js"

class widgetFactory extends uisptools.widgetFactory
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
                $.logToConsole("INFO: detectDFS widget factory " + this.name + " init");
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
                }
            });
        }
    }





    export {widgetFactory}
    export {detectdfs}
    export default widgetFactory