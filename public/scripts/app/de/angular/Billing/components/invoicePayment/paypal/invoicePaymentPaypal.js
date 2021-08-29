(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoicePaymentPaypal', [
           function () {
               $.logToConsole('invoicePaymentPaypal directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                     invoicePayment: "=invoicePaymentPaypal",
                     isEditMode: "=" ,
                     isAdminMode: "=",
                     isListMode: "="
                 },
                 controller: 'invoicePaymentPaypalController',
                 //template: '<ng-include src="getTemplateUrl()"/>',
                 templateUrl: function (elem, attr) {
                     //return '/Scripts/de/angular/Billing/components/invoicePayment/creditcard/invoicePaymentCreditCard.edit.tpl.html';
                     if (attr.isEditMode == "true") {
                        return '/Scripts/de/angular/Billing/components/invoicePayment/Paypal/invoicePaymentPaypal.edit.tpl.html';
                    } else {
                         if (attr.isListMode == "true") {
                            return '/Scripts/de/angular/Billing/components/invoicePayment/Paypal/invoicePaymentPaypal.view.list.tpl.html';
                        } else {
                            return '/Scripts/de/angular/Billing/components/invoicePayment/Paypal/invoicePaymentPaypal.view.tpl.html';
                        }

                    } 
                 },
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoicePaymentPaypal link');
                     
                     
                     
                 }
                 
              };
           }
       ])
       

})();
