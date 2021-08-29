(function () {

    'use strict';

    /**
    * @ngdoc directive
    * @name deapp.userUser
    * @restrict A
    *
    * @description This needs a description
    */
    angular.module('deapp')
        .directive('userRegister', [
            function () {
                return {
                    require: '?ngModel',
                    restrict: 'A',
                    replace: true,
                    scope: false,
                    controller: 'userRegisterController',
                    templateUrl: '/Scripts/de/angular/User/components/register/userRegister.tpl.html',
                    link: function (scope, elm, atts, c) {

                    }
                };
            }
        ])
        //.directive('validationEmailAvalible', ['$q', '$timeout', function ($q, $timeout) {
        //    return {
        //        require: 'ngModel',
        //        link: function (scope, elm, attrs, ctrl) {
        //            ctrl.$asyncValidators.username = function (modelValue, viewValue) {

        //                if (ctrl.$isEmpty(modelValue)) {
        //                    // consider empty model valid
        //                    return $q.when();
        //                }

        //                var def = $q.defer();

        //                $timeout(function () {
        //                    // Mock a delayed response
        //                    if (usernames.indexOf(modelValue) === -1) {
        //                        // The username is available
        //                        def.resolve();
        //                    } else {
        //                        def.reject();
        //                    }

        //                }, 2000);

        //                return def.promise;
        //            };
        //        }
        //    };
        //}]);

})();
