(function () {

   'use strict';

   angular.module('deapp')
       .directive('billingInvoiceItemList', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: {
                        invoiceItems:'='
                 },
                 controller: 'billingInvoiceItemListController',
                 templateUrl: '/Scripts/ctmangular/Billing/js/components/invoiceItemList/invoiceItemList.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
