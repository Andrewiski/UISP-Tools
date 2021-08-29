(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceCustomerSearchController', [
            '$scope', '$state', '$log', 'invoiceService', function ($scope, $state, $log,  invoiceService) {
                $log.debug("invoicesListAdminController init");
                
                $scope.doneLoading = false;
            
                $scope.invoiceServiceCommon = invoiceService.common;

                //if we are using state then assume we will be bouncing around so stick our data we want to persist there

                
                var getDefaultPersistedValues = function () {
                    if ($state.current && $state.current.data && $state.current.data.invoiceCustomerList) {
                        return $state.current.data.invoiceCustomerList;
                    } else {
                        return { customerSearch: { name: '', customerStatus:-1 }, customerSearchList: [] }
                    }
                    
                };
                
                $scope.persistedData = getDefaultPersistedValues();


                $scope.refreshCustomers = function () {
                    $scope.doneLoading = false;
                    //if ($scope.persistedData.customerSearch.name) {
                        invoiceService.getCustomersSearch($scope.persistedData.customerSearch.name).then(
                            function (customers) {
                                $scope.persistedData.customerSearchList = customers;
                                $scope.doneLoading = true;
                            }
                        )
                    //}
                }
                //Init Happens Here
            
                invoiceService.init().then(function () {
                    $scope.doneLoading = true;
                })
                

            }
        ]);

})();