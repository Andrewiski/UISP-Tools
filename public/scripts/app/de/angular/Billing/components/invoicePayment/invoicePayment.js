(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoicePayment', [
           function () {
               $.logToConsole('invoicePayment directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: {
                     invoicePayment: "=invoicePayment",
                     isEditMode: "=",
                     isAdminMode:"@",
                     isListMode: "="
                 },
                 controller: 'invoicePaymentController',
                 template: '<ng-include src="getTemplateUrl()"/>',
                 //templateUrl: function (elem, attr) {
                 //    if (attr.isEditMode == "true") {
                 //        return '/Scripts/de/angular/Billing/components/invoicePayment/invoicePayment.edit.tpl.html';
                 //    } else {
                 //        if (attr.isListMode == "true") {
                 //            return '/Scripts/de/angular/Billing/components/invoicePayment/invoicePayment.list.tpl.html';
                 //        } else {
                 //            return '/Scripts/de/angular/Billing/components/invoicePayment/invoicePayment.tpl.html';
                 //        }
                 //    }
                 //},
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoicePayment link');
                     scope.getTemplateUrl = function () {
                         if (scope.isEditMode == true) {
                             return '/Scripts/de/angular/Billing/components/invoicePayment/invoicePayment.edit.tpl.html';
                         } else {
                             if (scope.isListMode == true) {
                                 return '/Scripts/de/angular/Billing/components/invoicePayment/invoicePayment.list.tpl.html';
                             } else {
                                 return '/Scripts/de/angular/Billing/components/invoicePayment/invoicePayment.tpl.html';
                             }
                         }
                         
                     }
                    
                 }
              };
           }
       ]);

})();
