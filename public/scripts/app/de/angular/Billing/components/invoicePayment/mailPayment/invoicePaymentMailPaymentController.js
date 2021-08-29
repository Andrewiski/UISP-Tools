(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoicePaymentMailPaymentController', [
            '$scope', 'invoiceService', function ($scope, invoiceService) {
                $.logToConsole('invoicePaymentMailPaymentController init');

                $scope.invoiceServiceCommon = invoiceService.common;
                invoiceService.init().then(function () {
                    if ($scope.invoicePayment.mailPayment == undefined || $scope.invoicePayment.mailPayment == null) {
                        $scope.invoicePayment.mailPayment = { checkNumber: '', merchantSettings: invoiceService.common.merchantSettings };
                    }
                    $scope.doneLoading = true;
                })
                


                /*
                 * if (String.IsNullOrWhiteSpace(MerchantSettings.CompanyName) == false)
            {
                this.MailPaymentPayableTo = MerchantSettings.CompanyName;
            }
            else
            {
                this.MailPaymentPayableTo = MerchantSettings.FirstName + " " + MerchantSettings.LastName; 
            }
            this.MailPaymentToAddress = MerchantSettings.AddressLine1;
            this.MailPaymentToAddress2 = MerchantSettings.AddressLine2;
            this.MailPaymentToAddress3 = MerchantSettings.AddressCity + ", " + MerchantSettings.AddressState + " " + MerchantSettings.ZipCode;
                 */
                
            }
        ]);

})();