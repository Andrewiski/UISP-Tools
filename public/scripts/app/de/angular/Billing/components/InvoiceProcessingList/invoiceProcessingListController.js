(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceProcessingListController', [
            '$scope', '$log', '$location', 'invoiceService', function ($scope, $log, $location, invoiceService) {


                $log.debug("invoiceProcessingList init");    
                $scope.invoiceProcessingListDoneLoading = true;
                $scope.invoiceServiceCommon = invoiceService.common;
                $scope.getStaticName = invoiceService.getStaticName;

                $scope.refreshInvoiceTransactions = function () {

                    $scope.invoiceProcessingListDoneLoading = false;
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

            }
        ]);

})();