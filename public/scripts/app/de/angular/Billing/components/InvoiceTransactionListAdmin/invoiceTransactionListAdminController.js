(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceTransactionListAdminController', [
            '$scope', '$log', '$location', 'invoiceService', function ($scope, $log, $location,  invoiceService) {
                $log.debug("invoicesTransactionListAdminController init");
                
                $scope.invoiceTransactionListDoneLoading = false;
            
                $scope.invoiceServiceCommon = invoiceService.common;

                

                $scope.invoiceTransactionListRequest = { invoiceTransactionStatusId: -1, customerGuid: null };

                var searchData = $location.search();
                if (searchData.invoiceTransactionStatusId) {
                    $scope.invoiceTransactionListRequest.invoiceTransactionStatusId = parseInt(searchData.invoiceTransactionStatusId);
                }
                if (searchData.startDate) {
                    $scope.invoiceTransactionListRequest.startDate = searchData.startDate;
                }
                if (searchData.stopDate) {
                    $scope.invoiceTransactionListRequest.stopDate = searchData.stopDate;
                }
                if (searchData.customerGuid) {
                    $scope.invoiceTransactionListRequest.customerGuid = searchData.customerGuid;
                }  

                $scope.customerSearchList = [];
                $scope.refreshCustomers = function (nameSearch) {
                    invoiceService.getCustomersSearch(nameSearch).then(
                        function (customers) {
                            $scope.customerSearchList = customers;
                        }
                    )
                }

             

            $scope.getStaticName = invoiceService.getStaticName;

           
                

            $scope.refreshInvoiceTransactions = function () {

                $scope.invoiceTransactionListDoneLoading = false;
                //Set the Search Params So we can BookMark and return 
                $location.search("invoiceTransactionStatusId", $scope.invoiceTransactionListRequest.invoiceTransactionStatusId);
                $location.search("customerGuid", $scope.invoiceTransactionListRequest.customerGuid);
                //$location.search("startDate", $scope.invoiceTransactionListRequest.startDate);
                //$location.search("stopDate", $scope.invoiceTransactionListRequest.stopDate);
                invoiceService.getInvoiceTransactionList($scope.invoiceTransactionListRequest).then(
                    function (InvoiceTransactions) {
                        $scope.invoiceTransactionList = InvoiceTransactions;
                        $scope.invoiceTransactionListDoneLoading = true;
                    }
                )
            }

            //Init Happens Here
            
            invoiceService.init().then(function () {
                $scope.invoiceTransactionStatusListSearch = angular.copy(invoiceService.common.statics.invoiceTransactionStatusList);
                $scope.invoiceTransactionStatusListSearch.push({ invoiceTransactionStatusId: -1, name: "All" });
                if ($scope.invoiceTransactionListRequest.customerGuid) {
                    invoiceService.getInvoiceTransactionList($scope.invoiceTransactionListRequest).then(
                        function (InvoiceTransactions) {
                            $scope.invoiceTransactionList = InvoiceTransactions;
                            $scope.invoiceTransactionListDoneLoading = true;
                        }
                    )
                } else {
                    $scope.invoiceTransactionListDoneLoading = true;
                }
            })
                

            }
        ]);

})();