(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoicePaymentCreditCardController', [
            '$scope', 'invoiceService', function ($scope, invoiceService) {
                $.logToConsole('invoicePaymentCreditCardController init');
                
                // Functions
                $scope.validateCreditCardNumber = validateCreditCardNumber;
                $scope.validateCreditCardNumberReset = validateCreditCardNumberReset;

                $scope.validateCreditCardExpDate = validateCreditCardExpDate;
                $scope.validateCreditCardExpDateReset = validateCreditCardExpDateReset;

                $scope.validateCreditCardCode = validateCreditCardCode;
                $scope.validateCreditCardCodeReset = validateCreditCardCodeReset;

               
                $scope.invoiceServiceCommon = invoiceService.common;
                invoiceService.init().then(function () {
                    $scope.doneLoading = true;
                })
                if ($scope.invoicePayment.creditCard == undefined || $scope.invoicePayment.creditCard == null) {
                    $scope.invoicePayment.creditCard = { nameOnCard: '', creditCardNumber: '', creditCardExp: '', creditCardCode: '', isValid: true };
                } 
                
                
                

                function validateCreditCardNumber() {
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCardNumber');
                    var isValid = invoiceService.validateCreditCardNumber($scope.invoicePayment.creditCard.creditCardNumber);

                    //if (cardNumber.length > 0) {
                    //    $scope.creditCardValidationError = !isValid;
                    //}
                    //$scope.invoicePaymentCreditCardForm.cardNumber.$setDirty();
                    //$scope.invoicePaymentCreditCardForm.cardNumber.$setValidity("numberFormat", isValid);

                    if (isValid) {
                        setCardType();
                    }
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCard isValid=' + isValid);
                    $scope.invoicePayment.creditCard.isValid = isValid;
                };



                function validateCreditCardNumberReset() {
                    //$scope.creditCardValidationError = false;
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCardNumberReset');
                    //$scope.invoicePaymentCreditCardForm.cardNumber.$setValidity("numberFormat", true);
                    //$scope.invoicePaymentCreditCardForm.cardNumber.$setPristine();
                }


                function validateCreditCardExpDate() {
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCardExpDate');
                    var isValid = invoiceService.validateCreditCardExpirationDate($scope.invoicePayment.creditCard.creditCardExp);
                    $scope.invoicePaymentCreditCardForm.expDate.$setDirty();
                    $scope.invoicePaymentCreditCardForm.expDate.$setValidity("numberFormat", isValid);
                    $scope.invoicePayment.creditCard.isValid = isValid;
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCardExpDate isValid=' + isValid);
                };



                function validateCreditCardExpDateReset() {
                    //$scope.creditCardValidationError = false;
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCardExpDateReset');
                    $scope.invoicePaymentCreditCardForm.expDate.$setValidity("numberFormat", true);
                    $scope.invoicePaymentCreditCardForm.expDate.$setPristine();
                }


                function validateCreditCardCode() {
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCardCode');
                    var isValid = invoiceService.validateCreditCardCode($scope.invoicePayment.creditCard.creditCardCode);
                   
                    
                    $scope.invoicePaymentCreditCardForm.cvc.$setDirty();
                    $scope.invoicePaymentCreditCardForm.cvc.$setValidity("numberFormat", isValid);
                    $scope.invoicePayment.creditCard.isValid = isValid;
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCardCode isValid=' + isValid );
                };

                function validateCreditCardCodeReset() {
                    //$scope.creditCardValidationError = false;
                    $.logToConsole('invoicePaymentCreditCardController validateCreditCardCodeReset');
                    $scope.invoicePaymentCreditCardForm.cvc.$setValidity("numberFormat", true);
                    $scope.invoicePaymentCreditCardForm.cvc.$setPristine();
                }

                

                // Uses the classes applied by the jQuery card plugin to get the credit card type
                function setCardType() {
                    $.logToConsole('invoicePaymentCreditCardController setCardType')
                    var cardElement = document.getElementsByClassName('card')[0],
                       classes = cardElement.className,
                       creditCardType = '';

                    if (classes.indexOf('visa') !== -1) {
                        creditCardType = 'Visa';
                    } else if (classes.indexOf('mastercard') !== -1) {
                        creditCardType = 'MasterCard';
                    } else if (classes.indexOf('amex') !== -1) {
                        creditCardType = 'AmericanExpress';
                    } else if (classes.indexOf('discover') !== -1) {
                        creditCardType = 'Discover';
                    } else {
                        creditCardType = '';
                    }
                    $scope.invoicePayment.creditCard.creditCardType = creditCardType
                }

               

            }
        ]);

})();