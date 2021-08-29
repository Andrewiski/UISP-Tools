(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoicePaymentInvoice', [
           function () {
               $.logToConsole('invoicePaymentInvoice directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                     invoicePayment: "=invoicePaymentInvoice",
                     isEditMode: "=",
                     isAdminMode: "=",
                     isListMode: "="
                 },
                 controller: 'invoicePaymentInvoiceController',
                 
                 templateUrl: function (elem, attr) {
                     if (attr.isEditMode == "true") {
                         return '/Scripts/de/angular/Billing/components/invoicePayment/invoice/invoicePaymentInvoice.edit.tpl.html';
                     } else {
                         if (attr.isListMode == "true") {
                             return '/Scripts/de/angular/Billing/components/invoicePayment/invoice/invoicePaymentInvoice.view.list.tpl.html';
                         } else {
                             return '/Scripts/de/angular/Billing/components/invoicePayment/invoice/invoicePaymentInvoice.view.tpl.html';
                         }

                     }
                 },
                 
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoicePaymentInvoiceController link');
                     
                 }
              };
           }
       ]);

})();
