(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoicePaymentCreditCard', [
           function () {
               $.logToConsole('invoicePaymentCreditCard directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                     invoicePayment: "=invoicePaymentCreditCard",
                     isEditMode: "=" ,
                     isAdminMode: "=",
                     isListMode: "="
                 },
                 controller: 'invoicePaymentCreditCardController',
                 //template: '<ng-include src="getTemplateUrl()"/>',
                 templateUrl: function (elem, attr) {
                     //return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.edit.tpl.html';
                     if (attr.isEditMode == "true") {
                        return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.edit.tpl.html';
                    } else {
                         if (attr.isListMode == "true") {
                            return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.view.list.tpl.html';
                        } else {
                            return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.view.tpl.html';
                        }

                    } 
                 },
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoicePaymentCreditCardController link');
                     //scope.getTemplateUrl = function () {
                     //    if (scope.isEditMode == true) {
                     //        return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.edit.tpl.html';
                     //    } else {
                     //        if (scope.isListMode == true) {
                     //            return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.view.list.tpl.html';
                     //        } else {
                     //            return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.view.tpl.html';
                     //        }
                             
                     //    }

                     //}
                     var cardType = null;
                     if (scope.invoicePayment && scope.invoicePayment.creditCard && scope.invoicePayment.creditCard.creditCardType) {
                         if (scope.invoicePayment.creditCard.creditCardNumber.startsWith('XXXX')) {

                             switch (scope.invoicePayment.creditCard.creditCardType.toString().toLowerCase()) {
                                 case "1":
                                 case "mastercard":
                                     cardType = "mastercard";
                                     break;
                                 case "2":
                                 case "visa":
                                     cardType = "visa";
                                     break;
                                 case "4":
                                 case "AmericanExpress":
                                     cardType = "amex";
                                     break;
                                 case "8":
                                 case "Discover":
                                     cardtype = "discover";
                                     cardType;
                             }
                         }
                     }
                     var cardWrapper = $(elm).find(".card-information-wrapper");
                     cardWrapper.card({
                         container: $(elm).find(".card-wrapper"),
                         formSelectors: {
                             numberInput: "input[name='cardNumber']",
                             expiryInput: "input[name='expDate']",
                             cvcInput: "input[name='cvc']",
                             nameInput: "input[name='fullName']"
                         },
                         //width: 200, // optional — default 350px
                         formatting: true, // optional - default true


                         // Default values for rendered fields - options
                         //values: {
                         //    number: scope.creditCard.creditCardNumber,
                         //    name: scope.creditCard.nameOnCard,
                         //    expiry: scope.creditCard.creditCardExp,
                         //    cvc: scope.creditCard.creditCardCode
                         //},
                         classes: {
                             valid: 'ng-valid',
                             invalid: 'ng-invalid'
                         },
                         //Andy added this to card.js to set default card type if XXXXXXXXXXXX1234 cc nuber passed in.
                         cardType: cardType
                     });
                       //Trying to set the card type failed this way added option.cardType to the card.js need to fix on upgrade
                     //if (scope.invoicePayment && scope.invoicePayment.creditCard && scope.invoicePayment.creditCard.creditCardType) {
                     //    if (scope.invoicePayment.creditCard.creditCardNumber.startsWith('XXXX')) {

                     //        var setCardClass = function (cardType) {
                     //            //var $card = $(elm).find('.card');
                     //            //cardWrapper.data('card').handlers.setCardType(null, null, cardType);
                     //            //var cardTypes = cardWrapper.data('card').cardTypes;
                     //            //if (!$card.hasClass(cardType)) {
                     //            //    $card.removeClass('unknown');
                     //            //    $card.removeClass(cardTypes.join(' '));
                     //            //    $card.addClass(cardType);
                     //            //    $card.toggleClass('identified', cardType !== 'unknown');
                     //            //}
                     //        }
                     //         /*
                     //           MasterCard = 1,   
                     //           Visa = 2,
                     //           AmericanExpress = 4,
                     //           Discover = 8
                     //          */
                     //        switch (scope.invoicePayment.creditCard.creditCardType.toString().toLowerCase()) {
                     //            case "1":
                     //            case "mastercard":
                     //                setCardClass("mastercard");
                     //                break;
                     //            case "2":
                     //            case "visa":
                     //                setCardClass("visa");
                     //                break;
                     //            case "4":
                     //            case "AmericanExpress":
                     //                setCardClass("amex");
                     //                break;
                     //            case "8":
                     //            case "Discover":
                     //                setCardClass("discover");
                     //                break;
                     //        }
                     //    }
                         
                     //}
                     
                 }
                 
              };
           }
       ])
       //.directive('invoicePaymentCreditCardNumber', [
       //    function () {
       //        $.logToConsole('invoicePaymentCreditCard directive');
       //        return {
       //            require: 'ngModel',
       //            restrict: 'A',
       //            replace: false,
       //            link: function (scope, elm, atts, ctrl) {
       //                $.logToConsole('invoicePaymentCreditCardController invoicePaymentCreditCardNumber link');
       //                ctrl.$validators.invoicePaymentCreditCardNumber = function (modelValue, viewValue) {
       //                    if (ctrl.$isEmpty(modelValue)) {
       //                        // consider empty models to be valid
       //                        return true;
       //                    }

       //                    // Luhn Algorithm                     
       //                    var cardNumber = (viewValue || '').replace(/\D/g, ''),
       //                        len = cardNumber.length,
       //                        mul = 0,
       //                        prodArr = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 2, 4, 6, 8, 1, 3, 5, 7, 9]],
       //                        sum = 0;

       //                    while (len--) {
       //                        sum += prodArr[mul][parseInt(cardNumber.charAt(len), 10)];
       //                        mul ^= 1;
       //                    }

       //                    var isValid = (sum % 10 === 0 && sum > 0) && cardNumber.length === 16;
       //                    $.logToConsole('invoicePaymentCreditCardController invoicePaymentCreditCardNumber link isValid=' + isValid);
       //                    // it is invalid
       //                    return isValid;
       //                };
       //            }
       //        };
       //    }
       //])

})();
