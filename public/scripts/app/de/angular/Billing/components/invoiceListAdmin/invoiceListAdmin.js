(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceListAdmin', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {},
                 controller: 'invoiceListAdminController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceListAdmin/invoiceListAdmin.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
