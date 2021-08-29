(function () {

    'use strict';

    angular.module('deapp').controller('pageContentController', ['$scope', '$log', '$q', '$state', 'deui', 'pageContentService',
        function ($scope, $log, $q, $state, deui, pageContentService) {
            $scope.doneLoading = false;

            $.logToConsole("pageContentController init");

            if ($scope.pageContentGuid) {
                pageContentService.getPageContentByGuid($scope.pageContentGuid).then(
                    function (pageContent) {
                        $scope.pageContent = pageContent;
                        $scope.doneLoading = true;
                    }
                )
            }
            $scope.isAdmin = function () {
                return $.deui.isUserInRoleName('admin');
            }
            $scope.AdminEdit = function () {
                $.logToConsole("pageContentController AdminEdit");
                //if ($state.current.name == "home") {
                    //$state.go('pagecontent.editor');
                    $state.go("pagecontent.editor", { contentPageGuid: $scope.pageContentGuid });
                //} else {
                //    $state.go('pagecontent.editor');
                //}
                
            }
        }
    ]);
})();