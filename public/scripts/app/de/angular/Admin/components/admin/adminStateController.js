(function () {

    'use strict';

    angular.module('deapp').controller('adminStateController', ['$rootScope','$state', '$stateParams', '$scope', '$log', '$q', 'deui', 'pageContentService',
        function ($rootScope, $state, $stateParams, $scope, $log, $q, deui, pageContentService) {
            $log.debug("settingsController init");
            if (deui.common.login.isUserLoggedIn == false) {
                $log.warn("userStateController User Not Logged In");
                $state.go('user-login');
                return;
            }
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
            }else{
                //$.deui.common.menu.subMenuItems = [];
            }
            //$scope.doneLoading = false;

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