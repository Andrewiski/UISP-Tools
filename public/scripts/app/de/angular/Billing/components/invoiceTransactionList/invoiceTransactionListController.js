(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceTransactionListController', [
            '$scope', '$log', '$state', '$location', '$window', 'invoiceService', function ($scope, $log, $state, $location, $window, invoiceService) {
                $log.debug("invoicesTransactionListController init");
                $scope.invoiceTransactionListDoneLoading = false;
                var startDate = new Date();
                startDate.setDate(1)
                startDate.setMonth(startDate.getMonth() - 1);
                var customerGuid;
                var userInfoGuid;
                if ($state.params.customerGuid) {
                    customerGuid = $state.params.customerGuid;
                    userInfoGuid = null;
                } else {
                    if ($state.params.userInfoGuid) {
                        userInfoGuid = $state.params.userInfoGuid;
                    } else {
                        if ($.deui.common.login.isUserLoggedIn && $scope.isAdminMode == false) {
                            userInfoGuid = $.deui.common.login.userInfo.userInfoGuid;
                        }
                    }
                }
            
                
                var invoiceTransactionListRequest = {
                    invoiceTransactionStatusId: -1,
                    invoiceTransactionTypeId: -1,
                    invoiceTransactionServiceTypeId: -1,
                    invoicePaymentTypeId: -1,
                    startDate: null,
                    stopDate: null,
                    customerGuid: null,
                    userInfoGuid: null
                };

                if ($scope.invoiceTransactionListRequest != null) {
                    invoiceTransactionListRequest = $.extend(true, invoiceTransactionListRequest, $scope.$eval($scope.invoiceTransactionListRequest))
                } else {
                    invoiceTransactionListRequest = $.extend(true, invoiceTransactionListRequest, {
                        customerGuid: customerGuid,
                        userInfoGuid: userInfoGuid
                    });
                }
                
                var searchData = $location.search();

                $scope.showInvoiceTransaction = false;
               
                $scope.viewInvoiceTransaction = function (invoiceTransactionGuid) {
                    $scope.selectedData.invoiceTransactionGuid = invoiceTransactionGuid;
                    if ($scope.isAdminMode == true) {
                        $state.go('admin.invoices.invoiceTransaction', { invoiceTransactionGuid: invoiceTransactionGuid });
                    } else {
                        $state.go('user.invoiceTransaction', { invoiceTransactionGuid: invoiceTransactionGuid });
                    }
                }
                

                var refreshInvoiceTransactionList = function () {
                    $log.debug("invoicesTransactionListController refreshInvoiceTransactionList");
                    $scope.invoiceTransactionListDoneLoading = false;
                    return invoiceService.getInvoiceTransactionList(invoiceTransactionListRequest).then(
                        function (InvoiceTransactions) {
                            $log.debug("invoicesTransactionListController refreshInvoiceTransactionList got InvoiceTransactions");
                            $scope.invoiceTransactionList = InvoiceTransactions;
                            $scope.invoiceTransactionListDoneLoading = true;
                        });
                }
                $scope.$on('invoiceTransactionListRefresh', function (event, data) {
                    $log.debug("invoiceTransactionListRefresh Event Detected");
                    refreshInvoiceTransactionList();
                });
                invoiceService.init().then(
                    function () {
                        $scope.getStaticName = invoiceService.getStaticName;
                        if (searchData.invoiceTransactionStatusId) {
                            $scope.invoiceTransactionListRequest.invoiceTransactionStatusId = parseInt(searchData.invoiceTransactionStatusId);
                        }
                        if (searchData.startDate) {
                            $scope.invoiceTransactionListRequest.startDate = searchData.startDate;
                        }
                        if (searchData.stopDate) {
                            $scope.invoiceTransactionListRequest.stopDate = searchData.stopDate;
                        }
                        
                        refreshInvoiceTransactionList();
                });
            }
        ]);

})();