(function () {

    'use strict';

    angular.module('deapp').controller('invoicesStateController', ['$rootScope','$state', '$stateParams', '$scope', '$log', '$q', 'deui', 'invoiceService',
        function ($rootScope, $state, $stateParams, $scope, $log, $q, deui, invoiceService) {
            $log.debug("invoicesStateController init");
            
            $scope.invoiceServiceCommon = invoiceService.common;
            if ($.deui.isUserInRoleName('admin') == false) {
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
                $scope.invoiceAdminDoneLoading = false;

                //Init Happens Here
                $scope.invoiceAdminDoneLoading = false;
                invoiceService.init().then(function () {
                    $scope.invoiceAdminDoneLoading = true;
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