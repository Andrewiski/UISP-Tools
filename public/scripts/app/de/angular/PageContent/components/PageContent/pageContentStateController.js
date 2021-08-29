(function () {

    'use strict';

    angular.module('deapp').controller('pageContentEditorStateController', ['$state', '$stateParams', '$scope', '$log', '$q', 'deui', 'pageContentService',
        function ($state, $stateParams, $scope, $log, $q, deui, pageContentService) {
            $scope.contentPageGuid = $stateParams.contentPageGuid;
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