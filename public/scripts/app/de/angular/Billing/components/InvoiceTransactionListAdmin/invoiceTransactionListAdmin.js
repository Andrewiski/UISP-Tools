(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceTransactionListAdmin', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {},
                 controller: 'invoiceTransactionListAdminController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceTransactionListAdmin/invoiceTransactionListAdmin.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
