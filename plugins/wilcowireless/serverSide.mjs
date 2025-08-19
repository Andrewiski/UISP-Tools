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
                    router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'wilcowireless/api/*', this.checkApiAccess.bind(this));
                    router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'wilcowireless/api/freqmapper/devices', this.getFreqMapperNMSDevices.bind(this)); 
                    router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'wilcowireless/api/freqmapper/devices/:deviceid', this.getFreqMapperNMSDevices.bind(this));
                    router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'wilcowireless/api/sites/:siteid/clients', this.getSiteClients.bind(this));
                    router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'wilcowireless/api/sites/:siteid/devices', this.getSiteDevices.bind(this));
                    router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'wilcowireless/api/datalinks/device/:deviceid', this.getDeviceDatalinks.bind(this));
                    router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'wilcowireless/api/datalinks/sites/:siteid', this.getSiteDatalinks.bind(this));
                    router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'wilcowireless/api/sites', this.getSites.bind(this));
                } catch (ex) {
                   this.debug("error", ex.msg, ex.stack);
                }
            }

            
            async getFreqMapperNMSDevices(req, res){
                let url =  "devices";
                if(req.params.deviceid){
                    url = url + "/" + req.params.deviceid;
                }
                if(req.query){
                    let queryString = "";
                    for (const [key, value] of Object.entries(req.query)) {
                        if(key === "_"){
        
                        }else{
                            if(queryString ===""){
                                queryString = queryString + "?";
                            }else{
                                queryString = queryString + "&";
                            }
                            queryString = queryString  + key + "=" + encodeURIComponent(value);
                        }
                    }
                    url = url + queryString;
                }
                var options = { 
                    url: url,
                    method: 'GET',
                    accessToken : res.locals.accessToken
                }
                await this.uispToolsApiRequestHandler.nmsApiQuery(options).then(  
                    function(data){
                        res.json(data);
                    },
                    function(err){
                        res.status(500).json({ "msg": "An Error Occured!", "error": err });
                    }
                )
            }

            fetchSites(accessToken){
                let url = "sites?type=site";

                var options = { 
                    url: url,
                    method: 'GET',
                    accessToken : accessToken
                }
                return this.uispToolsApiRequestHandler.nmsApiQuery(options);
            }
            
            fetchSiteDetails(siteId, accessToken){
                let url = "sites/" + siteId;

                var options = { 
                    url: url,
                    method: 'GET',
                    accessToken : accessToken
                }
                return this.uispToolsApiRequestHandler.nmsApiQuery(options);
            }

            fetchSiteClients(siteId, accessToken){
                let url = "sites/" + siteId + "/clients";

                var options = { 
                    url: url,
                    method: 'GET',
                    accessToken : accessToken
                }
                return this.uispToolsApiRequestHandler.nmsApiQuery(options);
            }
            fetchDeviceDatalinks(deviceId, accessToken){
                let url = "data-links/device/" + deviceId;

                var options = { 
                    url: url,
                    method: 'GET',
                    accessToken : accessToken
                }
                return this.uispToolsApiRequestHandler.nmsApiQuery(options);
            }

            fetchSiteDevices(siteId, accessToken, role){
                let url = "devices?siteId=" + siteId ;
                if(role){
                    url = url + "&role=" + role;
                }
                var options = { 
                    url: url,       
                    method: 'GET',
                    accessToken : accessToken
                }
                return this.uispToolsApiRequestHandler.nmsApiQuery(options);
            }

            fetchClientDetails(clientId, accessToken){
                let url = "clients/" + clientId;
                var options = { 
                    url: url,       
                    method: 'GET',
                    accessToken : accessToken
                }
                return this.uispToolsApiRequestHandler.crmApiQuery(options);
            }

           async fetchSiteClientsWithDetails(siteId, accessToken){
                
                try{
                    var self = this;
                    var clientDetailPromise = [];
                    let clientIds = await self.fetchSiteClients(siteId, accessToken);
                    for(var i = 0; i < clientIds.length; i++){
                        let clientId = clientIds[i];
                        clientDetailPromise.push(self.fetchSiteDetails(clientId, accessToken))
                    }
                    let clients = await        Promise.all(clientDetailPromise);
                    
                    return clients;
                }catch(ex){
                    this.debug("error", "wilcowireless.towerclients.fetchSiteClientsWithDetailes: " + ex.toString());
                    throw ex;
                }
               
            }

            

             async getSiteDatalinks(req, res){
                try{
                    let deviceId = req.params.deviceid;
                    if(!deviceId){
                        return res.status(400).json({ "msg": "No Device Specified" });
                    }
                    let self = this;
                    let clients = await self.fetchSiteDatalinks(deviceId, res.locals.accessToken)
                    //Format the devices to include siteId and siteName
                    clients = clients.map(client => {
                        return {
                            id: client.identification.id,
                            name: client.identification.name,
                            siteId: client.identification.site.id,
                            siteName: client.identification.site.name
                        };
                    });
                    res.json(clients);
                }catch(ex){
                    this.debug("error", "getSiteDatalinks", ex.msg, ex.stack);
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                }
            }
            

            async getDeviceDatalinks(req, res){
                try{
                    let deviceId = req.params.deviceid;
                    if(!deviceId){
                        return res.status(400).json({ "msg": "No Device Specified" });
                    }
                    let self = this;
                    let datalinks = await self.fetchDeviceDatalinks(deviceId, res.locals.accessToken)
                    //Format the devices to include siteId and siteName
                    let FormatedDatalinks = datalinks.map(datalink => {
                        return {
                            datalinkId: datalink.id,
                            datalinkName: (datalink?.from?.device?.identification?.displayName? datalink.from.device.identification.displayName : "Unknown Device") + " to " + (datalink?.to?.device?.identification?.displayName? datalink.to.device.identification.displayName : "Unknown Device"),
                            siteId: datalink.to.site.id,
                            siteName: datalink.to.site.name,
                            deviceId: datalink.to.device.identification.id,
                            deviceName: datalink.to.device.identification.name
                        };
                    });
                    res.json(datalink);
                }catch(ex){
                    this.debug("error", "getDeviceClients", ex.msg, ex.stack);
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                }
            }

           async getSiteDevices(req, res){
                try{
                    let siteId = req.params.siteid;
                    if(!siteId){
                        return res.status(400).json({ "msg": "No Site Specified" });
                    }
                    let self = this;
                    let role = req.query.role ? req.query.role : "router";
                    let devices = await self.fetchSiteDevices(siteId, res.locals.accessToken, role);
                    //Format the devices to include siteId and siteName
                    devices = devices.map(device => {
                        return {
                            id: device.identification.id,
                            name: device.identification.name,
                            siteId: device.identification.site.id,
                            siteName: device.identification.site.name
                        };
                    });
                    res.json(devices);
                }catch(ex){
                    this.debug("error", "getSiteDevices", ex.msg, ex.stack);
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                }
            }

            // async getSiteClients(req, res){
            //     try{
            //         let siteId = req.params.siteid;
            //         if(!siteId){
            //             return res.status(400).json({ "msg": "No Site Specified" });
            //         }
            //         let self = this;
            //         let devices = await self.fetchSiteDevices(siteId,res.locals.accessToken);
            //         res.json(devices);
            //     }catch(ex){
            //         this.debug("error", "getSiteDevices", ex.msg, ex.stack);
            //         res.status(500).json({ "msg": "An Error Occured!", "error": ex });
            //     }
            // }

            ipToInt(ip) {
                const parts = ip.split('.');
                return (parseInt(parts[0]) << 24) |
                    (parseInt(parts[1]) << 16) |
                    (parseInt(parts[2]) << 8) |
                    parseInt(parts[3]);
            }
            getSubnetMask(cidr) {
                return (-1 >>> 0) << (32 - cidr);
            }

            isInSubnet(ip, subnetCidr) {
                const [subnetIp, cidr] = subnetCidr.split('/');
                const ipInt = this.ipToInt(ip);
                const subnetIpInt = this.ipToInt(subnetIp);
                const subnetMask = this.getSubnetMask(parseInt(cidr));
                return (ipInt & subnetMask) === (subnetIpInt & subnetMask);
            }
                    
            

            async getSiteClients(req, res){
                try{
                    let siteId = req.params.siteid;
                    if(!siteId){    
                       return res.status(400).json({ "msg": "No Site Specified" });
                    }
                    let self = this;
                    let ipfilter = req.query.ipfilter ? req.query.ipfilter : null;
                    let clients = await self.fetchSiteClientsWithDetails(siteId, res.locals.accessToken);
                    for(let i = 0; i < clients.length; i++){
                        try{
                            let client = clients[i];
                            if(client.description?.ipAddresses == null){
                                //If the client has an IP Address, we will use it
                                //No end point IPs so fetch the devices list and us the device IP
                                let devices = await self.fetchSiteDevices(client.id, res.locals.accessToken,"");
                                if(devices && devices.length > 0){
                                    //If the client has devices, we will use the first device IP
                                    client.deviceIpAddresses = devices[0].ipAddressList;
                                }
                            }
                            //Fetch the CRM details so we have Email and Phone
                            //Now we have all the clients with crm id
                            if(client.ucrm?.client?.id){
                                client.crmDetails = await self.fetchClientDetails(client.ucrm.client.id, res.locals.accessToken);
                            }else{
                                this.debug("warn", "getSiteClients", "Client " + client.identification.name + " has no CRM ID");
                            }   
                        }catch(ex){
                            this.debug("error", "getSiteClients", ex.msg, ex.stack);
                        }
                    }

                    if(ipfilter && ipfilter.length > 0){
                        //Filter the clients by IP Address
                        clients = clients.filter(client => {
                            let ipAddress = client.description?.ipAddresses?.[0] ? client.description.ipAddresses[0] : (client.deviceIpAddresses?.[0] ? client.deviceIpAddresses[0] : null);
                            if(!ipAddress){
                                return true; //return clients without an IP Address
                            }
                            return  self.isInSubnet(ipAddress, ipfilter);
                        });
                    }
                    //Format the clients to include siteId and siteName
                    let formatedClients = 
                    clients.map(client => {
                        if(client.ucrm?.client?.name == "Herring, Danika"){
                            this.debug("trace", "getSiteClients", "Client Name: " + client.ucrm.client.name);
                        }
                        return {
                            siteName: client.identification?.parent.name ? client.identification.parent.name : "Unknown Site",
                            name: client.ucrm?.client?.name ? client.ucrm.client.name : (client.identification.name ? client.identification.name : "No Name"),
                            status: client.identification.status ? client.identification.status : "Unknown Status",
                            address: client.description?.address ? client.description.address : "No Address",
                            phone: client.crmDetails?.contacts?.[0]?.phone ? client.crmDetails.contacts[0].phone : "No Phone",
                            email: client.crmDetails?.contacts?.[0]?.email ? client.crmDetails.contacts[0].email : "No Email",
                            ipaddress: client.description?.ipAddresses?.[0] ? client.description.ipAddresses[0] : (client.deviceIpAddresses?.[0] ? client.deviceIpAddresses[0] : "No IP Address"),
                            activeFrom: client.ucrm?.service?.activeFrom ? client.ucrm.service.activeFrom : ""
                        };
                    });
                    res.json(formatedClients);
                }catch(ex){
                    this.debug("error", "getSiteClients", ex.msg, ex.stack);
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                }
            }

            async getSites(req, res){
                try{
                    let self = this;
                    let sites =  await self.fetchSites( res.locals.accessToken)
                    //Format the clients to include siteId and siteName
                    let formatedSites = 
                    sites.map(site => {
                        return {
                            id: site.id,
                            name: site.identification.name ? site.identification.name : "Unknown Site",                             
                        };
                    });
                    res.json(formatedSites);
                       
                }catch(ex){
                    this.debug("error", "getSites", ex.msg, ex.stack);
                    res.status(ex.statusCode || 500).json({ "msg": "An Error Occured!", "error": ex });
                }
            }

            async getTowerSitesClients(req, res){
                try{
                   let userPluginData =  await this.getPluginUserData(req,res);
                    if(userPluginData && userPluginData.sites){
                        var dataFetches = []
                        userPluginData.sites.forEach(siteId => {
                            dataFetches.push(self.fetchSiteClientsWithDetails(siteId))
                        });
                       let results = await Promise.all(dataFetches);
                            
                        var clients = []
                        results.forEach(siteClients => {
                            clients = clients.concat(siteClients);
                        });
                        res.json(clients);
                    }else{
                        res.status(400).json({ "msg": "No Sites Assigned to User" });
                    }
                   
                }catch(ex){
                    this.debug("error", "getTowerClients", ex.msg, ex.stack);
                    res.status(500).json({ "msg": "An Error Occured!", "error": ex });
                }
            }
            
        }
}

export {wilcowireless}
export default wilcowireless