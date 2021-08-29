(function () {

    'use strict';

    angular.module('deapp')
        .filter('unsafeHtml', ['$sce', function ($sce) {
            return function (val) {
                return $sce.trustAsHtml(val);
            };
        }])
    //.filter('isDeleted', ['$sce', function ($sce) {
    //    return function (val) {
    //        return $sce.trustAsHtml(val);
    //    };
    //}]);
})();