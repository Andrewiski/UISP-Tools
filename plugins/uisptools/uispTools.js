        var uisptools = {
        
        /** The widgetFactory class for the UISPTools framework
        @name widgetFactory
        @class This is the widgetFactory class for the UISPTools UIframework
        */
        widgetFactory: class widgetFactory{
            /**
             * @param {number} x The number to raise.
             * @param {number} n The power, must be a natural number.
             * @return {number} x raised to the n-th power.
             */
            constructor(widgetNamespace, widgetFactoryJSPath) {
                this.widgetNamespace = widgetNamespace;
                this.widgetFactoryJSPath = widgetFactoryJSPath;
            }
            init(){
                //this is where if we needed to excute some one time code would go only called first time widgetFactory is created
                $.logToConsole("INFO: widgetfactory " + this.widgetNamespace + " " + this.widgetFactoryJSPath + " init"); 
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
                $.logToConsole("INFO: widget " + this.widgetFactory.widgetNamespace + " " + this.widgetname + " init");  
                return new Promise((resolve, reject) => {
                    resolve();
                });                 
            }
            
        }
    }

    export {uisptools}
    export default uisptools