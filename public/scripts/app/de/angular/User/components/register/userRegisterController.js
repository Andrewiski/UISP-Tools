(function () {

    'use strict';

    angular.module('deapp')
        .controller('userRegisterController', [
            '$location', '$scope', '$state', 'deui', 'modalService', function ($location, $scope, $state, deui, modalService) {
                
                var search = $location.search();
                var isExternalLogin = false;
                if (search.externalLogin == "true" || search.externalLogin == true) {
                    isExternalLogin = true;
                }
                var access_token = null;
                if (search.access_token) {
                    access_token = search.access_token;
                }
                
                $scope.showErrors = false;
                $scope.doneLoading = true;
                $scope.user = { isExternalLogin: isExternalLogin, access_token: access_token };

                $scope.passwordsMatch = function () {
                    if ($scope.user.Password != $scope.user.ConfirmPassword) {
                        return true;
                    } else {
                        return false;
                    }
                }


                $scope.UserRegister = function () {
                    $scope.doneLoading = false;
                    $.deui.aspnet.registerNewUser($scope.user).then(function (result) {
                        if (search && search.redir) {
                            if (search.redir.substring(1, 14) == "/deui/user/register") {
                                $location.path("");
                            } else {
                                $location.path(search.redir);
                            }
                        } else {
                            //$location.search('');
                            $state.go('home');
                        }
                        
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                        $scope.doneLoading = true;
                        }, function(result){
                            //display the errors to the user
                            if (result.emailInUse == true) {
                                
                                $scope.registerUser.Email.$setValidity('alreadyinuse', 'The Email address ' + $scope.user.email + ' is already assigned to an account.');
                                modalService.showDialogOk('The Email address ' + $scope.user.email + ' is already assigned to an account.', "Email already has an Account")
                            }
                            if (result.registrationErrors && result.registrationErrors.length > 0) {
                                $scope.errors = "";
                                for (var i = 0; i < result.registrationErrors.length; i++) {
                                    if (i < 0) {
                                        $scope.errors = $scope.errors + "<br/>";
                                    }
                                    $scope.errors = $scope.errors + result.registrationErrors[i];
                                }
                                $scope.showErrors = true;
                            }
                            $scope.doneLoading = true;
                        })
                }

            }
        ]);

})();