(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceAdmin', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                    invoice:"=invoiceAdmin"
                 },
                 controller: 'invoiceAdminController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceAdmin/invoice.admin.edit.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
