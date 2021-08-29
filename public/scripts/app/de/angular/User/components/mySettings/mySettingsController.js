/*
This is the user settings widget controller definition
*/
if (typeof ctmMySettingsModule != 'undefined') {

    ctmMySettingsModule.controller('mySettingsController', ['$rootScope', '$scope', '$log', 'deui', 
                function ($rootScope, $scope, $log, $timeout, deui, DTOptionsBuilder) {
                    $scope.doneLoading = false;

                    $log.debug("mySettingsController init");

                    var objResult = $.deui.common.settings.user;

                    //This will be an array of strings
                    var UserSettingGroupNames = [];

                    //Create a distinct list of group names
                    $.each(objResult, function(index, value) {
                        if ($.inArray(value.SettingGroup, UserSettingGroupNames) === -1) {
                            UserSettingGroupNames.push(value.SettingGroup);
                        }
                    });

                    $scope.UserSettingGroups = [];

                    //Now generate the nested JSON
                    for (var i = 0; i < UserSettingGroupNames.length; i++) {
                        var thisSettingGroup = UserSettingGroupNames[i];

                        var thisGroup = {
                            "UserSettingGroup": thisSettingGroup
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
                        $scope.UserSettingGroups.push(thisGroup);
                    }
                        
                    //Create a CLONE of the settings
                    //$scope.originalUserSettingGroups = jQuery.extend(true, {}, $scope.UserSettingGroups);
                    //$scope.originalUserSettingGroups = $scope.UserSettingGroups.slice(0);
                    $scope.originalUserSettingGroups = $.deui.clone($scope.UserSettingGroups);

                    
                    //Set the global user setting
                    $scope.setUserSetting = function (settingGroup, settingName, settingType, newValue) {

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
                        for (var i = 0; i < $scope.UserSettingGroups.length; i++) {
                            var strSettingGroup = $scope.UserSettingGroups[i].UserSettingGroup;
                            var arrySettings = $scope.UserSettingGroups[i].Settings;

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
                            for (var i = 0; i < $scope.UserSettingGroups.length; i++) {
                                var strSettingGroup = $scope.UserSettingGroups[i].UserSettingGroup;
                                var arrySettings = $scope.UserSettingGroups[i].Settings;

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
                                        $scope.setUserSetting(thisSetting.SettingGroup, thisSetting.SettingName, thisSetting.SettingValue);

                                        //Now go update this setting
                                        deui.postResource({
                                            resource: "UserSetting_Upsert",
                                            parms: {
                                                "SettingGroup": thisSetting.SettingGroup,
                                                "SettingName": thisSetting.SettingName,
                                                "SettingValue": thisSetting.SettingValue,
                                                "SettingType": thisSetting.SettingType
                                            },
                                            aiTokenName: "global"
                                        }).then(function (objResult) {
                                            if (objResult.length > 0 && objResult[0].success) {

                                                $log.debug('Setting ' + $scope.updateCount + ' updating');

                                                $.logToConsole(objResult[0].success);

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

                                                $.logToConsole(objResult.error);
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
                    This function is used to return the original user setting based on a group name and a setting name
                    */
                    $scope.getOriginalSetting = function (settingGroup, settingName) {
                        $log.debug("settingsController getOriginalSetting");

                        for (var i = 0; i < $scope.originalUserSettingGroups.length; i++) {
                            var strOriginalSettingGroup = $scope.originalUserSettingGroups[i].UserSettingGroup;
                            var arryOriginalSettings = $scope.originalUserSettingGroups[i].Settings;

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
                    $scope.doneLoading = true;

                }
        ]);
}