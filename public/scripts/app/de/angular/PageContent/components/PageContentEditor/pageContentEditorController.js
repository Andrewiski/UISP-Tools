(function () {

    'use strict';

    angular.module('deapp').controller('pageContentEditorController', ['$scope', '$log', '$q', '$state', 'deui', 'pageContentService',
        function ($scope, $log, $q, $state, deui, pageContentService) {
            $scope.doneLoading = false;
            $scope.isRawView = false;
            $.logToConsole("pageContentEditorController init");


            if ($.deui.isUserInRoleName('admin') == false) {
                $.deui.showErrorDialog({
                    error: $.deui.getErrorAccessIsDenied("User is not an Admin!"),
                    showRetry: false,
                    showCancel: false,
                }
                ).then(
                    function () {
                        $.logToConsole("Redirecting to previousState from Access is denied")

                        $state.go($rootScope.previousState);
                    }
                )
            } else {



                if ($scope.pageContentGuid) {
                    pageContentService.getPageContentByGuid($scope.pageContentGuid).then(
                        function (pageContent) {
                            $scope.pageContent = pageContent;
                            $scope.originalContent = pageContent.content;
                            $scope.doneLoading = true;
                        }
                    )
                }
                $scope.save = function () {
                    $scope.doneLoading = false;
                    pageContentService.save($scope.pageContent).then(function(pageContent){
                        $scope.pageContent = pageContent;
                        $scope.originalContent = pageContent.content;
                        $scope.doneLoading = true;
                        $state.go('^');
                    })
                }
            }
            
        }
    ]);
})();