(function () {

   'use strict';

   angular.module('deapp')
       .directive('invoicePaymentReminderEmailBody', ['$timeout',
            function ($timeout) {
               $.logToConsole('invoicePaymentReminderEmailBody directive');
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: false,
                 scope: {
                     data: "=invoicePaymentReminderEmailBody",
                     
                 },
                 controller: 'invoicePaymentReminderEmailBodyController',
                 templateUrl: '/Scripts/de/angular/Billing/components/invoicePaymentReminder/invoicePaymentReminderEmailBody.tpl.html',
                 
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('invoicePaymentReminderEmailBody link');
                 }
              };
           }
       ]);

})();
