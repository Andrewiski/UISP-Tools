(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceTransaction', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: {
                     invoiceTransactionGuid: "@"
                 },
                  controller: 'invoiceTransactionController',
                  templateUrl: '/Scripts/de/angular/Billing/components/invoiceTransaction/invoiceTransaction.tpl.html',
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoice Transaction Directive');
                 }
              };
           }
       ])

       

})();
