/*
This is the settings widget controller definition
*/
if (typeof ctmSettingsModule != 'undefined') {
    ctmSettingsModule.controller('settingsController', ['$rootScope', '$scope', '$log', '$timeout', 'deui',  'DTOptionsBuilder',
                function ($rootScope, $scope, $log, $timeout, deui,  DTOptionsBuilder) {
                    $scope.doneLoading = false;

                    $log.debug("settingsController init");

                    //Now we will turn the settings return value into a nested structure
                    /*  
                    [
                        {"SystemSettingsID":"1","SystemSettingsGUID":"5c6b5e8a-377f-46dc-aeca-3dc86af224a5","SettingGroup":"Logging","SettingName":"Client Side Logging", "SettingValue":"true","SettingType":"boolean","SettingValueSet":"","ts":"AAAAAAAAUME="},

                        {"SystemSettingsID":"2","SystemSettingsGUID":"ed04d5b0-4842-4d78-9ae2-b907d3bd70a7","SettingGroup":"Logging","SettingName":"Database Logging","SettingValue":"false","SettingType":"boolean","SettingValueSet":"","ts":"AAAAAAAANak="},
                            
                        {"SystemSettingsID":"4","SystemSettingsGUID":"a17d6828-279b-4ca3-94e8-a226a93a1977","SettingGroup":"Debugging","SettingName":"Client Side Debugging","SettingValue":"true","SettingType":"boolean","SettingValueSet":"","ts":"AAAAAAAAULY="},
                            
                        {"SystemSettingsID":"5","SystemSettingsGUID":"90f93a25-2fb5-434f-85b5-fe1569d76a42","SettingGroup":"Debugging","SettingName":"Database Logging","SettingValue":"false","SettingType":"boolean","SettingValueSet":"","ts":"AAAAAAAANaw="}
                    ]

                    TURNS TO

                    [
                        {"SystemSettingGroup":"Logging", "Settings":[{setting A},{setting B}]},
                        {"SystemSettingGroup":"Debugging", "Settings":[{setting C},{setting D}]}
                    ]

                    */

                    var objResult = $.deui.common.settings.system;

                    $log.debug(objResult.length + " settings found");

                    //This will be an array of strings
                    var systemSettingGroupNames = [];

                    //Create a distinct list of group names
                    $.each(objResult, function (index, value) {
                        if ($.inArray(value.SettingGroup, systemSettingGroupNames) === -1) {
                            systemSettingGroupNames.push(value.SettingGroup);
                        }
                    });

                    $scope.systemSettingGroups = [];

                    //Now generate the nested JSON
                    for (var i = 0; i < systemSettingGroupNames.length; i++) {
                        var thisSettingGroup = systemSettingGroupNames[i];

                        var thisGroup = {
                            "SystemSettingGroup": thisSettingGroup
                        };

                        var settings = [];

                        for (var j = 0; j < objResult.length; j++) {
                            var thisSetting = objResult[j];

                            if (thisSettingGroup == thisSetting.SettingGroup) {
                                thisSetting.htmlID = 'input-' + thisSetting.SettingName.replace(/\s/g, '_');

                                settings.push(thisSetting);

                            }
                        }

                        thisGroup["Settings"] = settings;
                        $scope.systemSettingGroups.push(thisGroup);
                    }

                    //Create a CLONE of the settings
                    //$scope.originalSystemSettingGroups = jQuery.extend(true, {}, $scope.systemSettingGroups);
                    //$scope.originalSystemSettingGroups = $scope.systemSettingGroups.slice(0);
                    $scope.originalSystemSettingGroups = $.deui.clone($scope.systemSettingGroups);


                    //Set the global system setting
                    $scope.setSystemSetting = function (settingGroup, settingName, newValue) {

                        //Loop the settings and look for the setting you want
                        for (var i = 0; i < $.deui.common.settings.system.length; i++) {
                            var objSetting = $.deui.common.settings.system[i];

                            if (objSetting.SettingGroup == settingGroup && objSetting.SettingName == settingName) {
                                objSetting.SettingValue = newValue;
                            }
                        }

                        return null;
                    }


                    $scope.updateSettings = function () {
                        $log.debug("settingsController updateSettings");

                        $scope.updateCount = 0;

                        $scope.doneLoading = false;

                        var blnSomethingChanged = false;

                        //GET A COUNT OF UPDATED SETTINGS
                        //Iterate the settings
                        for (var i = 0; i < $scope.systemSettingGroups.length; i++) {
                            var strSettingGroup = $scope.systemSettingGroups[i].SystemSettingGroup;
                            var arrySettings = $scope.systemSettingGroups[i].Settings;

                            //Iterate the settings for this group
                            for (var j = 0; j < arrySettings.length; j++) {
                                var thisSetting = arrySettings[j];

                                //Now fetch the original setting for the same Group and Name
                                var originalSetting = $scope.getOriginalSetting(strSettingGroup, thisSetting.SettingName);

                                //Look for a changed value
                                if (originalSetting.SettingValue != thisSetting.SettingValue) {
                                    $scope.updateCount++;
                                }
                            }
                        }

                        $log.debug($scope.updateCount + ' settings to update');

                        if ($scope.updateCount > 0) {

                            //Iterate the settings
                            for (var i = 0; i < $scope.systemSettingGroups.length; i++) {
                                var strSettingGroup = $scope.systemSettingGroups[i].SystemSettingGroup;
                                var arrySettings = $scope.systemSettingGroups[i].Settings;

                                //Iterate the settings for this group
                                for (var j = 0; j < arrySettings.length; j++) {
                                    var thisSetting = arrySettings[j];

                                    //Now fetch the original setting for the same Group and Name
                                    var originalSetting = $scope.getOriginalSetting(strSettingGroup, thisSetting.SettingName);

                                    //Look for a changed value
                                    if (originalSetting.SettingValue != thisSetting.SettingValue) {
                                        $log.debug('Updating ' + thisSetting.SettingName + ' to ' + thisSetting.SettingValue);

                                        blnSomethingChanged = true;

                                        ////WE HAVE TO DO THIS FOR THE CLIENT SIDE LOG PROVIDER
                                        //if (thisSetting.SettingGroup == "Debugging" && thisSetting.SettingName == "Client Side Debugging") {
                                        //    $log.debugEnabled($.deui.stringToBoolean(thisSetting.SettingValue));
                                        //}

                                        //Update the original to the new (so we don't update it again)
                                        originalSetting.SettingValue = thisSetting.SettingValue;

                                        //Update the local copy
                                        $scope.setSystemSetting(thisSetting.SettingGroup, thisSetting.SettingName, thisSetting.SettingValue);

                                        //Now go update this setting
                                        deui.postResource({
                                            resource: "SystemSetting_Update",
                                            parms: {
                                                "SettingGroup": thisSetting.SettingGroup,
                                                "SettingName": thisSetting.SettingName,
                                                "SettingValue": thisSetting.SettingValue
                                            },
                                            aiTokenName: "global"
                                        }).then(function (objResult) {
                                            if (objResult.length > 0 && objResult[0].success) {

                                                $log.debug('Setting ' + $scope.updateCount + ' updating');



                                                $scope.updateCount--;

                                                //If we are done updating all settings
                                                if ($scope.updateCount == 0) {
                                                    //Now go update cache
                                                    deui.postResource({
                                                        url: $.deui.adminServiceURL,
                                                        action: "refresh open api",
                                                        resource: "SystemSettings",
                                                        aiTokenName: "global"
                                                    }).then(function (objResult) {
                                                        $log.debug("Server Cache Refreshed");

                                                        $scope.doneLoading = true;

                                                        new PNotify({
                                                            title: 'Success',
                                                            text: 'Update Complete',
                                                            type: 'notice',
                                                            history: false,
                                                            delay: 1000
                                                        });
                                                    });
                                                }

                                                $log.debug(objResult[0].success);

                                            } else {
                                                $scope.updateCount--;

                                                new PNotify({
                                                    title: 'Error',
                                                    text: objResult.error,
                                                    type: 'error',
                                                    history: false,
                                                    delay: 1000
                                                });

                                                //If we are done updating all settings
                                                if ($scope.updateCount == 0) {
                                                    $scope.doneLoading = true;
                                                }

                                                $log.error(objResult.error);
                                            }

                                        });

                                    }
                                }
                            }
                        }   //if ($scope.updateCount > 0)

                        //Iteration Complete
                        if (!blnSomethingChanged) {
                            $scope.doneLoading = true;

                            new PNotify({
                                title: 'Warning',
                                text: 'No Update - Nothing Changed',
                                type: 'notice',
                                history: false,
                                delay: 1000
                            });
                        }

                    }

                    /*
                    This function is used to return the original system setting based on a group name and a setting name
                    */
                    $scope.getOriginalSetting = function (settingGroup, settingName) {
                        $log.debug("settingsController getOriginalSetting");

                        for (var i = 0; i < $scope.originalSystemSettingGroups.length; i++) {
                            var strOriginalSettingGroup = $scope.originalSystemSettingGroups[i].SystemSettingGroup;
                            var arryOriginalSettings = $scope.originalSystemSettingGroups[i].Settings;

                            //Iterate the settings for this group
                            for (var j = 0; j < arryOriginalSettings.length; j++) {
                                var thisOriginalSetting = arryOriginalSettings[j];

                                if (thisOriginalSetting.SettingGroup == strOriginalSettingGroup && thisOriginalSetting.SettingName == settingName) {
                                    return thisOriginalSetting;
                                }
                            }
                        }
                    }

                    //ALL DONE            
                    $timeout(function () { $scope.doneLoading = true }, 1);
                    

                }
    ]);
}