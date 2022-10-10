    import { Server as SocketIoServer } from "socket.io";
    var baseServerSide = {
        
        

        /** The plugin class for the UISPTools framework
        @name plugin
        @class This is the widgetFactory class for the UISPTools UIframework
        */
        plugin: class plugin{
            /**
             * @param {string} namespace The namespace.
             * @param {string} pluginJSPath The plugin JS File Path.
             * @param {object} config The app Configfile.
             * @param {any} logUtilHelper The common logUtilHelper.
             * @param {any} uispToolsApiRequestHandler The uispToolsApiRequestHandler object.
             * @param {SocketIoServer} socketIoServer The uispToolsApiRequestHandler object. 
             * @return {plugin} plugin
             */
            constructor(namespace, pluginJSPath, config, logUtilHelper, uispToolsApiRequestHandler, socketIoServer) {
                //return new Promise((resolve, reject) => {
                    this.namespace = namespace;
                    this.pluginJSPath = pluginJSPath;
                    this.config = config;
                    this.logUtilHelper = logUtilHelper;
                    this.uispToolsApiRequestHandler = uispToolsApiRequestHandler;
                    this.socketIoServer = socketIoServer;
                    //this.debug = null;
                    //resolve();
                //});

            }
            
            init(){
                //this is where if we needed to excute some one time code would go only called first time widgetFactory is created
                //this.debug("info", "plugin init", this.namespace, this.pluginJSPath); 
                return new Promise((resolve, reject) => {
                    
                    if (this.logUtilHelper){
                        this.debug = function(loglevel){
                            let args = []
                            for (let i = 0; i < arguments.length; i++) {
                                if (arguments[i] === undefined) {
                                    args.push("undefined")
                                } else if (arguments[i] === null) {
                                    args.push("null")
                                }
                                else {
                                    args.push(JSON.parse(JSON.stringify(arguments[i])))
                                }
                            }
                            if (args.length > 1) {
                                args.shift(); //remove the loglevel from the array
                            }
                            this.logUtilHelper.log(this.namespace, "app", loglevel, args);
                        }
                    }else{
                        this.debug = require('debug')(this.namespace);
                    }
                    resolve();
                });
                                  
            }
            

            getPluginFolder(){
                var pluginFolder = this.pluginJSPath.substring(0, this.pluginJSPath.lastIndexOf("/"));
                return pluginFolder;
            }

            /**
             * 
             * @param {express.Router} router 
             */
            bindRoutes(router){
                this.logUtilHelper.log(this.namespace,"info", "app", "plugin " + this.namespace + " " + this.pluginJSPath + " bind Routes"); 
            }

            checkApiAccess (req, res, next){
                this.uispToolsApiRequestHandler.checkApiAccess (req, res, next)
            }
        },

    }

    export {baseServerSide}
    export default baseServerSide