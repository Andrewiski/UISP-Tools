(function () {

    'use strict';
    /**
     * @ngdoc directive
     * @name deapp.address
     * @function
     *
     * @description
     * This directive will generate a widget that will allow a user to enter an Address
     */
    angular.module('deapp').directive('pageContent', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/Scripts/de/angular/PageContent/components/pageContent/pageContent.tpl.html',
                controller: 'pageContentController',
                replace: false,
                scope: {
                    pageContentGuid: "@"
                }
            };
        }
    ]);
})();