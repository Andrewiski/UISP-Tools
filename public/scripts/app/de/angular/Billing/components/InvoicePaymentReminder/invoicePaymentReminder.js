(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoicePaymentReminder', [
           function () {
               $.logToConsole('invoicePaymentReminder directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: {
                     customerGuid: "=invoicePaymentReminder"
                 },
                 controller: 'invoicePaymentReminderController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoicePaymentReminder/invoicePaymentReminder.tpl.html',
                 
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoicePaymentReminder link');
                    
                 }
              };
           }
       ]);

})();
