(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceListController', [
            '$scope', '$log', '$state', '$location', '$window', 'invoiceService', function ($scope, $log, $state, $location, $window, invoiceService) {
                $log.debug("invoicesListController init");
                $scope.invoiceListDoneLoading = false;
                var startDate = new Date();
                startDate.setDate(1)
                startDate.setMonth(startDate.getMonth() - 1);
                var invoiceListRequest = {
                    invoiceStatusId: -1,
                    invoiceTypeId: 1,
                    startDate: null,
                    stopDate: null,
                    customerGuid: null,
                    userInfoGuid: null
                };
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

                

                if ($scope.invoiceListRequest != null) {
                    invoiceListRequest = $.extend(true, invoiceListRequest, $scope.$eval($scope.invoiceListRequest))
                } else {
                    invoiceListRequest = $.extend(true, invoiceListRequest, {
                        customerGuid: customerGuid,
                        userInfoGuid: userInfoGuid
                    });
                }
                
                

                 
                
                var searchData = $location.search();
                

               
                $scope.selectedData = { invoiceGuid: null };
                $scope.payInvoiceData = { invoiceGuids:[], total:0.0, invoicePaymentInfo: {}, isValid:true};
                $scope.showInvoicePayment = false;
                $scope.showInvoice = false;
                
                $scope.hidePaySelected = function () {
                    $scope.showInvoicePayment = false;
                }
                
                $scope.showPaySelected = function () {
                    $scope.showInvoice = false;
                    $scope.showInvoicePayment = true;
                    $scope.showInvoicePaymentSuccess = false;
                    $scope.invoiceListDonePaying = true;
                    $scope.payInvoiceData.total = 0.0;
                    $scope.payInvoiceData.invoiceGuids = [];
                    angular.forEach($scope.invoiceList, function (value, key) {
                        if (value.selected == true) {
                            $scope.payInvoiceData.total = $scope.payInvoiceData.total + value.total;
                            $scope.payInvoiceData.invoiceGuids.push(value.invoiceGuid);  
                        }
                    });
                }
                $scope.sendPaymentReminder = function(){
                    $state.go('admin.sendPaymentReminder', { customerGuid: $state.params.customerGuid });
                }
                $scope.viewInvoice = function (invoiceGuid) {
                    $scope.selectedData.invoiceGuid = invoiceGuid;
                    //$scope.showInvoice = true;
                    //$scope.showInvoicePayment = false;
                    if ($scope.isAdminMode == true) {
                        $state.go('admin.invoices.invoice', { invoiceGuid: invoiceGuid });
                    } else {
                        $state.go('user.invoice', { invoiceGuid: invoiceGuid });
                    }
                }
                $scope.selectAllUnpaidToggle = false;
                $scope.selectAllUnpaid = function () {
                    if ($scope.showInvoicePayment == false) {
                        $scope.selectAllUnpaidToggle = !$scope.selectAllUnpaidToggle;
                        angular.forEach($scope.invoiceList, function (value, key) {
                            if (value.invoiceStatusId == 0) {
                                value.selected = $scope.selectAllUnpaidToggle;
                            }

                        });
                    }
                }

                $scope.paySelectedInvoices = function () {
                    
                    $scope.showInvoicePaymentSuccess = false;
                    $scope.showInvoicePaymentError = false;
                    $scope.invoiceListDonePaying = false;
                    $scope.payInvoiceData.redirectReturnUrl = $location.absUrl();
                    if ($scope.isAdminMode) {
                        $scope.payInvoiceData.customerGuid =  $state.params.customerGuid
                    }
                    invoiceService.payInvoices($scope.payInvoiceData).then(
                        function (result) {
                            $scope.payInvoiceResult = result;
                            if (result.success == true) {
                                $scope.showInvoicePaymentSuccess = true;
                                $scope.showInvoicePayment = false;
                                if (result.needsRedirect) {
                                    $log.info("redirecting to " + result.redirectUrl);
                                    $window.location.href = result.redirectUrl;
                                }
                                refreshInvoiceList();
                            } else {
                                $scope.invoicePaymentError = result.error.message;
                                //$scope.invoicePaymentError = $scope.invoicePaymentError.replace("\n", "<br/>")
                                $scope.showInvoicePaymentError = true;
                                $scope.invoiceListDonePaying = true;
                            }
                        },
                        function (result) {
                            $scope.showInvoicePaymentError = true;
                            if (result.error && result.error.message) {
                                $scope.invoicePaymentError = result.error.message;
                            } else if (result.message) {
                                $scope.invoicePaymentError = result.message;
                            } else {
                                $scope.invoicePaymentError = "An error has occured";
                            }
                            //$scope.invoicePaymentError = $scope.invoicePaymentError.replace("\n","<br/>")
                            $scope.invoiceListDonePaying = true;
                        }
                    );
               }

                var refreshInvoiceList = function () {
                    $log.debug("invoicesListController refreshInvoiceList");
                    $scope.invoiceListDoneLoading = false;
                       return invoiceService.getInvoiceList(invoiceListRequest).then(
                        function (Invoices) {
                            $log.debug("invoicesListController refreshInvoiceList got Invoices");
                            $scope.invoiceList = Invoices;
                            $scope.invoiceListDoneLoading = true;
                        });
                }
                $scope.$on('invoiceListRefresh', function (event, data) {
                    $log.debug("invoiceListRefresh Event Detected");
                    refreshInvoiceList();
                });
                invoiceService.init().then(
                    function () {
                        $scope.getStaticName = invoiceService.getStaticName;
                        if (searchData.invoiceStatusId) {
                            $scope.invoiceListRequest.invoiceStatusId = parseInt(searchData.invoiceStatusId);
                        }
                        if (searchData.startDate) {
                            $scope.invoiceListRequest.startDate = searchData.startDate;
                        }
                        if (searchData.stopDate) {
                            $scope.invoiceListRequest.stopDate = searchData.stopDate;
                        }
                        
                        refreshInvoiceList().then(function(){
                            if (searchData.select == "true") {
                                $scope.selectAllUnpaid();
                            }
                            if (searchData.pay == "true") {
                                $scope.showPaySelected();
                            }   
                        });
                });
            }
        ]);

})();