(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceController', [
            '$scope', '$state', 'invoiceService', function ($scope, $state, invoiceService) {
                $scope.getInvoiceSubTotal = invoiceService.getInvoiceSubTotal;
                $scope.getInvoiceTotal = invoiceService.getInvoiceTotal;
                $scope.getContactFormatedName = invoiceService.getContactFormatedName;
                $scope.invoiceServiceCommon = invoiceService.common;
                var refreshInvoice = function(){
                    if ($scope.invoiceGuid) {
                        $scope.invoiceDoneLoading = false;
                        invoiceService.getInvoiceByGuid($scope.invoiceGuid).then(
                            function (invoice) {

                                $scope.invoice = invoice;
                                //$scope.selectedCustomer.customer = invoice.customer;
                                $scope.invoiceDoneLoading = true;
                            }
                        )
                    } else {
                        $scope.invoiceDoneLoading = true;
                    }
                }
                if (!$scope.invoiceGuid && $state.params.invoiceGuid) {
                    $scope.invoiceGuid = $state.params.invoiceGuid;
                } else {
                    $scope.$watch('invoiceGuid', function (val) {
                        refreshInvoice();
                    })
                }
                invoiceService.init().then(
                    function () {
                        refreshInvoice();
                    }

                )
                $scope.addInvoiceItem = function () {

                }
                $scope.printInvoice = function () {
                    window.print();
                    //var html = $('.invoiceInfo').html();
                    //var popupWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
                    //popupWindow.document.open();
                    //popupWindow.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()">' + html + '</html>');
                    //popupWindow.print();
                    //popupWindow.close();
                }
                $scope.getInvoiceTerms = function (invoice) {
                    if (invoice && invoice.invoiceTermTypeId) {
                        return invoiceService.getStaticName('invoiceTermTypeList', invoice.invoiceTermTypeId);
                    } else {
                        return null;
                    }
                }
                $scope.isOverdue = invoiceService.isInvoiceOverdue;
                $scope.isPaid = invoiceService.isInvoicePaid;
            }
        ]);

})();