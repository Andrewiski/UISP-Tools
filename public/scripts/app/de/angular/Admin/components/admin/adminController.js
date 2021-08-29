(function () {

    'use strict';
    /**
     * @ngdoc directive
     * @name deapp.adminController
     * @function
     *
     * @description
     * This Controller will controler a widget that will allow a user to perform Admin functions
     */
    angular.module('deapp').controller('adminController', ['$scope', '$q', 'deui', 
        function ($scope, $q, deui) {
            $scope.doneLoading = false;

            $.logToConsole("adminController init");
            $scope.doneLoading = true;
            
        }
    ]);
})();