(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoicePaymentReminderController', [
            '$state', '$rootScope', '$scope', '$log', '$timeout', 'invoiceService', '$location', function ($state, $rootScope, $scope, $log, $timeout, invoiceService, $location) {
                $log.debug('invoicePaymentReminder init');
                $scope.email = {
                    to: '',
                    cc: '',
                    bcc: '',
                    subject: '',
                    body:''
                }
                var baseUrl = $location.protocol() + "://" + $location.host();
                if ($location.protocol() == "http" & $location.port() != "80") {
                    baseUrl += ":" + $location.port()
                }
                if ($location.protocol() == "https" & $location.port() != "443") {
                    baseUrl += ":" + $location.port()
                }
                $scope.data = {
                    customer: null,
                    invoiceList: null,
                    baseUrl: baseUrl
                };
                $scope.doneLoading = false;
                $scope.sendEmail = function () {
                    $scope.hasError = false;
                    $scope.doneLoading = false;
                    invoiceService.sendEmailAdmin($scope.email).then(
                        function (result) {
                            if ($rootScope.previousState && $rootScope.previousState.name) {
                                $state.go($rootScope.previousState, $rootScope.previousParams)
                            } else {
                                $state.go('admin.invoicecustomers.customer', { customerGuid: $state.params.customerGuid })
                            }
                            $scope.doneLoading = true;
                            
                        },
                        function (result) {

                            $scope.errorMessage = result.stackTrace;
                            $scope.hasError = true;
                            $scope.doneLoading = true;
                        }
                    )
                }
                $scope.urlEncode = function (data) {
                    return encodeURIComponent(data);
                }
                invoiceService.init().then(function () {
                    $scope.getStaticName = invoiceService.getStaticName;
                    if ($state.params.customerGuid) {
                        invoiceService.getCustomerByGuidAdmin($state.params.customerGuid).then(
                            function (customer) {
                                $scope.data.customer = customer;
                                $log.debug('invoicePaymentReminder customerGuid: ' + customer.customerGuid);
                                var invoiceListRequest = {
                                    invoiceStatusId: 0,
                                    invoiceTypeId: 1,
                                    startDate: null,
                                    stopDate: null,
                                    customerGuid: customer.customerGuid,
                                    userInfoGuid: null
                                }
                                $scope.email.to = $scope.data.customer.billingContact.email;
                                $scope.email.bcc = "info@digitalexample.com";
                                $scope.email.subject = "Digital Example - Payment Reminder"
                                if (customer.userInfo && customer.userInfo.aspNetUserId) {
                                    invoiceService.getAdminUser(customer.userInfo.aspNetUserId).then(
                                        function (aspUser) {
                                            $log.debug("invoicePaymentReminder got aspUser");
                                            $scope.data.aspUser = aspUser;
                                            invoiceService.getInvoiceList(invoiceListRequest).then(
                                            function (Invoices) {
                                                $log.debug("invoicePaymentReminder got Invoices");
                                                var total = 0.0;
                                                for (var key in Invoices) {
                                                    var invoice = Invoices[key];
                                                    total = total + invoice.total;
                                                };
                                                $scope.data.total = total;
                                                $scope.data.invoiceList = Invoices;
                                                $scope.doneLoading = true;

                                            });
                                        }
                                    )
                                } else {
                                    $scope.email.body = 'No User found Connected to this Customer!';
                                }
                                
                                    
                            }
                        )

                    } else {
                        $scope.doneLoading = true;
                    }
                    

                })
                //We Add a Watch for after Render is complete to set the email.body
                $scope.$on('EmailBodyRenderComplete',
                    function () {
                        $log.debug("invoicePaymentReminder received EmailBodyRenderComplete Event");
                        //use timeout so it gets added to the bottom of the stack after render complete
                        $timeout(function () {
                            $scope.email.body = $('.emailBody').html();
                        }, 0);
                        
                        
                    });
            }
        ]);

})();