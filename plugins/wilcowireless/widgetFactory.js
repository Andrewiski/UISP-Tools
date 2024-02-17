"use strict"


import baseClientSide from "../baseClientSide.js";
import {towerclients} from "./widgets/towerclients/towerclients.js"
import {freqmapper} from "./widgets/freqmapper/freqmapper.js"

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
                $.logToConsole("INFO: wilcowireless widget factory init");
            });
        }
        //This gets called once per widget created
        createWidget(widgetName, element, options){
            return new Promise((resolve, reject) => {
                let widget = null;
                switch(widgetName){
                    case "towerclients":
                        //constructor(widgetFactory, widgetname, element, options) 
                        widget = new towerclients(this, widgetName, element,options);
                        resolve(widget);
                        break;
                    case "freqmapper":
                        widget = new freqmapper(this, widgetName, element,options);
                        resolve(widget);
                        break;
                }
            });
        }
    }


    export {widgetFactory}
    export {towerclients}
    export default widgetFactory