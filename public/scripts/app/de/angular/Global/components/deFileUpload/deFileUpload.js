(function () {

    'use strict';
    /**
     * @ngdoc directive
     * @name deapp.ctmUpload
     * @function
     *
     * @description
     * This directive will generate a widget that will allow a user to upload a file
     */
    angular.module('deapp').directive('deFileUpload', ['$log', 'FileUploader',
        function ($log, FileUploader) {
            $.logToConsole('deUpload Directive Function Called');
            return {
                restrict: 'AE',
                templateUrl: '/Scripts/de/Global/components/deFileUpload/deUpload.tpl.html',
                controller: 'deFileUploadController',
                replace: false,
                scope: {
                    options: '='
                    },
                link: function (scope, elm, atts, c) {
                    $log.debug("deUpload LINK");
                },
                compile: function (element, attributes) {
                    $.logToConsole('deUpload Directive compile function Called');
                    return {
                        pre: function (scope, element, attributes, controller, transcludeFn) {
                            $log.debug("deUpload PRE COMPILE");
                        },
                        post: function (scope, element, attributes, controller, transcludeFn) {
                            $log.debug("deUpload POST COMPILE");
                        }
                    }
                }
            };
        }
    ]);
})();