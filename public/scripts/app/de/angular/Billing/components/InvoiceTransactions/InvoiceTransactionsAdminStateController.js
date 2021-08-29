(function () {

    'use strict';

    angular.module('deapp').controller('invoiceTransactionsStateController', ['$rootScope','$state', '$stateParams', '$scope', '$log', '$q', 'deui', 'invoiceService',
        function ($rootScope, $state, $stateParams, $scope, $log, $q, deui, invoiceService) {
            $log.debug("invoiceTransactionsStateController init");
            
            $scope.invoiceServiceCommon = invoiceService.common;
            if ($.deui.isUserInRoleName('admin') === false) {
                $.deui.showErrorDialog({
                    error: $.deui.getErrorAccessIsDenied("User is not an Admin!"),
                    showRetry: false,
                    showCancel:false,
                }
                ).then(
                    function () {
                        $.logToConsole("Redirecting to previousState from Access is denied")
                        
                        $state.go($rootScope.previousState);
                    }
                )
            } else {
                

                //Init Happens Here
                $scope.invoiceTransactionAdminDoneLoading = false;
                invoiceService.init().then(function () {
                    $scope.invoiceTransactionAdminDoneLoading = true;
                })
                
            }
            //

            //$.logToConsole("pageContentController init");

            //if ($scope.pageContentGuid) {
            //    pageContentService.getPageContentByGuid($scope.pageContentGuid).then(
            //        function (pageContent) {
            //            $scope.pageContent = pageContent;
            //            $scope.doneLoading = true;
            //        }
            //    )
            //}
        }
    ]);
})();