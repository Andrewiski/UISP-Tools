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
    angular.module('deapp').directive('pageContentEditor', ['$log',
        function ($log) {
            $.logToConsole("pageContentEditor init");
            return {
                restrict: 'A',
                templateUrl: '/Scripts/de/angular/PageContent/components/PageContentEditor/pageContentEditor.tpl.html',
                controller: 'pageContentEditorController',
                replace: false,
                scope: {
                    pageContentGuid: "@"
                }
            };
        }
    ])
})();