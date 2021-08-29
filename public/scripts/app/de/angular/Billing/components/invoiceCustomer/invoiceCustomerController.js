(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceCustomerController', [
            '$scope', '$http', '$state',  'invoiceService', 'modalService', function ($scope, $http, $state, invoiceService, modalService ) {
                $.logToConsole('invoiceCustomerController init');
               
                $scope.data = { customer: null };
                $scope.copyBillingAddress = function () {
                    $.logToConsole("copyBillingAddress");
                    //$.extend($scope.data.customer.shippingContact, $scope.data.customer.billingContact);
                    invoiceService.contactCopy($scope.data.customer.shippingContact, $scope.data.customer.billingContact);
                }

                $scope.getStaticName = invoiceService.getStaticName;
                $scope.getUserInfoFormatedName = function (userInfo) {
                    if (userInfo) {
                        return userInfo.lastName + ', ' + userInfo.firstName;
                    } else {
                        return "Not Selected";
                    }

                }

                $scope.userInfoSearchList = [];
                $scope.refreshUserInfos = function (nameSearch) {
                    if ($scope.isAdminMode == true) {
                        $.deui.getUserInfosSearch({ data: { "nameSearch": nameSearch } }).then(
                            function (userInfos) {
                                $scope.userInfoSearchList = userInfos;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        )
                    }
                }
                $scope.enableUserInfoSearch = function () {
                    $scope.userInfoSearchEnabled = !$scope.userInfoSearchEnabled
                    if ($scope.userInfoSearchEnabled == true) {
                        $scope.$broadcast('Customer_UserInfo_Search');
                    }
                };

                $scope.userInfoSelected = function ($item, $model, customer) {
                    if ($scope.isAdminMode == true) {
                        $.logToConsole("userInfoSelected");
                        //customer.userInfoGuid = $item.userInfoGuid;
                        //customer.userInfo = $item;
                        customer.userInfo = angular.extend({}, $item);
                        //$scope.selectedUser = $item;
                        $scope.userInfoSearchEnabled = false;
                    }
                    
                }

                $scope.addCustomerInvoicePayment = function () {

                    var emptyCustomerInvoicePayment = { createdDate: new Date(), isInEditMode: true, isDeleted: false, isDefault: false, invoicePayment: { isNew: true, invoicePaymentTypeId: 1 } };
                    $scope.data.customer.customerInvoicePaymentCons.push(emptyCustomerInvoicePayment);

                }
                var cancelCustomerInvoicePayment = {};
                $scope.editCustomerInvoicePayment = function (customerInvoicePayment) {
                    
                    //Copy Existing customerInvoicePayment to   cancelCustomerInvoicePayment so if we Cancel we can Roll Back
                    angular.copy(customerInvoicePayment,cancelCustomerInvoicePayment);
                    customerInvoicePayment.isInEditMode = true;
                    
                    
                }

                $scope.saveCustomerInvoicePayment = function (customerInvoicePayment) {
                    $.logToConsole('saveCustomerInvoicePayment : ' + $scope.data.customer.customerGuid);
                    invoiceService.saveCustomerInvoicePaymentInfo({ invoicePayment: customerInvoicePayment, customerGuid: $scope.data.customer.customerGuid }).then(
                        function (result) {
                            angular.copy(result,customerInvoicePayment);
                            customerInvoicePayment.isInEditMode = false;
                        });
                    
                }

                $scope.cancelEditCustomerInvoicePayment = function (customerInvoicePayment) {
                    $.logToConsole('cancelEditCustomerInvoicePayment : ' + customerInvoicePayment.invoicePaymentGuid);
                    if (customerInvoicePayment.invoicePayment.isNew == true) {
                        customerInvoicePayment.isDelete = true;  //just hide it
                        customerInvoicePayment.isInEditMode = false;
                    } else {
                        angular.copy(cancelCustomerInvoicePayment, customerInvoicePayment);
                        customerInvoicePayment.isInEditMode = false;
                    }

                }

                $scope.executeCustomerInvoiceRecurrence = function (customerInvoiceRecurrence) {

                    $.deui.dialogs.confirmOk({
                        header: "Execute Recurrence Task",
                        text: "Generate Invoices?"

                    }).then(function () {
                        $.logToConsole('executeCustomerInvoiceRecurrence : ' + $scope.data.customer.customerGuid + ':' + customerInvoiceRecurrence.invoiceRecurrenceGuid);

                        invoiceService.executeCustomerInvoiceRecurrence({ invoiceRecurrenceGuid: customerInvoiceRecurrence.invoiceRecurrenceGuid, customerGuid: $scope.data.customer.customerGuid }).then(
                       function (result) {
                           $.logToConsole('executeCustomerInvoiceRecurrence Complete : ' + $scope.data.customer.customerGuid + ':' + customerInvoiceRecurrence.invoiceRecurrenceGuid);
                           $scope.$broadcast('invoiceListRefresh', {
                               eventReason: 'executeCustomerInvoiceRecurrence' 
                           });
                       });

                    })

                }

                $scope.deleteCustomerInvoicePayment = function (customerInvoicePayment) {

                    $.deui.dialogs.confirmDelete({
                            header: "Delete Payment",
                            text:"Delete Payment?"
                            
                    }).then(function () {
                        $.logToConsole('deleteCustomerInvoicePayment : ' + $scope.data.customer.customerGuid + ':' + customerInvoicePayment.customerInvoicePaymentGuid);
                        
                        invoiceService.deleteCustomerInvoicePaymentInfo({ customerInvoicePaymentGuid: customerInvoicePayment.customerInvoicePaymentGuid, customerGuid: $scope.data.customer.customerGuid }).then(
                       function (result) {
                           customerInvoicePayment.isInEditMode = false;
                           customerInvoicePayment.isDeleted = true;
                           if (!$scope.$$phase) {
                               $scope.$apply();
                           }                                
                       });
                        
                    })
                    
                }

                $scope.defaultCustomerInvoicePayment = function (customerInvoicePayment) {
                    customerInvoicePayment.isDefault = true;
                }
                
                $scope.invoiceServiceCommon = invoiceService.common;
                invoiceService.init().then(function () {
                    if ($scope.isAdminMode == true) {
                        if ($state.params.customerGuid) {
                            $scope.invoiceCustomerDoneLoading = false;
                            invoiceService.getCustomerByGuidAdmin($state.params.customerGuid).then(
                                function (customer) {
                                    $scope.data.customer = customer;
                                    $.logToConsole('customerGuid: ' + customer.customerGuid);
                                    $scope.invoiceCustomerDoneLoading = true;
                                    //if (!$scope.$$phase) {
                                    //    $scope.$apply();
                                    //}
                                }
                            )

                        } else {
                            $scope.invoiceCustomerDoneLoading = true;
                        }
                    } else {
                        $scope.invoiceCustomerDoneLoading = false;
                        invoiceService.getCustomerForLoggedInUser().then(
                            function (customer) {
                                $scope.data.customer = customer;
                                $.logToConsole('customerGuid: ' + customer.customerGuid);
                                $scope.invoiceCustomerDoneLoading = true;
                                //if (!$scope.$$phase) {
                                //    $scope.$apply();
                                //}
                            }
                        )
                    }

                })

                $scope.saveCustomer = function () {
                    $.logToConsole('invoiceContactController.saveCustomer');
                    $scope.invoiceCustomerDoneLoading = false;

                    
                    invoiceService.saveCustomer($scope.data.customer).then(
                        function (customer) {
                            $scope.data.customer = customer;
                            $scope.invoiceCustomerDoneLoading = true;
                            if ($scope.onSave) {
                                $scope.onSave(customer);
                            }
                            //if ($state.params.customerGuid && $state.params.customerGuid == 'new') {
                            //    $state.params.customerGuid = customer.customerGuid;
                            //    $state.go(".", {customerGuid:customer.customerGuid});
                            //}
                            $state.params.customerGuid = customer.customerGuid;
                            if ($scope.isAdminMode) {
                                $state.go('admin.invoicecustomers.customer', { customerGuid: customer.customerGuid });
                            } else {
                                $state.go('user.customer');
                            }
                            //if (!$scope.$$phase) {
                            //    $scope.$apply();
                            //}
                            //will go to a parent state.
                            //This will break the AdminInvoiceCustomer need to see why I am going to the parent state
                            // I assume in a dialog
                            //$state.go('^');
                        }
                    );

                }

                $scope.cancel = function () {

                    $.logToConsole('invoiceContactController.cancel');
                    //$state.go('^'); //will go to a parent state.
                    $state.go('admin.invoicecustomers.customer',{ customerGuid: $state.params.customerGuid });
                }


                $scope.addCustomerInvoiceRecurrence = function () {

                    var emptyinvoiceRecurrence = { createdDate: new Date(), isInEditMode: true, isDeleted: false, isDefault: false, invoicePayment: { isNew: true, invoicePaymentTypeId: 1 }, recurrencePattern: 'RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15' };
                    $scope.data.customer.invoiceRecurrences.push(emptyinvoiceRecurrence);
                    $scope.editCustomerInvoiceRecurrence(emptyinvoiceRecurrence)

                }
                var cancelInvoiceRecurrence = {};
                $scope.editCustomerInvoiceRecurrence = function (invoiceRecurrence) {


                    //Copy Existing customerInvoicePayment to   cancelCustomerInvoicePayment so if we Cancel we can Roll Back
                    angular.copy(invoiceRecurrence, cancelInvoiceRecurrence);
                    invoiceRecurrence.isInEditMode = true;
                    modalService.showModal(
                        {
                            scopeProperties: { invoiceRecurrence: invoiceRecurrence },
                            serviceOptions: {
                                title: "Edit Recurrence",
                                templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomer/invoiceCustomerRecurrence.modal.edit.tpl.html',
                                buttons: [
                                    { text: "Save", "class": "btn btn-primary", onClick: $scope.saveCustomerInvoiceRecurrence, closeModal: true, resolve: true },
                                    { text: "Cancel", "class": "btn btn-warning", onClick: $scope.cancelEditCustomerInvoiceRecurrence, closeModal: true, resolve: false }]
                            }
                        })
                    


                }

                $scope.saveCustomerInvoiceRecurrence = function (options) {
                    var invoiceRecurrence = options.invoiceRecurrence
                    $.logToConsole('saveCustomerInvoiceRecurrence : ' + $scope.data.customer.customerGuid);
                    //clear the Invoice object as we will refetch it with the ID
                    invoiceRecurrence.invoice = null;
                    //We need to rebuild the recurrencePattern using the RRRULE:
                    /*
                        DTSTART:20120115T000000Z
                        DTEND:20120115T010000Z
                        RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15 
                     
                     */
                    var rPattern = "DTSTART:" + moment(invoiceRecurrence.startDate).format("YYYYMMDD") + "T000000Z\n";
                    if (invoiceRecurrence.endDate) {
                        rPattern = rPattern + "DTEND:" + moment(invoiceRecurrence.endDate).format("YYYYMMDD") + "T000000Z\n";
                    } else {
                        rPattern = rPattern + "DTEND:" + moment(invoiceRecurrence.startDate).format("YYYYMMDD") + "T000000Z\n";
                    }
                    //we have to Clean Up the RRULE else it will add unwanted values and crash our c# engine
                    switch (invoiceRecurrence.rrule.options.freq) {
                        case 0:
                            //Year
                            invoiceRecurrence.rrule.options.dtstart = null;
                            invoiceRecurrence.rrule.options.byhour = null;
                            invoiceRecurrence.rrule.options.byminute = null;
                            invoiceRecurrence.rrule.options.bysecond = null;
                            invoiceRecurrence.rrule.options.wkst = null;
                            break;
                        case 1:
                            //Month
                            invoiceRecurrence.rrule.options.dtstart = null;
                            invoiceRecurrence.rrule.options.byhour = null;
                            invoiceRecurrence.rrule.options.byminute = null;
                            invoiceRecurrence.rrule.options.bysecond = null;
                            invoiceRecurrence.rrule.options.bymonth = null;
                            invoiceRecurrence.rrule.options.wkst = null;
                            break;
                    }

                    rPattern = rPattern + "RRULE:" + RRule.optionsToString(invoiceRecurrence.rrule.options);
                    invoiceRecurrence.recurrencePattern = rPattern 
                    //clear the Status object as it will also be refetched with the ID
                    invoiceRecurrence.invoiceRecurrenceStatus = null;
                    invoiceService.saveCustomerInvoiceRecurrence({ invoiceRecurrence: invoiceRecurrence, customerGuid: $scope.data.customer.customerGuid }).then(
                        function (result) {
                            angular.forEach($scope.data.customer.invoiceRecurrences, function (item, i) {
                                if (item.invoiceRecurrenceGuid == invoiceRecurrence.invoiceRecurrenceGuid) {
                                    //angular.merge(invoiceRecurrence, result);
                                    angular.merge(item, result);
                                    //invoiceRecurrence.isInEditMode = false;
                                    item.isInEditMode = false;
                                }
                            })
                            
                            
                            //if (!$scope.$$phase) {
                            //    $scope.$apply();
                            //}
                        });

                }

                $scope.cancelEditCustomerInvoiceRecurrence = function (options) {
                    var invoiceRecurrence = options.invoiceRecurrence
                    $.logToConsole('cancelEditCustomerInvoiceRecurrence : ' + invoiceRecurrence.invoiceRecurrenceGuid);
                    if (invoiceRecurrence.isNew == true) {
                        invoiceRecurrence.isDelete = true;  //just hide it
                        invoiceRecurrence.isInEditMode = false;
                    } else {
                        angular.copy(cancelInvoiceRecurrence, invoiceRecurrence);
                        invoiceRecurrence.isInEditMode = false;
                    }

                }

                $scope.deleteCustomerInvoiceRecurrence = function (invoiceRecurrence) {

                    $.deui.dialogs.confirmDelete({
                        header: "Delete Payment",
                        text: "Delete Payment?"

                    }).then(function () {
                        $.logToConsole('deleteCustomerInvoiceRecurrence : ' + $scope.data.customer.customerGuid + ':' + invoiceRecurrence.invoiceRecurrenceGuid);
                        invoiceRecurrence.isDeleted = true;
                        invoiceService.deleteCustomerRecurrence({ invoiceRecurrenceGuid: invoiceRecurrence.invoiceRecurrenceGuid, customerGuid: $scope.data.customer.customerGuid }).then(
                       function (result) {
                           angular.extend(invoiceRecurrence, result);
                           invoiceRecurrence.isInEditMode = false;
                           if (!$scope.$$phase) {
                               $scope.$apply();
                           }
                       });

                    })

                }

            }
        ]);

})();