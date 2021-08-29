(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoiceProcessingList', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                  scope: {
                      invoiceProcessingList: "=",
                      isAdminMode: "="
                  },
                  controller: 'invoiceProcessingListController',
                  templateUrl: '/Scripts/de/angular/Billing/components/invoiceProcessingList/invoiceProcessingList.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
