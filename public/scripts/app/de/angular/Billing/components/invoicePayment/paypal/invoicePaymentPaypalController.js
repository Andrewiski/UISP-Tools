(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoicePaymentPaypalController', [
            '$scope', 'invoiceService', function ($scope, invoiceService) {
                $.logToConsole('invoicePaymentPaypalController init');

                $scope.invoiceServiceCommon = invoiceService.common;
                invoiceService.init().then(function () {
                    if ($scope.invoicePayment.paypal == undefined || $scope.invoicePayment.paypal == null) {
                        $scope.invoicePayment.paypal = { };
                    }
                    $scope.doneLoading = true;
                })
                
                
            }
        ]);

})();