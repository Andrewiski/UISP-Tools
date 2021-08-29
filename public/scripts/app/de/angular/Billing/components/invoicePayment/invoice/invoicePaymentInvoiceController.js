(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoicePaymentInvoiceController', [
            '$scope', 'invoiceService', function ($scope, invoiceService) {
                $.logToConsole('invoicePaymentCreditCardController init');
                $scope.currentDate = new Date();
                // Functions
                if ($scope.invoicePayment.invoice == undefined || $scope.invoicePayment.invoice == null) {
                    $scope.invoicePayment.invoice = { emailAddress: ''};
                }
                $scope.invoiceServiceCommon = invoiceService.common;
                invoiceService.init().then(function () {
                    $scope.doneLoading = true;
                })
                
            }
        ]);

})();