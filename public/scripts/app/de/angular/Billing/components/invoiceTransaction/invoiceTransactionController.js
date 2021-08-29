(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceTransactionController', [
            '$scope', '$state', 'invoiceService', function ($scope, $state, invoiceService) {
                
                var refreshInvoiceTransaction = function(){
                    if ($scope.invoiceTransactionGuid) {
                        $scope.invoiceTransactionDoneLoading = false;
                        invoiceService.getInvoiceTransactionByGuid($scope.invoiceTransactionGuid).then(
                            function (invoiceTransaction) {

                                $scope.invoiceTransaction = invoiceTransaction;
                                //$scope.selectedCustomer.customer = invoice.customer;
                                $scope.invoiceTransactionDoneLoading = true;
                            }
                        )
                    } else {
                        $scope.invoiceTransactionDoneLoading = true;
                    }
                }
                if (!$scope.invoiceTransactionGuid && $state.params.invoiceTransactionGuid) {
                    $scope.invoiceTransactionGuid = $state.params.invoiceTransactionGuid;
                } else {
                    $scope.$watch('invoiceTransactionGuid', function (val) {
                        refreshInvoiceTransaction();
                    })
                }

                $scope.getInvoiceTransactionStatus = function (invoice) {
                    if (invoice && invoice.invoiceTermTypeId) {
                        return invoiceService.getStaticName('invoiceTermTypeList', invoice.invoiceTermTypeId);
                    } else {
                        return null;
                    }
                }

                invoiceService.init().then(
                    function () {
                        $scope.getStaticName = invoiceService.getStaticName;
                        refreshInvoiceTransaction();
                    }
                )
                $scope.isRefund = invoiceService.isInvoiceTransactionRefund;
                $scope.isPaid = invoiceService.isInvoiceTransactionPaid;
            }
        ]);

})();