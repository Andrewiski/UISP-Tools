(function () {

    'use strict';
    /**
     * @ngdoc directive
     * @name deapp.admin
     * @function
     *
     * @description
     * This directive will generate a widget that will allow a user to perform Admin functions
     */
    angular.module('deapp').directive('admin', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/Scripts/de/angular/Admin/components/admin/admin.tpl.html',
                controller: 'adminController',
                replace: false,
                scope:false,
                link: function (scope, elm, atts, c) {
                   $.logToConsole("adminController LINK");
                }
            };
        }
    ]);
})();