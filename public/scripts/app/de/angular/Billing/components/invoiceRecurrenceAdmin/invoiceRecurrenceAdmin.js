(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceRecurrenceAdmin', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {},
                 controller: 'invoiceRecurrenceAdminController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceRecurrenceAdmin/invoiceRecurrenceAdmin.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
