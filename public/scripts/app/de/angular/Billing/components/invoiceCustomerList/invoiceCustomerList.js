(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceCustomerList', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                     customerList: "=invoiceCustomerList"
                 },
                 controller: 'invoiceCustomerListController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomerList/invoiceCustomerList.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
