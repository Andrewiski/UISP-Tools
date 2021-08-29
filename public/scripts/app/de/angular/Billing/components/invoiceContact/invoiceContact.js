(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceContact', [
           function () {
               $.logToConsole('invoiceContact directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: {
                     contact: "=invoiceContact",
                     isEditMode: "=",
                     tabindex: "@"
                 },
                 controller: 'invoiceContactController',
                 template: '<ng-include src="getTemplateUrl()"/>',
                 //templateUrl: function(){'/Scripts/de/angular/Billing/components/invoiceContact/invoiceContact.tpl.html',
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoiceContact link');
                     scope.getTemplateUrl = function () {
                         if (scope.isEditMode == true) {
                             return '/Scripts/de/angular/Billing/components/invoiceContact/invoiceContact.edit.tpl.html';
                         }else{
                             return '/Scripts/de/angular/Billing/components/invoiceContact/invoiceContact.tpl.html';
                         }
                         
                     }
                 }
              };
           }
       ]);

})();
