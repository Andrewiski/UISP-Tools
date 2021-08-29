/**
 * @ngdoc directive
 * @name ctm-settings.ctmSettings
 * @function
 *
 * @description
 * This directive will allow a user to view and edit system settings
 */
if (typeof ctmSettingsModule != 'undefined') {
    ctmSettingsModule.directive('ctmSettings', ['$log',
        function ($log) {
                return {
                    restrict: 'AE',
                    templateUrl: '/Scripts/ctmangular/Global/js/components/settings/settings.tpl.html',
                    controller: 'settingsController',
                    replace: false,
                    scope: false,
                    link: function (scope, elm, atts, c) {
                        if ($.deui.isClientSideDebugging())
                            $log.debug("SETTINGS LINK");

                        //var theArry = [
                        //    { "nodeID": 1, "nodeName": "Item 1" },
                        //    {"nodeID": 2, "nodeName": "Item 2", "childNodes": [
                        //        { "nodeID": "2a", "nodeName": "Item 2a" },
                        //        {"nodeID": "2b", "nodeName": "Item 2b", "childNodes": [
                        //                { "nodeID": "2aa", "nodeName": "Item 2aa" },
                        //                { "nodeID": "2bb", "nodeName": "Item 2bb", "href": "http://www.google.com" }
                        //            ]
                        //        },
                        //    ]
                        //    },
                        //    {"nodeID": 3, "nodeName": "Item 3", "childNodes": [
                        //            { "nodeID": "3a", "nodeName": "Item 3a" },
                        //            { "nodeID": "3b", "nodeName": "Item 3b", "raiseEvent": "alertIt" }
                        //        ]
                        //    }
                        //];

                        //$('#divMenu').bind('alertIt', function (parms) {
                        //    alert('Function raised: alertIt');
                        //}).ipodmenu({
                        //    title: "Title",
                        //    jsonData: theArry,
                        //    width: 300,
                        //    height: 400,
                        //    minimizeOnLeaf: false,
                        //    debug: true
                        //});
                    }
                };
            }
        ]);
}
