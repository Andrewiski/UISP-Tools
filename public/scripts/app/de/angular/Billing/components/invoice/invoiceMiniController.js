(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceMiniController', [
            '$scope', 'invoiceService', function ($scope, invoiceService) {

                $scope.invoiceServiceCommon = invoiceService.common;
                $scope.invoice = invoiceService.getSampleInvoice();
                
            }
        ]);

})();