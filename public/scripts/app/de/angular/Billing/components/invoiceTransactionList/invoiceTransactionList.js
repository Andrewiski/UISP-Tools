(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceTransactionList', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                    invoiceList:"=",
                    isAdminMode: "=",
                    invoiceTransactionListRequest:"@"
                 },
                 controller: 'invoiceTransactionListController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceTransactionList/invoiceTransactionList.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
