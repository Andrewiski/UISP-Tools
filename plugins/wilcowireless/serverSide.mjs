"use strict"
import baseServerSide from "../baseServerSide.mjs";
    
var wilcowireless = {
  plugin :  class plugin extends baseServerSide.plugin
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
                    this.debug("trace", "wilcowireless widget factory " + this.name + " init");
                });
                
            }

            bindRoutes(router){
                
                try {
                    super.bindRoutes(router);
                    //Any Routes above this line are not Checked for Auth and are Public
                    router.get('/wilcowireless/*', this.checkApiAccess);
                    router.get('/wilcowireless/towerclients', this.getTowerClients); 
                } catch (ex) {
                   this.debug("error", ex.msg, ex.stack);
                }
            }

            getTowerClients(req, res){
                try{
                    res.json({test:true});
                }catch(ex){
                    this.debug("error", "getTowerClients", ex.msg, ex.stack);
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                }
            }
            
        }
}

export {wilcowireless}
export default wilcowireless