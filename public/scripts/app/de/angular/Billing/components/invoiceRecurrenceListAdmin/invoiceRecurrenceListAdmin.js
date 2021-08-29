(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceRecurrenceListAdmin', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {},
                 controller: 'invoiceRecurrenceListAdminController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceRecurrenceListAdmin/invoiceRecurrenceListAdmin.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
