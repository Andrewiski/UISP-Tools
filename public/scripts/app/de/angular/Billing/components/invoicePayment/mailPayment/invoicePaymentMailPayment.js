(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoicePaymentMailPayment', [
           function () {
               $.logToConsole('invoicePaymentMailPayment directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                     invoicePayment: "=invoicePaymentMailPayment",
                     isEditMode: "=" ,
                     isAdminMode: "=",
                     isListMode: "="
                 },
                 controller: 'invoicePaymentMailPaymentController',
                 //template: '<ng-include src="getTemplateUrl()"/>',
                 templateUrl: function (elem, attr) {
                     //return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.edit.tpl.html';
                     if (attr.isEditMode == "true") {
                        return '/Scripts/de/angular/Billing/components/invoicePayment/mailpayment/invoicePaymentMailPayment.edit.tpl.html';
                    } else {
                         if (attr.isListMode == "true") {
                            return '/Scripts/de/angular/Billing/components/invoicePayment/mailpayment/invoicePaymentMailPayment.view.list.tpl.html';
                        } else {
                            return '/Scripts/de/angular/Billing/components/invoicePayment/mailpayment/invoicePaymentMailPayment.view.tpl.html';
                        }

                    } 
                 },
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoicePaymentCreditCardController link');
                     
                     
                     
                 }
                 
              };
           }
       ])
       

})();
