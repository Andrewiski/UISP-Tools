(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoicePaymentReminderEmailBodyController', [
            '$scope', '$log', '$timeout', 'invoiceService', function ($scope, $log, $timeout, invoiceService) {
                $log.debug('invoicePaymentReminderEmailBody init');
                invoiceService.init().then(function(){
                    $scope.getStaticName = invoiceService.getStaticName;
                    $scope.invoiceListRenderComplete = function () {
                        //using our Customer onFinishRenderDirective we get notified once the ngrepeat is done rendering so we can emit our render complete 
                        //event We use $timeout as this insure its fires after render as it goes tot he botom of the event stack
                        $timeout(function () {
                            $log.debug('invoicePaymentReminderEmailBody Emiting Render Complete');
                            $scope.$emit('EmailBodyRenderComplete')
                        }, 0);

                    }
                })
                $scope.sendEmail = function () {

                }
            }
        ]);

})();