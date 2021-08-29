(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceRecurrenceListAdminController', [
            '$scope', '$log', 'invoiceService', function ($scope, $log,  invoiceService) {
                $log.debug("invoicesRecurrenceListAdminController init");
                
                $scope.invoiceRecurrenceListDoneLoading = false;
            
                $scope.invoiceServiceCommon = invoiceService.common;

                

                $scope.invoiceRecurrenceListRequest = { invoiceRecurrenceStatusId: -1, customerGuid: null };

                $scope.customerSearchList = [];
                $scope.refreshCustomers = function (nameSearch) {
                    invoiceService.getCustomersSearch(nameSearch).then(
                        function (customers) {
                            $scope.customerSearchList = customers;
                        }
                    )
                }

             

            $scope.getStaticName = invoiceService.getStaticName;

           
                

            $scope.refreshInvoiceRecurrences = function () {

                $scope.invoiceRecurrenceListDoneLoading = false;

                invoiceService.getInvoiceRecurrenceList($scope.invoiceRecurrenceListRequest).then(
                    function (InvoiceRecurrences) {
                        $scope.invoiceRecurrenceList = Invoices;
                        $scope.invoiceRecurrenceListDoneLoading = true;
                    }
                )
            }

            //Init Happens Here
            
            invoiceService.init().then(function () {
                $scope.invoiceRecurrenceStatusListSearch = angular.copy(invoiceService.common.statics.invoiceRecurrenceStatusList);
                $scope.invoiceRecurrenceStatusListSearch.push({ invoiceRecurrenceStatusId: -1, name: "All" });
                $scope.invoiceRecurrenceListDoneLoading = true;
            })
                

            }
        ]);

})();