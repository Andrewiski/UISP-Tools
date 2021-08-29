(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceCustomerSearch', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {},
                 controller: 'invoiceCustomerSearchController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomerSearch/invoiceCustomerSearch.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
