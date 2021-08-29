(function () {

    'use strict';

    angular.module('deapp')
        .controller('userUserController', [
            '$rootScope', '$scope',  'deui', function ($rootScope, $scope,  deui) {
                
                if ($scope.user == undefined) {
                    //if no User was passed in then assume we should use the current logged in user which is avalible on the $rootScope.User
                    if (deui.common.login.isUserLoggedIn == false) {
                        deui.login().then(function (Tokens, userInfo) {
                            //Todo you this to fetch additional information
                            $scope.user = deui.common.login.userInfo;
                        });

                    } else {
                        $scope.user = deui.userInfo;
                    }
                }
               
            }
        ]);

})();