(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceList', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                    invoiceList:"=",
                    isAdminMode: "=",
                    invoiceListRequest: "@"
                 },
                 controller: 'invoiceListController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoiceList/invoiceList.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
