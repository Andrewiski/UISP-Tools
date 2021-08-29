(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceAdminController', [
            '$scope', '$state', '$location', 'invoiceService', 'modalService', 'deui',   function ($scope, $state, $location, invoiceService, modalService, deui) {
                
                //$scope.loading = true;
               // $scope.invoiceCommon = invoiceService.common;
                //$scope.invoice = $scope.invoiceCommon.invoice;
                //invoiceService.init().then(
                //    function () {
                //        $scope.loading = false;
                //    }
                //)

                //Init Happens Here
                $scope.invoiceDoneLoading = false;

                if ($state.params.invoiceGuid && $state.params.invoiceGuid == 'new') {
                    $scope.isNew = true;
                } else {
                    $scope.isNew = false;
                }

                $scope.billingContactIsEditMode = !!$scope.isNew;
                $scope.shippingContactIsEditMode = !!$scope.isNew;
                $scope.invoicePaymentIsEditMode = !!$scope.isNew;

                $scope.customerSearchEnabled = !!$scope.isNew;
                $scope.enableCustomerSearch = function () {
                    $scope.customerSearchEnabled = !$scope.customerSearchEnabled
                    if ($scope.customerSearchEnabled == true) {
                        $scope.$broadcast('Invoice_Customer_Search');
                    }
                };

                $scope.customerSelected = function ($item, $model, customer) {
                    $.logToConsole("customerSelected");

                    var copyCustomer = function () {
                        //The customer search doesn't bring back invoicePaymentInfo so we request it async
                        invoiceService.getCustomerByGuidAdmin($model.customerGuid).then(function (fullCustomer) {
                            invoiceService.contactCopy($scope.invoice.billingContact, fullCustomer.billingContact);
                            invoiceService.contactCopy($scope.invoice.shippingContact, fullCustomer.shippingContact);
                            //invoiceService.invoicePaymentCopy($scope.invoice.invoicePayment, fullCustomer.invoicePayment);
                            //we need to reset the guids as they can't be reused 
                            $scope.invoice.billingContact.contactGuid = null;
                            $scope.invoice.shippingContact.contactGuid = null;
                            //$scope.invoice.invoicePayment.invoicePaymentGuid = null;
                            $scope.invoice.customer = fullCustomer;
                            //if (!$scope.$$phase) {
                            //    $scope.$apply();
                            //}
                        })
                        
                    }

                    if ($scope.isNew) {
                        copyCustomer();
                    } else {
                        modalService.showDialogYesNo("Update Billing Contact, Shipping Contact, InvoicePayment from Customer?", "Update Invoice").then(
                            copyCustomer
                        )
                    }
                    
                    
                    $scope.customerSearchEnabled = false;
                }


                $scope.customerSearchList = [];
                $scope.refreshCustomers = function (nameSearch) {
                    invoiceService.getCustomersSearch(nameSearch).then(
                        function (customers) {
                            $scope.customerSearchList = customers;
                            //if (!$scope.$$phase) {
                            //    $scope.$apply();
                            //}
                        }
                    )
                }


                $scope.productSearchEnabledList = {};
                $scope.productSearchEnabled = function (index) {
                    if ($scope.productSearchEnabledList[index] == undefined) {
                        $scope.productSearchEnabledList[index] = false;
                    }
                    return $scope.productSearchEnabledList[index]
                };
                $scope.selectedProduct = null;
                $scope.selectedCustomer = {customer:null};
                $scope.invoiceServiceCommon = invoiceService.common;
                invoiceService.init().then(function () {
                    if ($state.params.invoiceGuid) {
                        invoiceService.getInvoiceByGuidAdmin($state.params.invoiceGuid).then(
                            function (invoice) {
                                
                                //fix the InvoiceDate Issue
                                if ($state.params.invoiceGuid == 'new') {
                                    //Make sure we shift the Date to Local Date incase we are crossing UTC Local Date Shift Barrier
                                    invoice.invoiceDate = new Date();
                                }
                                invoice.invoiceDate = moment(invoice.invoiceDate).format("MM/DD/YYYY");

                                $scope.invoice = invoice;
                                
                                $scope.selectedCustomer.customer = invoice.customer;
                                $scope.invoiceDoneLoading = true;
                                //if (!$scope.$$phase) {
                                //    $scope.$apply();
                                //}
                            }
                        )
                    } else {
                        $scope.invoiceDoneLoading = true;
                    }

                })
                $scope.getInvoiceSubTotal = invoiceService.getInvoiceSubTotal;
                $scope.getInvoiceTax = invoiceService.getInvoiceTax;
                $scope.getInvoiceTotal = invoiceService.getInvoiceTotal;
                $scope.getContactFormatedName = invoiceService.getContactFormatedName;
                $scope.addInvoiceItem = function () {
                    $.logToConsole("addInvoiceItem");
                    if ($scope.invoice) {
                        var myNewInvoiceItem = invoiceService.getInvoiceItem();
                        var newlength = $scope.invoice.invoiceItems.push(myNewInvoiceItem);
                        myNewInvoiceItem.isNew = true;
                        $scope.productSearchEnabledList[newlength - 1] = true;

                    }
                }

                $scope.isDeleted = function (value, index, array) {
                    if (value && value.invoiceItemStatusId == 0) {
                        return false;
                    } else {
                        return true;
                    }
                }

                $scope.removeInvoiceItem = function (invoiceItem, index) {
                    $.logToConsole("removeInvoiceItem");
                    if ($scope.invoice && $scope.invoice.invoiceItems) {
                        invoiceItem.invoiceItemStatusId = 0;
                    }
                }

                $scope.enableProductSearch = function (index) {
                    if ($scope.productSearchEnabledList[index] != undefined) {
                        $scope.productSearchEnabledList[index] = !$scope.productSearchEnabledList[index];
                    } else {
                        $scope.productSearchEnabledList[index] = false;
                    }
                    if ($scope.productSearchEnabledList[index] == true) {
                        $scope.$broadcast('InvoiceItem_ProductNumber_' + index);
                    }
                }
                $scope.productSelected = function ($item, $model, invoiceItem, $index) {
                    $.logToConsole("productSelected");
                    invoiceItem.productNumber = $model.productNumber;
                    invoiceItem.name = $model.itemName;
                    invoiceItem.description = $model.productDescription;
                    invoiceItem.price = $model.price;
                    invoiceItem.taxExempt = $model.taxExempt;
                    invoiceItem.isPackage = false;
                    invoiceItem.isItemCounted = true;
                    invoiceItem.isItemTotaled = true;
                    invoiceItem.isPackageItem = false;
                    invoiceItem.productGuid = $model.productGuid
                    $scope.enableProductSearch($index);
                }
                $scope.refreshProducts = function (nameSearch) {
                    invoiceService.getProductsSearch(nameSearch).then(
                        function (products) {
                            $scope.productSearchList = products;
                        }
                    )
                }


                $scope.copyBillingAddress = function () {
                    $.logToConsole("copyBillingAddress");
                    invoiceService.contactCopy($scope.invoice.shippingContact, $scope.invoice.billingContact);
                }

                var ProcessSaveAdminResponse = function (saveAdminInvoiceResponse) {
                    if (saveAdminInvoiceResponse.saveSuccess == true) {
                        saveAdminInvoiceResponse.invoice.invoiceDate = moment(saveAdminInvoiceResponse.invoice.invoiceDate).format("MM/DD/YYYY");
                        $scope.invoice = saveAdminInvoiceResponse.invoice;
                        if ($state.params.invoiceGuid == 'new') {
                            $state.params.invoiceGuid = saveAdminInvoiceResponse.invoice.invoiceGuid;
                            var url = $location.url();
                            $location.url(url.replace('new', saveAdminInvoiceResponse.invoice.invoiceGuid));
                        } else {
                            $scope.invoiceDetailsForm.$setPristine();
                        }
                    }
                    if (saveAdminInvoiceResponse.saveSuccess == false) {
                        //We had an error durring payment display the payment errors so they can be corrected'

                    }
                    
                    //Change the url so it now has the InvoiceGuid
                }

                $scope.saveAdminInvoice = function () {
                    $.logToConsole("saveAdminInvoice");
                    invoiceService.saveAdminInvoice($scope.invoice).then(ProcessSaveAdminResponse, ProcessSaveAdminResponse);
                }
                //$scope.editCustomer= function(customer){
                //    $.logToConsole("editCustomer");

                //    invoiceService.showEditCustomerDialog(customer).then(function(updatedCustomer){
                //        $scope.invoice.customer = updatedCustomer;
                //    })                    
                //}
            }
        ]);

})();