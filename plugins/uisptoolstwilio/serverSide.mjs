"use strict"
import baseServerSide from "../baseServerSide.mjs";
import twilio from "../../node_modules/twilio/index.js";
import extend  from "../../node_modules/extend/index.js";
//import { MessageListInstanceCreateOptions } from "../../../../../node_modules/twilio/lib/rest/api/v2010/account/message";


let client = null; //twilio


var uisptoolstwilio = {
    plugin :  class plugin extends baseServerSide.plugin
    {
        init(){
            return new Promise((resolve, reject) => {
                //this is where if I needed to excute some one time code would go
                 super.init().then( () => 
                     {
                        const accountSid =  process.env.TWILIO_ACCOUNT_SID || this.config.twilioAccountSid || "";
                        const token = process.env.TWILIO_AUTH_TOKEN || this.config.twilioAuthToken || "";
                        client = twilio(accountSid, token);
                        resolve();
                     }
                 ).catch((err) => {
                        reject(err);
                 });
                this.debug("trace", "uisptoolstwilio factory init");
            });
            
        }

        bindRoutes(router){
                
            try {
                super.bindRoutes(router);
                //Any Routes above this line are not Checked for Auth and are Public
                router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/callFlow', this.twilioCallFlow.bind(this));
                router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/messageFlow', this.twilioMessageFlow.bind(this));
                router.post('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/callFlow', this.twilioCallFlow.bind(this));
                router.post('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/messageFlow', this.twilioMessageFlow.bind(this));
                router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/api/getCallFlow/:filename', this.getCallFlow.bind(this));
                router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/api/getCallFlows', this.getCallFlows.bind(this));
                router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/api/saveCallFlow', this.saveCallFlow.bind(this));
                router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/api/*', this.checkApiAccess.bind(this));
                router.post('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/api/*', this.checkApiAccess.bind(this));
                
                
                router.get('/' + this.uispToolsApiRequestHandler.options.urlPrefix + 'uisptoolstwilio/api/saveCallFlow', this.saveCallFlow.bind(this));
                // self.getPluginData = getPluginData;
                // self.getPluginUserData = getPluginUserData;
                // self.savePluginData = savePluginData;
                // self.savePluginUserData = savePluginUserData;
                // self.deletePluginData = deletePluginData;
                // self.deletePluginUserData = deletePluginUserData;


            } catch (ex) {
               this.debug("error", ex.msg, ex.stack);
            }
        }

        getCallFlows(req, res){
            try {
                let options = {pluginName:this.namespace, pluginDataType:'callFlow', projections:{pluginDataId:1}};
                this.uispToolsApiRequestHandler.uispToolsApiHandler.getPluginData(options).then((pluginData) => {
                  res.json(pluginData);  
                }).catch((err) => {
                    this.debug("error", err.msg, err.stack);
                    res.status(500).json({error: err.msg});
                });
            } catch (ex) {
                this.debug("error", ex.msg, ex.stack);
            }
        }

        getCallFlow(req, res){
            try {
                let options = {pluginName:this.namespace, pluginDataType:'callFlow', pluginDataId:req.params.filename};
                this.uispToolsApiRequestHandler.uispToolsApiHandler.getPluginData(options).then((pluginData) => {
                    if(pluginData && pluginData.callFlow){
                        res.json(pluginData.callFlow);
                    }else{
                        res.status(404).json({error: "No Call Flow Data Found"});
                    }
                })
                // .catch((err) => {
                //     this.debug("error", err.msg, err.stack);
                //     res.status(500).json({error: err.msg});
                // });
            } catch (ex) {
                this.debug("error", ex.msg, ex.stack);
                res.status(500).json({error: ex});
            }
        }

        saveCallFlow(req, res){
            try {
                let event = extend({}, req.query, req.body || {});
            } catch (ex) {
                this.debug("error", ex.msg, ex.stack);
            }
        }

        twilioMessageFlow(req, res){
            try {
                let event = extend({}, req.query, req.body || {});
            } catch (ex) {
                this.debug("error", ex.msg, ex.stack);
            }
        }

        twilioCallFlowSaveEventData(options){
            return this.uispToolsApiRequestHandler.uispToolsApiHandler.savePluginData({collectionName:'twilioCalls', find:{"CallSid" : options.eventData.CallSid}, pluginData:{$set: options.eventData}});
        }

        twilioCallFlow(req, res){
            try {
                let event = extend({}, req.query, req.body || {});

                let flow = event.Flow || "DefaultCallFlow.json";
                if(flow.startsWith("/") === true){
                    flow = flow.substring(1);
                }
                let state = event.State || "Execute";
                
                var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                if (ip.substr(0, 7) === "::ffff:") {
                    ip = ip.substr(7);
                }
                var port = req.connection.remotePort;
                var ua = req.headers['user-agent'];
                let connInfo =  { ip: ip, port: port, ua: ua };

                
                this.logUtilHelper.log("plugin", this.namespace, 'debug',  {path: req.path, event: event, ip:connInfo.ip,  port:connInfo.port, ua: connInfo.ua});
                //console.log("flow " + flow, "state " + state, "event", JSON.stringify(event));
                let response = new twilio.twiml.VoiceResponse();
                this.twilioCallFlowSaveEventData({eventData:event});
                this.uispToolsApiRequestHandler.uispToolsApiHandler.getPluginData({pluginName:this.namespace, pluginDataType:'callFlow', pluginDataId:flow})
                .then((pluginData) => {
                    if(pluginData && pluginData.callFlow){
                        //const assetRawText = fs.readFileSync(assets[flow].path, 'utf8');
                        let assetData = pluginData.callFlow;
                        switch(state){
                            case "Execute":
                                if(assetData.blockedNumbers){
                                    let numbers = assetData.blockedNumbers.split(/,\s?/);
                                    numbers.forEach((blockedNumber) => {
                                        let callFrom =  event.From;
                                        if(blockedNumber === callFrom ){
                                        if(assetData.blockedSay) {
                                            response.say(assetData.blockedSay);
                                        }
                                        if(assetData.blockedPlay) {
                                            response.play(assetData.blockedPlay);
                                        }
                                        response.say("Goodbye");
                                        response.pause({length: 2});
                                        response.hangup();    
                                        }
                                    });
                                
                                }
                                if(assetData.greetingSay) {
                                    response.say(assetData.greetingSay);
                                }
                                if(assetData.greetingPlay) {
                                    response.play(assetData.greetingPlay);
                                }
                                response.redirect(req.path + "?Flow=" + encodeURIComponent(flow) +"&State=Dial&Dial=1&Number=1");
                                //return callback(null, response);
                                break;
                            case "Dial":
                                let dial = event.Dial;
                                let number = event.Number;
                                if(dial && number && assetData.dial && assetData.dial["dial" + dial]){
                                    let dialData = assetData.dial["dial" + dial];
                                
                                    if(dialData.numbers){
                                        let numbers = dialData.numbers.split(/,\s?/);
                                
                                        let dialOptions = {
                                            action: req.path + "?Flow=" + encodeURIComponent(flow) +"&State=DialAction&Dial=" + dial + "&Number=" + number,
                                            //method:"GET",
                                            timeout: dialData.timeout || 5,
                                            timeLimit: dialData.timeLimit || 3600,
                                            trim: dialData.trim || "trim-silence" 
                                        };
                                        if(dialData.callerIdUseCalled){
                                            dialOptions.callerId = event.To;
                                        }
                                        if(dialData.record){
                                            dialOptions.record = dialData.recordType || "record-from-answer-dual";
                                            //dialOptions.recordingStatusCallback = req.path + "?Flow=" + encodeURIComponent(flow) +"&State=DialRecordStatus&Dial=1&Number=1";
                                        }
                                        const responseDial = response.dial(dialOptions);
                                
                                        let numberOptions = {};
                                        //if there was a whisper
                                        if(dialData.url){
                                            numberOptions.url = req.path + "?Flow=" + encodeURIComponent(flow) +"&State=DialUrl&Dial="+ dial + "&Number=" + number;
                                            numberOptions.method = "POST";
                                        }
                                                    
                                        if(dialData.simulring){
                                            numbers.forEach((dialNumber) => {
                                                if(dialNumber.startsWith("sip:")){
                                                responseDial.sip(numberOptions, dialNumber);
                                                }else{
                                                responseDial.number(numberOptions, dialNumber);     
                                                }
                                            });
                                        }else{
                                            let dialNumber = numbers[number-1];
                                            
                                            if(dialNumber.startsWith("sip:")){
                                                responseDial.sip(numberOptions, dialNumber);
                                            }else{
                                                responseDial.number(numberOptions, dialNumber);     
                                            }
                                            
                                        }
                                    }
                                
                                }else{
                                    if(assetData.voicemail && assetData.voicemail.enabled){
                                        let redirUrl = req.path + "?Flow=" + encodeURIComponent(flow) +"&State=Record";
                                        this.logUtilHelper.log("plugin", this.namespace, 'debug', 'Url' + redirUrl);
                                        response.redirect(redirUrl);
                                    }else{
                                        response.say("Goodbye");
                                        response.pause({length: 2});
                                        response.hangup();
                                    }
                                }
                                console.log(event, response);
                                //return callback(null, response);
                                break;
                            case "Record":
                                let timeout = 10;
                                let transcribe = false;
                                let playBeep = false;
                                let maxLength = 300;
                                let trim = "trim-silence";
                                
                                let transcribeCallback = null;
                                
                                if(assetData.voicemail.timeout){
                                    timeout = assetData;
                                }
                                
                                if(assetData.voicemail.transcribe){
                                    transcribe = assetData.voicemail.transcribe;
                                    transcribeCallback = req.path + "?Flow=" + encodeURIComponent(flow) +"&State=RecordTranscribe";
                                }
                                
                                if(assetData.voicemail.playBeep){
                                    playBeep = assetData.voicemail.playBeep;
                                }
                                
                                if(assetData.voicemail.maxLength){
                                    maxLength = assetData.voicemail.maxLength;
                                }
                                
                                if(assetData.voicemail.trim){
                                    trim = assetData.voicemail.trim;
                                }
                                
                                if(assetData.voicemail.say){
                                    response.say(assetData.voicemail.say);
                                }
                                if(assetData.voicemail.play){
                                    response.play(assetData.voicemail.play);
                                }
                                response.record({
                                    action: req.path + "?Flow="+ encodeURIComponent(flow) +"&State=RecordAction" ,
                                    timeout: timeout,
                                    transcribe: transcribe,
                                    maxLength: maxLength,
                                    recordingStatusCallback: req.path + "?Flow="+ encodeURIComponent(flow) +"&State=RecordStatus",
                                    recordingStatusCallbackEvent: "completed, absent",
                                    trim: trim
                                })
                                //return callback(null, response);
                                break;
                            case "DialAction":
                                try {

                                if(event.DialCallStatus === "completed"){
                                    let recordSmsNotify = false;
                                    let recordSmsNotifyNumbers = "";
                                    let dial = parseInt(event.Dial,10);
                                    let number = parseInt(event.Number,10);
                                    let smsNotifyCalled = false;
                                    let smsNotifyTitle = "";
                                    if(dial && number && assetData.dial && assetData.dial["dial" + dial]){
                                    let dialData = assetData.dial["dial" + dial];
                                    if (dialData.recordSmsNotify){
                                        recordSmsNotify = true;
                                    }
                                    if (dialData.smsNotifyNumbers){
                                        recordSmsNotifyNumbers = dialData.smsNotifyNumbers;
                                    }
                                    if(dialData.smsNotifyCalled){
                                        smsNotifyCalled = true;
                                    }
                                    if(dialData.smsNotifyTitle){
                                        smsNotifyTitle = dialData.smsNotifyTitle;
                                    }
                                    }
                                    if(recordSmsNotify){
                                        let dialRecordNotifyToNumbers = null;
                                        if(recordSmsNotifyNumbers){
                                            dialRecordNotifyToNumbers = recordSmsNotifyNumbers.split(/,\s?/);
                                        }
                                        const dialRecordNotifyFrom =  event.To;
                                        //const client = context.getTwilioClient(); 
                                        const getCalledNumberPromise = new Promise((resolve, reject) => {
                                            
                                            if(smsNotifyCalled){
                                                client.calls(event.DialCallSid)
                                                .fetch()
                                                .then((callLog) => {
                                                    this.logUtilHelper.log("plugin", this.namespace, 'debug', "Dial Action Call Log Call To "+  callLog.to + " " + event.DialCallSid);
                                                    resolve(callLog.to)
                                                }).catch((err) => {
                                                    this.logUtilHelper.log("plugin", this.namespace, 'error', "Error Retriving Call Log " + event.DialCallSid);
                                                    resolve(null);
                                                });
                                            }else{
                                                resolve(null);
                                            } 
                                        });
                                        getCalledNumberPromise.then((dialedNumber) => {
                                            let notifyBody = "";
                                            if(smsNotifyTitle){
                                                notifyBody = smsNotifyTitle + "\n"
                                            }
                                            notifyBody = notifyBody + "From: " + event.From + "\nTo: " + event.To + "\nDuration: " + event.DialCallDuration  + "\n" + event.RecordingUrl;  
                                            var sendDialActionTexts = [];
                                            if(dialedNumber){
                                                if(dialRecordNotifyToNumbers){
                                                    dialRecordNotifyToNumbers.push(dialedNumber);
                                                }else{
                                                    dialRecordNotifyToNumbers = [];
                                                    dialRecordNotifyToNumbers.push(dialedNumber);
                                                }
                                            }
                                            if(dialRecordNotifyToNumbers){
                                                dialRecordNotifyToNumbers.forEach((notifyToNumber) => {
                                                    this.logUtilHelper.log("plugin", this.namespace, 'debug','DialAction Text Message From ' + dialRecordNotifyFrom + ' Sending to ' + notifyToNumber);
                                                    var message = sendDialActionTexts.push(client.messages.create({from: dialRecordNotifyFrom, body: notifyBody, to: notifyToNumber}));
                                                }); 
                                            }else{
                                                this.logUtilHelper.log("plugin", this.namespace, 'error','No Numbers to send record to!');
                                                sendDialActionTexts.push(true);
                                            }
                                            Promise.all(sendDialActionTexts).then((responses) => {
                                                responses.forEach((message) =>{
                                                    this.logUtilHelper.log("plugin", this.namespace, 'debug', 'Text Message Sent ' + message.sid);  
                                                })
                                                response.say("Goodbye");
                                                response.pause({length: 2});
                                                response.hangup();   
                                                    //return callback(null, response);
                                            }).catch((error) => {
                                                this.logUtilHelper.log("plugin", this.namespace, 'error', 'Error Text Message failed', error);
                                                response.say("Goodbye");
                                                response.pause({length: 2});
                                                response.hangup();   
                                                //return callback(null, response);
                                            });
                                        }).catch((error) => {
                                            this.logUtilHelper.log("plugin", this.namespace, 'error', 'Error retriving Call Log', error);
                                            response.say("Goodbye");
                                            response.pause({length: 2});
                                            response.hangup();   
                                            //return callback(null, response);
                                        });
                                    }else{
                                        this.logUtilHelper.log("plugin", this.namespace, 'debug', 'RecordSmsNotify = false');
                                        response.say("Goodbye");
                                        response.pause({length: 2});
                                        response.hangup();   
                                        //return callback(null, response);
                                    }   
                                    
                                    
                                }else{  //else CallStatus if we got here it was not "completed"
                                    let dial = parseInt(event.Dial,10);
                                    let number = parseInt(event.Number,10);
                                    if(dial && number && assetData.dial && assetData.dial["dial" + dial]){
                                        let dialData = assetData.dial["dial" + dial];
                                        if(dialData.numbers){
                                            let numbers = dialData.numbers.split(/,\s?/);
                                            if(dialData.simulring || numbers.length >= number){
                                                //check to see if the next dialData has numbers if so redirect to that Dial Data
                                                dial = dial + 1;
                                                if(assetData.dial && assetData.dial["dial" + dial]){
                                                    let redirUrl = req.path + "?Flow=" + encodeURIComponent(flow) +"&State=Dial&Dial=" + dial + "&Number=1";
                                                    console.log('Url' + redirUrl);
                                                    if(assetData.huntSay){
                                                        response.say(assetData.huntSay);  
                                                    }
                                                    if(assetData.huntPlay){
                                                        response.play(assetData.huntPlay);  
                                                    }
                                                        response.redirect(redirUrl);
                                                    //return callback(null, response); 
                                                }
                                            
                                            }else{
                                                number++;
                                                if(numbers[number]){
                                                    let redirUrl = req.path + "?Flow=" + encodeURIComponent(flow) +"&State=Dial&Dial=" + dial + "&Number=" + number;
                                                    console.log('Url' + redirUrl);
                                                    if(assetData.huntSay){
                                                    response.say(assetData.huntSay);  
                                                    }
                                                    if(assetData.huntPlay){
                                                    response.play(assetData.huntPlay);  
                                                    }
                                                    response.redirect(redirUrl);
                                                    //return callback(null, response); 
                                                }
                                            }
                                            if(assetData.voicemail && assetData.voicemail.enabled){
                                                let redirUrl = req.path + "?Flow=" + encodeURIComponent(flow) +"&State=Record";
                                                //console.log('Url' + redirUrl);
                                                response.redirect(redirUrl);
                                                //return callback(null, response); 
                                            }else{
                                                response.say("Goodbye");
                                                response.pause({length: 2});
                                                response.hangup();
                                                //return callback(null, response); 
                                            }
                                        }
                                    }
                                }
                                } catch (error) {
                                    // In the event of an error, return a 500 error and the error message
                                    this.logUtilHelper.log("plugin", this.namespace, 'error',error);
                                    //return callback(error);
                                }   
                                break;
                            case "RecordAction":
                                //Send Hangup if we have finished Recording 
                                response.say("Goodbye");
                                response.pause({length: 2});
                                response.hangup();
                                //return callback(null, response);
                                break;
                            case "RecordStatus":
                                try {
                                    const voicemailData = assetData.voicemail;
                                    const VmSmsNotifyFrom = event.To;
                                    const VmSmsNotifyTo = voicemailData.smsNotifyNumbers;
                                    //const client = context.getTwilioClient();
                                    client.calls(event.CallSid)
                                    .fetch()
                                    .then(
                                        function(callLog){
                                            this.logUtilHelper.log("plugin", this.namespace, 'debug', "Dial Action Call Log Call To "+  callLog.to + " " + event.CallSid);
                                            let callFrom = callLog.from || event.From;
                                            let callTo = callLog.to || event.To;    
                                            var notifyPromises = [];
                                            if(voicemailData.smsNotify){
                                                let voicemailNotifyToNumbers = VmSmsNotifyTo.split(/,\s?/);
                                                let notifyBody = "";
                                                if(voicemailData.smsNotifyTitle){
                                                    notifyBody = voicemailData.smsNotifyTitle + "\n"
                                                }
                                                notifyBody = notifyBody + "From: " + callFrom; 
                                                if(callLog.callerName && callLog.callerName !== callFrom){
                                                    notifyBody = notifyBody + " " + callLog.callerName;
                                                }
                                                notifyBody = notifyBody + "\nTo:" + callTo + "\nDuration: " + event.RecordingDuration + "\n" + event.RecordingUrl;  
                                                voicemailNotifyToNumbers.forEach((notifyToNumber) => {
                                                    notifyPromises.push( client.messages.create({from: VmSmsNotifyFrom, body: notifyBody, to: notifyToNumber}));
                                                })
                                            }
                                            let sendgridApiKey = process.env.SENDGRID_API_KEY || this.config.sendgridApiKey || "";
                                            if(voicemailData.emailNotify && sendgridApiKey ){
                                                let emailNotifyTo =  voicemailData.emailNotifyTo 
                                                let emailNotifyFrom =  voicemailData.emailNotifyFrom 
                                                let emailNotifySubject = voicemailData.emailNotifySubject 
                                                let notifyBody = "";
                                                
                                                notifyBody = notifyBody + "From: " + callFrom;
                                                if(callLog.callerName && callLog.callerName !== callFrom){
                                                    notifyBody = notifyBody + " " + callLog.callerName;
                                                }
                                                
                                                notifyBody = notifyBody + "\nTo:" + callTo + "\nDuration: " + event.RecordingDuration + "\n" + event.RecordingUrl;

                                                const postData  = {
                                                personalizations: [{ to: [{ email: emailNotifyTo }] }],
                                                from: { email: emailNotifyFrom },
                                                subject: emailNotifySubject + ` From: ${callFrom}`,
                                                content: [
                                                    {
                                                    type: 'text/plain',
                                                    value: notifyBody,
                                                    },
                                                ],
                                                };
                                                const postOptions = {
                                                method: 'POST',
                                                headers: {
                                                    Authorization: `Bearer ${sendgridApiKey}`,
                                                    'Content-Type': 'application/json',
                                                }
                                                }
                                                let httpRequest = https.request('https://api.sendgrid.com/v3/mail/send', postOptions)
                                                httpRequest.write(JSON.stringify(postData));
                                                httpRequest.end();
                                                notifyPromises.push(httpRequest);
                                                    
                                            }
                                            if(notifyPromises && notifyPromises.length > 0){
                                                Promise.all(notifyPromises).then(
                                                    function(message){
                                                        this.logUtilHelper.log("plugin", this.namespace, 'debug', 'Text Messages and/or Email Sent');
                                                        response.say("Goodbye.");
                                                        response.pause({length: 2});
                                                        response.hangup();   
                                                        //return callback(null, response);
                                                    },
                                                    function(error){
                                                        this.logUtilHelper.log("plugin", this.namespace, 'error', 'Error Text Message failed', error);
                                                        response.say("Goodbye.");
                                                        response.pause({length: 2});
                                                        response.hangup();   
                                                        //return callback(null, response);
                                                        //return callback(error);
                                                    }
                                                );
                                            }else{
                                                response.say("Goodbye.");
                                                response.pause({length: 2});
                                                response.hangup();   
                                                //return callback(null, response);
                                            }
                                        
                                        },
                                        function(){
                                            this.logUtilHelper.log("plugin", this.namespace, 'error', "Error Retriving Call Log " + event.DialCallSid);
                                            resolve(null);
                                        }
                                    );

                                } catch (error) {
                                    // In the event of an error, return a 500 error and the error message
                                    this.logUtilHelper.log("plugin", this.namespace, 'error', error);
                                    //return callback(error);
                                }
                                break;
                            default:
                                this.logUtilHelper.log("plugin", this.namespace, 'error', 'Error Invalid State', state);
                                response.say("Invalid State"); 
                                response.hangup(); 
                                //return callback(null, response);
                                break;
                        }
                        res.set('Cache-Control', 'no-store')
                        res.set('Content-Type', 'text/xml');
                        this.logUtilHelper.log("plugin", this.namespace, 'debug', {twiml: response.toString()});
                        res.send(response.toString());
                    }else{
                        // response.say("Call Flow is Missing Unable to continue. " + flow);
                        // response.say("Goodbye");
                        // response.pause({length: 2});
                        // response.hangup();  
                        //return callback(null, response); 
                        this.logUtilHelper.log("plugin", this.namespace, 'warning', {twiml: response.toString()}); 
                        res.status(404).json({error: "Call Flow is Missing Unable to continue. " + flow});
                    }  
                
                }).catch((err) => {
                    
                    this.logUtilHelper.log("plugin", this.namespace, 'error', err);
                    res.status(404).json({error: err});
                    // response.say("Error Retrieving Call Flow Unable to continue. " + flow);
                    // response.say("Goodbye");
                    // response.pause({length: 2});
                    // response.hangup();  
                    //return callback(null, response);  
                });  
            } catch (error) {
                // In the event of an error, return a 500 error and the error message
                this.logUtilHelper.log("plugin", this.namespace, 'error', error);
                res.status(500).json({error: error});  
                //return callback(error);
            }
            
            
        }
    }
}
export {uisptoolstwilio}