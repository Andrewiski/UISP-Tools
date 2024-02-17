        var baseClientSide = {
        
        /** The widgetFactory class for the UISPTools framework
        @name widgetFactory
        @class This is the widgetFactory class for the UISPTools UIframework
        */
        widgetFactory: class widgetFactory{
            /**
             * @param {string} namespace The namespace.
             * @param {string} widgetFactoryJSPath The path to the widgetFactory javascript file.
             * @return {widgetFactory} x the new widgetFactory.
             */
            constructor(namespace, widgetFactoryJSPath) {
                this.namespace = namespace;
                this.widgetFactoryJSPath = widgetFactoryJSPath;
            }
            init(){
                //this is where if we needed to excute some one time code would go only called first time widgetFactory is created
                $.logToConsole("INFO: widgetfactory " + this.namespace + " " + this.widgetFactoryJSPath + " init"); 
                return new Promise((resolve, reject) => {
                    resolve();
                });
                                  
            }
            //This gets called once per widget created
            createWidget(widgetName, element, options){
                //just a place holder as logic to create the widget would be emplemented by class extending it 
                return new Promise((resolve, reject) => {
                    let widget = null;
                    widget = new widget(this, widgetName, element,options);
                    resolve(widget);
                });
            }

            getWidgetFactoryFolder(){
                var widgetFactoryFolder = this.widgetFactoryJSPath.substring(0, this.widgetFactoryJSPath.lastIndexOf("/"));
                return widgetFactoryFolder;
            }

            getBaseUrlPath(){
                return '/' + this.scriptSettings.urlPrefix;
            }
        },

        /** The widget class for the UISPTools framework
        @name widget
        @class This is the widget class for the UISPTools framework
        */
        widget: class widget{
            /**
             * @param {widgetFactory} widgetFactory The widgetFactory class used to create this widget.
             * @param {string} widgetname The widgetname under the name space ie uisptools.detectdfs.widgets.detectdfs would be detectdfs.
             * @param {Element} element The dom element the widget is attached to.
             * @param {object} options The the widget options.
             * @return {widget} the widget.
             */
            constructor(widgetFactory, widgetname, element, options) {
                this.widgetFactory = widgetFactory;
                this.widgetname = widgetname;
                this.element = element;
                this.options = options;
            }
            init(){
                //this is called to start the widget in motion
                $.logToConsole("INFO: widget " + this.widgetFactory.namespace + " " + this.widgetname + " init");  
                return new Promise((resolve, reject) => {
                    $.uisptools.ajax("scriptsettings.json").then(
                        function(scriptSettings){
                            this.scriptSettings = scriptSettings;
                            resolve();
                        },
                        function(err){
                            reject(err);
                        }
                    );
                    
                });                 
            }

            getPluginUserData(options){
                    if(options && options.pluginId) {
                        return $.uisptools.ajax("/" + this.uispToolsApiRequestHandler.options.urlPrefix + "/api/pluginUserData/" + options.pluginId);
                    }else{
                        return $.uisptools.ajax("/" + this.uispToolsApiRequestHandler.options.urlPrefix + "/api/pluginUserData/" + this.widgetFactory.namespace + "." + this.widgetname);
                    }                
            }
            
        }

        

    }

    export {baseClientSide}
    export default baseClientSide