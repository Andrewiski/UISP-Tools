(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoicePaymentController', [
            '$scope',  'invoiceService', '$http', function ($scope,  invoiceService, $http) {
                $.logToConsole('invoicepaymentController init');
                
                $scope.invoiceServiceCommon = invoiceService.common;
                invoiceService.init().then(function () {
                    $scope.invoicePaymentDoneLoading = true;
                })

                if (!$scope.isAdminMode) {
                    $scope.isAdminMode = "false";
                } 
                $scope.getStaticName = invoiceService.getStaticName;

                $scope.invoicePaymentTypesFilter = function (value, index, array) {
                    if ($scope.isAdminMode == "true") {
                        return true;
                    } else {
                        if (value.isCheckOutEnabled == true) {
                            return true;
                        }
                    }
                    return false;
                }

                if (!$scope.invoicePayment) {
                    $scope.invoicePayment = {};
                }
                //if (!$scope.invoicePayment.creditCard) {
                //    $scope.invoicePayment.creditCard = {fullName:null, cardNumber:null,expDate:null, cvc:null};
                //}

               
                
            }
        ]);

})();