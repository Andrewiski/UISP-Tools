"use strict"
import baseClientSide from "../baseClientSide.js";
import {twiliocallflow} from "./widgets/twiliocallflow/twiliocallflow.js"
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
                $.logToConsole("INFO: uisptoolstwilio widget factory init");
            });
        }
        //This gets called once per widget created
        createWidget(widgetName, element, options){
            return new Promise((resolve, reject) => {
                let widget = null;
                switch(widgetName){
                    case "twiliocallflow":
                        //constructor(widgetFactory, widgetname, element, options) 
                        widget = new twiliocallflow(this, widgetName, element,options);
                        resolve(widget);
                        break;
                    }
                }
            );
        }
    }

    export {widgetFactory}
    export {twiliocallflow}
    export default widgetFactory