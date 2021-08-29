(function () {

    'use strict';

    angular.module('deapp').controller('pageContentStateController', ['$state', '$stateParams', '$scope', '$log', '$q', 'deui', 'pageContentService',
        function ($state, $stateParams, $scope, $log, $q, deui, pageContentService) {
            $.logToConsole("pageContentStateController init");
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