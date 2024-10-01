    "use strict"
    import baseClientSide from "../../../baseClientSide.js";
    /*
    * uisptools  1.0
    * Copyright (c) 2022 Digital Example
    * Date: 2022-09-15
    */

    /** 
    @name uisptools.widget.twiliocallflow
    @class This is the detectdfs widget class for the UISPTools widget framework
    @description We make a call to nms.devices/ap then for each device call the /devices/{id}/configuration /devices/airos/{id}/configuration and compare frequency to detect if device has changed channel due to dfs
    */
    class twiliocallflow extends baseClientSide.widget
     {
        loadTemplate(){
            return new Promise((resolve, reject) => {
                try{
                    let $element = $(this.element);
                    let url = this.widgetFactory.getWidgetFactoryFolder() + "/widgets/twiliocallflow/twiliocallflow.htm";
                    $.uisptools.ajax({
                        method: 'GET',
                        url:  url,
                        dataType: 'html'
                    }).then(
                        (widgetHtml)  => {
                            $element.html(widgetHtml);
                            resolve();
                        },
                         (err)  => {
                            $.logToConsole("Error: uisptools.loadWidget.onLoad.getWidgetHtml failed " + err);
                            reject(err);
                        }
                    );
                }catch(ex){
                    $.logToConsole("ERROR uisptools.loadWidget: " + ex.toString());
                    var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during uisptools.loadWidget.");
                    reject(objError);
                }
            });
        }
        loadSavedData(data){
          if(data){
            if(data.greetingSay){
              $("#GreetingSay").val(data.greetingSay);
            }else{
              $("#GreetingSay").val('');
            }
  
            if(data.greetingPlay){
              $("#GreetingPlay").val(data.greetingPlay);
            }else{
              $("#GreetingPlay").val('');
            }
  
            if(data.huntSay){
              $("#HuntSay").val(data.huntSay);
            }else{
              $("#HuntSay").val('');
            }
  
            if(data.huntPlay){
              $("#HuntPlay").val(data.huntPlay);
            }else{
              $("#HuntPlay").val('');
            }
  
  
            if (data.dial && data.dial.dial1){
              this.setDialData(1,data.dial.dial1);
            }
            if (data.dial && data.dial.dial2){
              this.setDialData(2,data.dial.dial2);
            }
            if (data.dial && data.dial.dial3){
              this.setDialData(3,data.dial.dial3);
            }
            if (data.dial && data.dial.dial4){
              this.setDialData(4,data.dial.dial4);
            }
            if (data.voicemail){
              this.setVoicemailSettings(data.voicemail);
            }
            $("#resultJson").val(JSON.stringify(data, null, 2));
          }
        }
    
        confirmDelete(options){
  
          //options = {prompt:"Are you sure you want to Delete?"}
          var $modal = $('#confirmDelete');
          var modal = bootstrap.Modal.getOrCreateInstance($modal);
          $modal.find("#prompt").text(options.prompt)
          var deferred = $.Deferred();
          $("#btnDelete").off("click").on("click",function(){
            
            modal.hide();
            deferred.resolve();
          });
          $("#btnCancel").off("click").on("click",function(){
            modal.hide();
            deferred.reject();
          });
          modal.show();
          return deferred.promise();
        }
    
        confirmDialog(options){
    
          //options = {prompt:"Are you sure you want to Delete?"}
          var $modal = $('#confirmDialog');
          var modal = bootstrap.Modal.getOrCreateInstance($modal);
          $modal.find("#prompt").text(options.prompt)
          var deferred = $.Deferred();
          $("#btnConfirm").text(options.confimLabel).off("click").on("click",function(){
            modal.hide();
            deferred.resolve();
          });
          $("#btnCancel").off("click").on("click",function(){
            modal.hide();
            deferred.reject();
          });
          modal.show();
          return deferred.promise();
        }
    
    
        clearError(){
          $("#ErrorDisplay").empty().hide();
        }
        showError(err){
            $("#ErrorDisplay").html(err).show().focus();
        }
        // onCallflowListChange(){
        //     //rebind Asset List
        //     var $callList = $("#callFlowList");
        //     commonData.ServiceSid = $serviceList.val();
        // }
        
        updateCallflowList(callFlows){
            
          var $callFlowList = $("#callFlowList");
          $callFlowList.empty();
          $.each(callFlows, function(index, callFlow) {
            //for(let i=0; i < callFlows.length; i++){
              //var callFlow = callFlows[i];
              var $callFlow = $("<option></option>");
              $callFlow.attr("value",callFlow.pluginDataId).attr("aria-controls", callFlow.pluginDataId).text(callFlow.pluginDataId);
              $callFlowList.append($callFlow);
            //}
          });
          
          //this.onCallflowListChange();
        }
        loadJsonData(){
          try{
            var jsonRaw = $("#resultJson").val();
            var jsonData =  JSON.parse(jsonRaw);
            loadSavedData(jsonData);
          }catch(ex){
            showError(ex.message + "/n------------------/n" + ex.stack);
            
          }
          
        }
    
        getCallFlowJson(){
          var jsonData = {};
          jsonData.greetingSay = $("#GreetingSay").val();
          jsonData.greetingPlay = $("#GreetingPlay").val();
          jsonData.huntSay = $("#HuntSay").val();
          jsonData.huntPlay = $("#HuntPlay").val();
          jsonData.dial = {
            dial1 : this.getDialData(1),
            dial2 : this.getDialData(2),
            dial3 : this.getDialData(3),
            dial4 : this.getDialData(4)
          };
          jsonData.voicemail = this.getVoicemailSettings();
          return jsonData;
        }
    
        saveJsonData(){
            var jsonData = this.getCallFlowJson();
            $("#resultJson").val(JSON.stringify(jsonData, null, 2));
            localStorage .setItem('TwilioData', JSON.stringify(jsonData));
        }
           
        getVoicemailSettings(){
          let $Voicemail = $(".Voicemail");
          var voicemailData = {};
          if( $Voicemail.find("#Enable").prop('checked')){
            voicemailData.enabled = true;
          }else{
            voicemailData.enabled = false;
          }
          
          voicemailData.say = $Voicemail.find("#Say").val();
          voicemailData.play = $Voicemail.find("#Play").val();
  
          if( $Voicemail.find("#PlayBeep").prop('checked')){
            voicemailData.playBeep = true;
          }else{
            voicemailData.playBeep = false;
          }
          if( $Voicemail.find("#Transcribe").prop('checked')){
            voicemailData.transcribe = true;
          }else{
            voicemailData.transcribe = false;
          }
  
          if( $Voicemail.find("#SmsNotify").prop('checked')){
            voicemailData.smsNotify = true;
          }else{
            voicemailData.smsNotify = false;
          }
          voicemailData.smsNotifyNumbers = $Voicemail.find("#SmsNotifyNumbers").val();
  
          if( $Voicemail.find("#EmailNotify").prop('checked')){
            voicemailData.emailNotify = true;
          }else{
            voicemailData.emailNotify = false;
          }
          voicemailData.emailNotifyAddresses = $Voicemail.find("#EmailNotifyAddresses").val();
          voicemailData.emailNotifySubject = $Voicemail.find("#EmailNotifySubject").val();
  
          return voicemailData;
        }
    
        setVoicemailSettings(voicemailData){
            let $Voicemail = $(".Voicemail");
            
            if(voicemailData.enabled){
              $Voicemail.find("#Enable").prop('checked', true);
            }else{
              $Voicemail.find("#Enable").prop('checked', false);
            }
            if(voicemailData.say){
               $Voicemail.find("#Say").val(voicemailData.say);
            }else{
              $Voicemail.find("#Say").val("");
            }
            if(voicemailData.play){
              $Voicemail.find("#Play").val(voicemailData.play);
            }else{
              $Voicemail.find("#Play").val("");
            }
            if(voicemailData.playBeep){
              $Voicemail.find("#PlayBeep").prop('checked', true);
            }else{
              $Voicemail.find("#PlayBeep").prop('checked', false);
            }    
            if(voicemailData.transcribe ){
              $Voicemail.find("#Transcribe").prop('checked',voicemailData.transcribe);
            }else{
              $Voicemail.find("#Transcribe").prop('checked',false);
            }
    
            if(voicemailData.smsNotify ){
              $Voicemail.find("#SmsNotify").prop('checked',voicemailData.smsNotify);
            }else{
              $Voicemail.find("#SmsNotify").prop('checked',false);
            }
            
            if(voicemailData.smsNotifyNumbers){
              $Voicemail.find("#SmsNotifyNumbers").val(voicemailData.smsNotifyNumbers);
            }else{
              $Voicemail.find("#SmsNotifyNumbers").val();
            }
    
            if(voicemailData.emailNotify ){
              $Voicemail.find("#EmailNotify").prop('checked',voicemailData.emailNotify);
            }else{
              $Voicemail.find("#EmailNotify").prop('checked',false)
            }
            if (voicemailData.emailNotifyAddresses){
              $Voicemail.find("#EmailNotifyAddresses").val(voicemailData.emailNotifyAddresses);
            } else{
              $Voicemail.find("#EmailNotifyAddresses").val("");
            }
            if (voicemailData.emailNotifyFrom){
              $Voicemail.find("#EmailNotifyFrom").val(voicemailData.emailNotifyFrom);
            } else{
              $Voicemail.find("#EmailNotifyFrom").val("");
            }
            if (voicemailData.emailNotifySubject){
              $Voicemail.find("#EmailNotifySubject").val(voicemailData.emailNotifySubject);
            } else{
              $Voicemail.find("#EmailNotifySubject").val("");
            }
    
            return voicemailData;
          }
    
          getDialData(num){
            let $Dial = $(".Dial" + num);
            var dialData = null;
            if ($Dial.find("#Numbers").val()){
                dialData = {};
                dialData.numbers = $Dial.find("#Numbers").val();
                if($Dial.find("#Simulring").prop('checked')){
                  dialData.simulring = true;
                }else{
                  dialData.simulring = false;
                }
                if($Dial.find("#CallerIDUseCalled").prop('checked')){
                  dialData.callerIdUseCalled = true;
                }else{
                  dialData.callerIdUseCalled = false;
                }
                if($Dial.find("#Record").prop('checked')){
                  dialData.record = true;
                }else{
                  dialData.record = false;
                }
                if($Dial.find("#RecordSmsNotify").prop('checked')){
                  dialData.recordSmsNotify = true;
                }else{
                  dialData.recordSmsNotify = false;
                }
                if($Dial.find("#SmsNotifyCalled").prop('checked')){
                  dialData.smsNotifyCalled = true;
                }else{
                  dialData.smsNotifyCalled = false;
                }
                
                
                if($Dial.find("#Transcibe").prop('checked')){
                  dialData.transcibe = true;
                }else{
                  dialData.transcibe = false;
                }
                if($Dial.find("#TranscribeSmsNotify").prop('checked')){
                  dialData.transcibeSmsNotify = true;
                }else{
                  dialData.transcibeSmsNotify = false;
                }
                if($Dial.find("#TranscribeSmsNotifyCalled").prop('checked')){
                  dialData.transcibeSmsNotifyCalled = true;
                }else{
                  dialData.transcibeSmsNotifyCalled = false;
                }
    
    
                if($Dial.find("#smsNotifyNumbers").val()){
                  dialData.smsNotifyNumbers = $Dial.find("#smsNotifyNumbers").val();
                }else{
                  dialData.smsNotifyNumbers ="";
                }
    
                if($Dial.find("#smsNotifyTitle").val()){
                  dialData.smsNotifyTitle = $Dial.find("#smsNotifyTitle").val();
                }else{
                  dialData.smsNotifyTitle ="";
                }
                
            }
            return dialData;
          }
    
          setDialData(num, dialData){
            let $Dial = $(".Dial" + num);
            if(dialData.numbers){
              $Dial.find("#Numbers").val(dialData.numbers);
            }else{
              $Dial.find("#Numbers").val("");
            }
            if(dialData.simulring){
              $Dial.find("#Simulring").prop('checked',"checked");
            }else{
              $Dial.find("#Simulring").prop('checked',"");
            }
            if(dialData.callerIdUseCalled){
              $Dial.find("#CallerIdUseCalled").prop('checked',"checked");
            }else{
              $Dial.find("#CallerIdUseCalled").prop('checked',"");
            }
            if(dialData.record){
              $Dial.find("#Record").prop('checked',"checked");
            }else{
              $Dial.find("#Record").prop('checked',"");
            }
            if(dialData.recordSmsNotify){
              $Dial.find("#RecordSmsNotify").prop('checked',"checked");
            }else{
              $Dial.find("#RecordSmsNotify").prop('checked',"");
            }
            if(dialData.smsNotifyCalled){
              $Dial.find("#smsNotifyCalled").prop('checked',"checked");
            }else{
              $Dial.find("#smsNotifyCalled").prop('checked',"");
            }
            
            if(dialData.smsNotifyNumbers){
              $Dial.find("#smsNotifyNumbers").val(dialData.smsNotifyNumbers);
            }else{
              $Dial.find("#smsNotifyTitle").val("");
            }
            
            if(dialData.smsNotifyTitle){
              $Dial.find("#smsNotifyTitle").val(dialData.smsNotifyTitle);
            }else{
              $Dial.find("#smsNotifyTitle").val("");
            }
    
    
            if(dialData.transcibe){
              $Dial.find("#Transcibe").prop('checked',"checked");
            }else{
              $Dial.find("#Transcibe").prop('checked',"");
            }
            if(dialData.transcibeSmsNotify){
              $Dial.find("#TranscribeSmsNotify").prop('checked',"checked");
            }else{
              $Dial.find("#TranscribeSmsNotify").prop('checked',"");
            }
            if(dialData.transcibeSmsNotifyCalled){
              $Dial.find("#TranscribeSmsNotifyCalled").prop('checked',"checked");
            }else{
              $Dial.find("#TranscribeSmsNotifyCalled").prop('checked',"");
            }
          }
          init(){
            return new Promise((resolve, reject) => {
                this.loadTemplate().then(
                    () => {
                        this.bind().then(
                            () => {
                                resolve();
                            },
                            (err) => {
                                reject(err)
                            }
                        );
                    },
                    (err) =>{
                        reject(err)
                    } 
                )
            })
        }

        fetchCallFlows(){
          return new Promise((resolve, reject) => {
            try{
              let url = this.getBaseUrlPath() + "/uisptoolstwilio/api/getCallFlows";
              $.uisptools.ajax({
                  method: 'GET',
                  url:  url,
                  dataType: 'json'
              }).then(
                  (callFlows)  => {
                      resolve(callFlows);
                  },
                   (err)  => {
                      $.logToConsole("Error: uisptools.loadWidget.onLoad.getWidgetHtml failed " + err);
                      reject(err);
                  }
              );
            }catch(ex){
                $.logToConsole("ERROR uisptools.loadWidget: " + ex.toString());
                var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during uisptools.loadWidget.");
                reject(objError);
            }
          });
        }

        fetchCallFlow(options){
          return new Promise((resolve, reject) => {
            try{
              let url = this.getBaseUrlPath() + "/uisptoolstwilio/api/getCallFlow/" + options.pluginDataId;
              $.uisptools.ajax({
                  method: 'GET',
                  url:  url,
                  dataType: 'json'
              }).then(
                  (callFlow)  => {
                      resolve(callFlow);
                  },
                   (err)  => {
                      $.logToConsole("Error: uisptools.loadWidget.onLoad.getWidgetHtml failed " + err);
                      reject(err);
                  }
              );
            }catch(ex){
                $.logToConsole("ERROR uisptools.loadWidget: " + ex.toString());
                var objError = $.uisptools.createErrorFromScriptException(ex, "Server error during uisptools.loadWidget.");
                reject(objError);
            }
          });
        }
    
        bind(){
            return new Promise((resolve, reject) => {
                this.clearError();
                Promise.all([this.fetchCallFlows()])
                .then(
                    (results) =>{
                      
                      this.updateCallflowList(results[0]);
                      
                      //inject 4 Dial Templates
                      var $DialTemplate = $("#templates").find(".Dial");
                      var $DialContainer = $(".DialContainer");
                      for(let i=1; i <= 4; i++){
                        var $Dial = $DialTemplate.clone();
                        $Dial.removeClass("Dial").addClass("Dial" + i);
                        $DialContainer.append($Dial);
                      }
              
                      
                      //$("#btnSave").on("click", saveJsonData);
              
                      $("#btnCallFlowLoad").on("click", (evt) => {
                        let callFlowFileName = $("#callFlowList").val();
                        if(callFlowFileName){
                          this.fetchCallFlow({pluginDataId: callFlowFileName}).then( (callFlow) => {
                            this.loadSavedData(callFlow);
                          }, (err) => {
                            this.showError(err);
                          });
                        }else{
                          this.showError("No Call Flow Selected");
                        }
                         
                      });
                      $("#btnCallflowDelete").on("click", 
                        function(){
                          clearError();
                          var confirmData = {prompt:"Are you sure you want to Delete this CallFlow?"}
                          confirmDelete(confirmData).then(
                            function(){
                              //they Clicked Delete
                              var $serviceList = $("#callFlowList");
                              var data = {plugDataId : $callFlowList.val()};
                              deleteCallflow(data).then(
                                function(){
                                  getCallFlowList().then(
                                    function(callFlows){
                                      this.updateCallFlowList(callFlows);
                                    },
                                    function(err){
                                      var msg = err.message || err.statusText
                                      this.showError(msg)
                                    } 
                                  )
                                },
                                function(err){
                                  var msg = err.message || err.statusText
                                  this.showError(msg)
                                } 
                              )
                            },
                            function(){
                              //do nothing here they clicked Cancel
                            }
                          );
                        }
                      );
              
              
                      $("#btnTest").on("click", 
                        function(){
                          clearError();
                          var options = {sha: $("#ServiceVersionList").val()}
                          getRepoFunctionList(options).then(
                            function(functionList){
                              console.log(functionList);
                            },
                            function(err){
                              var msg = err.message || err.statusText
                              showError(msg)
                            } 
                          )    
                        }
                      );
              
              
                      
                      
                      $("#callFlowList").on("change", this.onCallflowListChange)
              
                      $('#assetNew').find(".btnCreateAsset").on("click", function(event){
                        var $modal = $('#assetNew');
                        var modal = bootstrap.Modal.getOrCreateInstance($modal);
                        var data = {
                          FriendlyName: $modal.find("#FriendlyName").val(),
                          ServiceSid : $("#ServiceList").val()
              
                        }
                        createAsset(data).then(
                          function(newAsset){
                            var newAssetVersionData = { 
                              Path: $modal.find("#Path").val(),
                              AssetSid : newAsset.sid,
                              Visibility : "private",
                              Content : JSON.stringify(getCallFlowJson())
                            }
                            // createAssetVersion(newAssetVersionData).then(
                            //   function(newAssetVersion){
                                getAssetList({ServiceSid : $("#ServiceList").val()}).then(
                                  function(assetList){
              
                                    updateServiceList(services);
                                    modal.hide();
                                  },
                                  function(err){
                                    commonData.isValidAccount = false;
                                    var msg = err.message || err.statusText
                                    $modal.find("#NewAssetError").html(msg).show().focus();
                                  }
                                ) 
                            //   },
                            //   function(error){
                            //     commonData.isValidAccount = false;
                            //     var msg = error.message || error.statusText
                            //     $modal.find("#NewAssetError").html(msg).show().focus();
                            //   }
              
                            // )
                             
                          },
                          function(err){
                            commonData.isValidAccount = false;
                            var msg = err.message || err.statusText
                            $modal.find("#NewServiceError").html(msg).show().focus();
                          }
              
                        )
              
                      })
                      
                      
              
                      $('#login').find(".btnLogin").on("click", function(event){
                        var $modal = $('#login');
                        var modal = bootstrap.Modal.getOrCreateInstance($modal);
                        var loginOptions = {
                          accountSid : $modal.find("#AccountSID").val(),
                          authToken : $modal.find("#AuthToken").val()
                        }
                        var ischecked = $modal.find("#AuthTokenSave").prop("checked");
                        if(ischecked === false){
                          localStorage.removeItem('AccountSID');
                          localStorage.removeItem('AuthToken');
                        }
                        getServicesList(loginOptions).then(
                          function(data){
                              commonData.isValidAccount = true;
                              //Successfull login so update Credentials
                              commonData.accountSid = $modal.find("#AccountSID").val();
                              commonData.authToken = $modal.find("#AuthToken").val();
                              var ischecked = $modal.find("#AuthTokenSave").prop("checked");
                              if(ischecked){
                                localStorage.setItem('AccountSID',  $modal.find("#AccountSID").val())
                                localStorage.setItem('AuthToken',  $modal.find("#AuthToken").val())
                              }else{
                                localStorage.removeItem('AccountSID');
                                localStorage.removeItem('AuthToken');
                              }
                              updateServiceList(data);
                              modal.hide();
                          },
                          function(err){
                            commonData.isValidAccount = false;
                            var msg = err.message || err.statusText
                            
                            $modal.find("#assetOpenError").html(msg).show().focus();
                            console.error(msg, err);
                          }
              
                        )
              
                      })
              
                      $("#btnServiceUpgrade").on("click", 
                        function(){
                          clearError();
                          var confirmData = {prompt:"Are you sure you want to Upgrade/Install this Service?", confirmText: "Upgrade"}
                          confirmDialog(confirmData).then(
                            function(){
                              //they Clicked Confirm
                              var $serviceList = $("#ServiceList");
                              var data = {ServiceSid : $serviceList.val(), repoVersionSha: $("#ServiceVersionList").val() };
                              upgradeService(data).then(
                                function(){
                                  getServicesList().then(
                                    function(services){
                                      updateServiceList(services);
                                    },
                                    function(err){
                                      var msg = err.message || err.statusText
                                      showError(msg)
                                    } 
                                  )
                                },
                                function(err){
                                  var msg = err.message || err.statusText
                                  showError(msg)
                                } 
                              )
                            },
                            function(){
                              //do nothing here they clicked Cancel
                            }
                          );
                        }
                      );

		$('#serviceNew').find(".btnCreateService").on("click", function(event){
                        var $modal = $('#serviceNew');
                        var modal = bootstrap.Modal.getOrCreateInstance($modal);
                        
                        var isUiEditableChecked = $modal.find("#UiEditable").prop("checked");
                        var data = {
                          UniqueName : $modal.find("#UniqueName").val(),
                          FriendlyName: $modal.find("#FriendlyName").val(),
                          UiEditable: isUiEditableChecked,
                          IncludeCredentials: true
                        }
                        createService(data).then(
                          function(newService){
                            commonData.ServiceSid = newService.sid;
                            createEnvironment({ServiceSid:newService.sid, UniqueName:"prod"}).then(
                              function(environmentData){
                                commonData.enviromentSid = environmentData.sid;
                                getServicesList().then(
                                  function(services){
                                    
                                    updateServiceList(services);
                                    modal.hide();
                                  },
                                  function(err){
                                    commonData.isValidAccount = false;
                                    var msg = err.message || err.statusText
                                    $modal.find("#NewServiceError").html(msg).show().focus();
                                  }
                                )
                              },
                              function(err){
                                commonData.isValidAccount = false;
                                var msg = err.message || err.statusText
                                $modal.find("#NewServiceError").html(msg).show().focus();
                              }
              
                            )
                              
                          },
                          function(err){
                            commonData.isValidAccount = false;
                            var msg = err.message || err.statusText
                            $modal.find("#NewServiceError").html(msg).show().focus();
                          }
              
                        )
              
                      })
                      
                      $('#assetOpen').find(".btnOpen").on("click", function(event){
                        var $modal = $('#assetOpen');
                        var modal = bootstrap.Modal.getOrCreateInstance($modal)
                        var $selected = $modal.find(".assetList").find(".asset.active");
                        if($selected.length > 0 && $selected.attr("data-sid") != ""){
                          var selectedAsset = $selected.attr("data-sid");
                          var asset = $selected.data();
                          console.log("asset data",asset);
                          var getOptions = {
                            url: asset.links.asset_versions, 
                            headers: {"Authorization": "Basic " + btoa(commonData.accountSid + ":" + commonData.authToken)},
                            type: "GET",
                            data: null
                          }
                          $.get(getOptions).then(
                            function(assetversions){
                              console.log("asset versions data", assetversions);
                              if(assetversions && assetversions.asset_versions && assetversions.asset_versions.length > 0){
                                let assetVersion = assetversions.asset_versions[0]
                                var assetVersionOptions = {
                                  AssetSid:assetVersion.asset_sid,
                                  AssetVersionSid: assetVersion.sid,
                                  ServiceSid: assetVersion.service_sid
                                }
                                getAssetVersion(assetVersionOptions).then(
                                  function(assetversion){
                                    console.log("asset version data", assetversion);
                                    getAssetVersionContent(assetVersionOptions).then(
                                      function(assetversionContent){
                                        console.log("asset version Content", assetversionContent);
                                      },
                                      function(err){
                                        var msg = err.message || err.statusText
                                        $modal.find("#assetOpenError").html(msg).show().focus();
                                        console.error(msg, err);
                                      }
                                    )
                                  },
                                  function(err){
                                    var msg = err.message || err.statusText
                                    $modal.find("#assetOpenError").html(msg).show().focus();
                                    console.error(msg, err);
                                  }
                                )
                              }else{
                                //Andy do something different here like load default 
                                var msg = "Asset has no versions"
                                $modal.find("#assetOpenError").html(msg).show().focus();
                                console.error(msg);
                              }
                            },
                            function(err){
                              var msg = err.message || err.statusText
                              $modal.find("#assetOpenError").html(msg).show().focus();
                              console.error(msg, err);
                            }
                          )
                        }else{
                          var msg = "Please Select a Asset to Load";
                            $modal.find("#assetOpenError").html(msg).show().focus();
                        }
              
                      })
                      $('#assetOpen').on('show.bs.modal', function (event) {
                        var $modal = $(this);
                        
                        $modal.find("#assetOpenError").html("").hide();
                        getAssetsWithVersions({ServiceSid : $("#ServiceList").val()}).then(
                          function(data){
                              var $assetTemplate = $("#templates").find(".assetListTemplate").find(".asset");
                              var $assetList = $modal.find(".assetList");
                              $assetList.empty();
                              $.each(data.assets, function(index, asset) {
                                
                                var $asset = $assetTemplate.clone();
                                $asset.data(asset)
                                $asset.attr("data-sid",asset.sid).attr("aria-controls", asset.friendly_name).text(asset.friendly_name);
                                $assetList.append($asset);
                              });
                              $assetList.find(".asset").on("click", function(evt){
                                $assetList.find(".asset").removeClass("active");
                                $(evt.currentTarget).addClass("active");
                              });
              
                              
                          },
                          function(err){
                            var msg = err.message || err.statusText
                            $modal.find("#assetOpenError").html(msg).show().focus();
                          }
              
                        )
                        
                      })
              
              
                      $('#assetSave').find(".btnSaveAsset").on("click", function(event){
                        var $modal = $('#assetSave');
                        var modal = bootstrap.Modal.getOrCreateInstance($modal)
                        var $selected = $modal.find(".assetList").find(".asset.active");
                        if($selected.length > 0 && $selected.attr("data-sid") != ""){
                          var selectedAsset = $selected.attr("data-sid");
                          var asset = $selected.data();
                          var newAssetVersionData = { 
                              Path: $modal.find("#Path").val(),
                              AssetSid : asset.sid,
                              ServiceSid : asset.service_sid,
                              Visibility : "protected",
                              Content : JSON.stringify(getCallFlowJson())
                            }
                          createAssetVersionTemp(newAssetVersionData).then(
                            function(data){
                              console.log("createAssetsVersionTemp", data);
                            },
                            function(err){
                              var msg = err.message || err.statusText
                              $modal.find("#assetOpenError").html(msg).show().focus();
                              console.error(msg, err);
                            }
                          )
                        }else{
                          var msg = "Please Select a Asset to Load";
                            $modal.find("#assetOpenError").html(msg).show().focus();
                        }
              
                      })
              
                      $('#assetSave').on('show.bs.modal', function (event) {
                        var $modal = $(this);
                        
                        $modal.find("#assetSaveError").html("").hide();
                        getAssetsWithVersions({ServiceSid : $("#ServiceList").val()}).then(
                          function(data){
                              var $assetTemplate = $("#templates").find(".assetListTemplate").find(".asset");
                              var $assetList = $modal.find(".assetList");
                              $assetList.empty();
                              $.each(data.assets, function(index, asset) {
                                var $asset = $assetTemplate.clone();
                                $asset.data(asset)
                                $asset.attr("data-sid",asset.sid).attr("aria-controls", asset.friendly_name).text(asset.friendly_name);
                                $assetList.append($asset);
                              });
                              $assetList.find(".asset").on("click", function(evt){
                                $assetList.find(".asset").removeClass("active");
                                $(evt.currentTarget).addClass("active");
                              });
              
                              
                          },
                          function(err){
                            var msg = err.message || error.statusText
                            $modal.find("#assetOpenError").html(msg).show().focus();
                          }
              
                        )
                        
                      })
              
                      // try{
                      //   let savedAccountSID = localStorage.getItem('AccountSID');
                      //   let savedAuthToken = localStorage.getItem('AuthToken');
                      //   if(savedAccountSID || savedAuthToken){
                      //     commonData.accountSid = savedAccountSID;
                      //     commonData.authToken = savedAuthToken;
                      //     $("#AccountSID").val(savedAccountSID);
                      //     $("#AuthToken").val(savedAuthToken);
                      //     $("#AuthTokenSave").prop("checked", "checked");
                      //   }
                      //   //let savedAuthToken = localStorage.getItem('AuthToken');
                      //   if(savedAccountSID && savedAuthToken){
                      //     getServicesList().then(
                      //       function(data){
                      //         updateServiceList(data);
                      //         commonData.isValidAccount = true;  
                      //       },
                      //       function(err){
                      //         commonData.isValidAccount = false;
                      //       }
                      //     )
                      //   }
                      //   getRepoTags().then(
                      //     function(data){
                      //       this.updateServiceVersionList(data);
                      //     },
                      //     function(err){
                      //       var msg = err.message || err.msg || err;
                      //       var stack = err.stack || ""
                      //       this.showError(msg + "/n------------------/n" + stack);
                      //     }
                      //   )
                      //   let savedData = localStorage.getItem('TwilioData');
                      //   if(savedData){
                      //     parsedData = JSON.parse(savedData);
                      //     this.loadSavedData(parsedData);
                          
                      //   }
                      // }catch(ex){
                      //   this.showError(ex.message + "/n------------------/n" + ex.stack);
                      // }
                        resolve();
                    }
                )
              });
        }

        init(){
            
            return new Promise((resolve, reject) => {
                
                this.loadTemplate().then(
                    () => {
                        
                        this.bind().then(
                            () => {
                                resolve();
                            },
                            (err) => {
                                reject(err)
                            }

                        );
                    },
                    (err) =>{
                        reject(err)
                    } 
                )
            })
        }
       
    }
    
    export {twiliocallflow}
    export default twiliocallflow

   
