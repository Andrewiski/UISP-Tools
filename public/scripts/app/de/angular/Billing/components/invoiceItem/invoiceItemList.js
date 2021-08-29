(function () {

   'use strict';

   angular.module('deapp')
       .directive('billingInvoiceList', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: true,
                 controller: 'billingInvoiceListController',
                 templateUrl: '/Scripts/ctmangular/Billing/js/components/invoiceList/invoiceList.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
