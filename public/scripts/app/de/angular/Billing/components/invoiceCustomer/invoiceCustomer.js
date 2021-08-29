(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceCustomer', [
           function () {
               $.logToConsole('invoiceCustomer directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: {
                     customer: "=invoiceCustomer",
                     isEditMode: "=",
                     isAdminMode: "=",
                     onSave:"="
                 },
                 controller: 'invoiceCustomerController',
                 //template: '<ng-include src="getTemplateUrl()"/>',
                 templateUrl: function (elem, attr) {
                     if (attr.isAdminMode == "true") {
                         if (attr.isEditMode == "true") {
                             return '/Scripts/de/angular/Billing/components/invoiceCustomer/invoiceCustomer.admin.edit.tpl.html';
                         } else {
                             return '/Scripts/de/angular/Billing/components/invoiceCustomer/invoiceCustomer.admin.tpl.html';
                         }
                     } else {
                         if (attr.isEditMode == "true") {
                             return '/Scripts/de/angular/Billing/components/invoiceCustomer/invoiceCustomer.edit.tpl.html';
                         } else {
                             return '/Scripts/de/angular/Billing/components/invoiceCustomer/invoiceCustomer.tpl.html';
                         }
                     }
                 },
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoiceCustomer link');
                     //scope.getTemplateUrl = function () {
                     //    if (scope.isEditMode == true) {
                     //        return '/Scripts/de/angular/Billing/components/invoiceCustomer/invoiceCustomer.edit.tpl.html';
                     //    }else{
                     //        return '/Scripts/de/angular/Billing/components/invoiceCustomer/invoiceCustomer.tpl.html';
                     //    }
                         
                     //}
                 }
              };
           }
       ]);

})();
