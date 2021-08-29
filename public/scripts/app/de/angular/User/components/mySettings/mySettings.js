/*
This is the settings widget directive definition
*/
if (typeof ctmMySettingsModule != 'undefined') {
    ctmMySettingsModule.directive('ctmMySettings', [
            function () {
                return {
                    restrict: 'AE',
                    templateUrl: '/Scripts/ctmangular/Global/js/components/mySettings/mySettings.tpl.html',
                    controller: 'mySettingsController',
                    replace: false,
                    scope: false,
                    link: function (scope, elm, atts, c) {
                        $.logToConsole("mySettingsController LINK");
                    }
                };
            }
        ]);
}
