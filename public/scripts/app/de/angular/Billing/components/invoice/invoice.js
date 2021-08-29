(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoice', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: {
                     invoiceGuid: "@",
                     isAdminMode: "=",
                 },
                 controller: 'invoiceController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoice/invoice.tpl.html',
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoice Directive');
                 }
              };
           }
       ])

       .directive('invoiceMini', [
          function () {
              return {
                  require: '?ngModel',
                  restrict: 'A',
                  replace: true,
                  scope: {
                      invoiceGuid: "="
                  },
                  controller: 'invoiceMiniController',
                  templateUrl: '/Scripts/de/angular/Billing/components/invoice/invoice.mini.paypal.tpl.html',
                  link: function (scope, elm, atts, c) {

                  }
              };
          }
   ]);

})();
