(function () {

    'use strict';

    angular.module('deapp').controller('emailAddressController', ['$scope', 
        function ( $scope ) {
           
            $scope.emailAddressVisited = false;
            $.logToConsole("emailAddressController init");

        }
    ]);
})();