(function () {

    'use strict';

    angular.module('deapp').controller('deAddressController', ['$rootScope', '$scope', '$log', '$timeout', '$q', 'deui', 'DTOptionsBuilder', 'logging', 'addressService',
        function ($rootScope, $scope, $log, $timeout, $q, deui,  DTOptionsBuilder, logging, addressService) {
            $scope.doneLoading = false;

            $log.debug("deAddressController init");

            
            $scope.queryCities = queryCities;
            //Since UnitType and StreetSuffix could be on a page a couple of times it may be better to move this to a single instance provider later Andy           
            $scope.addressServiceCommonData = addressService.commonData;

            $q.all([
                   addressService.initCommonData().then(function () {
                       //set the default State, this should proboly default to the current users state but for now lets default to Colorado
                       $scope.address.state = _.find(results, function (state) {
                           return state.StateName === 'Colorado'
                       });
                   })
            ]).then(
                   function () {
                       $scope.doneLoading = true;
                   }
            );

            
                        
             

            function queryCities(cityName) {
                $log.debug('addressController queryCities');
                return addressService.getCitiesForState($scope.address.state, cityName);
            }


            

            
        }
    ]);
})();