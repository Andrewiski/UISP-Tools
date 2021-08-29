(function () {

    'use strict';

    angular.module('deapp')
        .controller('userManageAccountController', [
             '$scope', '$location', '$window', '$log', 'deui',  function ($scope, $location, $window, $log, deui) {
                 $log.debug('userManageAccount link');

                 var search = $location.search();
                 $scope.showUserFormErrors = false;
                 if (search.addExternal == "true") {
                     //this was an addExternal redirect for a provider that requires the redirect way of oAuth proboly MS OpenID
                     //step one is check that state is the same if so then add the call addexternallogin with the externalaccessToken
                     if (search.error) {
                         $scope.showAddLoginErrors = true;
                         $scope.AddLoginErrors = search.error;
                         if (!$scope.$$phase) {
                             $scope.$apply();
                         }
                         return;
                     }
                     if (search.state == sessionStorage["state"]) {
                         $.deui.aspnet.addExternalLogin(search.access_token).then(function (result) {
                             //clear the search from the url
                             $location.search('');
                             refreshUserManagerInfo();
                         },
                            function (result) {
                                $scope.showAddLoginErrors = true;
                                $scope.AddLoginErrors = '';
                                angular.forEach(result.errors, function (value, key) {
                                    $scope.AddLoginErrors = $scope.AddLoginErrors + value + '\n'
                                });
                                //clear the search from the url
                                $location.search('');
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                         );
                     } else {
                         $scope.showAddLoginErrors = true;
                         $scope.AddLoginErrors = 'Invalid State';
                         if (!$scope.$$phase) {
                             $scope.$apply();
                         }
                     }

                 }
                 

                 $scope.manageInfoData = {
                     hasLocalAccount: false,
                     mode:'view',
                     userInfo: null,
                     manageInfo: {
                         externalLoginProviders: [],
                         logins:[]
                     }
                 };

                 $scope.SaveUser = function () {
                     $scope.doneLoading = false;
                     $scope.showUserFormErrors = false;
                     $.deui.aspnet.saveUser($scope.manageInfoData.userInfo).then(function (result) {

                         if (result.success) {
                             $scope.UserForm.$setPristine();
                             $scope.UserForm.$setUntouched();
                             $scope.showUserFormErrors = false;
                             $scope.manageInfoData.mode = 'view';
                         } else {
                             $scope.showUserFormErrors = true;
                             if (result.errors) {
                                 $scope.UserFormErrors = '';
                                 angular.forEach(result.errors, function (value, key) {
                                     $scope.UserFormErrors = $scope.UserFormErrors + value + '\n'
                                 });
                             }
                             if (result.emailInUse) {
                                 $scope.UserForm.email.$setValidity("inuse", false);
                             }
                             
                         }
                         $scope.doneLoading = true;
                         if (!$scope.$$phase) {
                             $scope.$apply();
                         }
                         
                     });
                 }

                 $scope.ChangePassword = function () {
                     $scope.manageInfoData.mode = 'changepassword';
                 }
                 $scope.CancelChangePassword = function () {
                     $scope.manageInfoData.mode = 'view';
                 }
                 $scope.CancelEditUser = function () {
                     $scope.manageInfoData.mode = 'view';
                 }
                 $scope.EditUser = function () {
                     $scope.manageInfoData.mode = 'edit';
                 }
                $scope.showRegisteredLoginErrors = false;
                $scope.changePwd = { oldPassword: "", newPassword: "", confirmPassword: "" };
                $scope.SaveChangePassword = function () {
                    $scope.showChangePasswordErrors = false;
                    $scope.changePasswordForm.$setSubmitted();
                    $scope.showChangePasswordSuccess = false;
                    $scope.changePasswordErrors = '';
                    //$scope.changePasswordForm.$validate();
                    if ($scope.changePasswordForm.$dirty && $scope.changePasswordForm.$valid) {
                        $log.debug('changePassword');
                        $.deui.changePassword({ data: $scope.changePwd }).then(
                            function (result) {
                                $scope.showChangePasswordSuccess = true;
                                $scope.changePasswordForm.$setPristine();
                                $scope.changePasswordForm.$setUntouched();
                                $scope.manageInfoData.mode = 'view';
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            },
                            function (result) {
                                $scope.showChangePasswordErrors = true;
                                if (result.errors) {
                                    $scope.changePasswordErrors = '';
                                    angular.forEach(result.errors, function (value, key) {
                                        $scope.changePasswordErrors = $scope.changePasswordErrors + value + '\n';
                                    })
                                } else {
                                    $scope.changePasswordErrors = 'Error:' + result.message;
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        );
                        
                    } else {
                        $log.warn('invalid Form');
                        $scope.changePasswordErrors = 'Need Values';
                        $scope.showChangePasswordErrors = true;

                    }
                    
                }

                $scope.setPwd = {  newPassword: "", confirmPassword: "" };
                $scope.setPassword = function () {
                    $log.debug('setPassword');
                }
                $scope.passwordsMatch = function () {
                    if ($scope.changePwd.newPassword == $scope.changePwd.confirmPassword) {
                        //$scope.changePasswordForm.ChangePasswordConfirmPassword.$setValidity('required', true);
                        return true;
                    } else {
                        //$scope.changePasswordForm.ChangePasswordConfirmPassword.$setValidity('required', false);
                        return false;
                    }
                }
                //$scope.doExternalLogin = function (externalLogin) {
                //    $.deui.aspnet.externalLogin(externalLogin);
                //}

                $scope.addExternalLogin = function (login) {
                    //first we do an external login which will give us a local webserver externalBearerToken with the external login
                    // in the case of OpenID there will be redirects and we will end up back here we control the url coming back in the manageuerserinfo below
                    $scope.doneLoading = false;
                    $.deui.externalLogin(login).then(
                        function (result) {
                            // $state.go('home');
                            //do nothing as we should already be redirected
                            if (result.redirect == true) {
                                //set the state in session so on the redirect back we can make sure it came from us
                                $scope.doneLoading = true;
                                sessionStorage["state"] = login.state;
                                $window.location.href = result.redirectUrl;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            } else {
                                //we need to call the $.deui.aspnet.addExternalUser
                                $scope.doneLoading = false;
                                $.deui.aspnet.addExternalLogin(result.access_token).then(function (result) {
                                    if (result.success == true) {
                                        refreshUserManagerInfo();
                                        $scope.doneLoading = true;
                                    } else {
                                        $scope.showAddLoginErrors = true;

                                        if (result.errors) {
                                            $scope.AddLoginErrors = '';
                                            angular.forEach(result.errors, function (value, key) {
                                                $scope.AddLoginErrors = $scope.AddLoginErrors + value + '\n'
                                            });
                                        } else {
                                            $scope.AddLoginErrors = result.Message;
                                        }
                                        $scope.doneLoading = true;
                                        if (!$scope.$$phase) {
                                            $scope.$apply();
                                        }
                                    }
                                },
                                   function (result) {
                                        $scope.showAddLoginErrors = true;
                                        
                                        if (result.errors) {
                                            $scope.AddLoginErrors = '';
                                            angular.forEach(result.errors, function (value, key) {
                                                $scope.AddLoginErrors = $scope.AddLoginErrors + value + '\n'
                                            });
                                        } else {
                                            $scope.AddLoginErrors = result.Message;
                                        }
                                        $scope.doneLoading = true;
                                        if (!$scope.$$phase) {
                                            $scope.$apply();
                                        }
                                   }
                                )
                            }
                            
                        },
                        function (result) {
                            if (result.errors) {
                                $scope.AddLoginErrors = '';
                                angular.forEach(result.errors, function (value, key) {
                                    $scope.AddLoginErrors = $scope.AddLoginErrors + value + '\n'
                                });
                            } else {
                                $scope.AddLoginErrors = result.Message;
                            }
                            $scope.showErrors = true;
                            $scope.doneLoading = true;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    )
                }

                $scope.removeExternalLogin = function (login) {
                    $scope.showRegisteredLoginErrors = false;
                    $scope.doneLoading = false;
                    $.deui.aspnet.removeExternalLogin(login).then(
                        function (result) {
                            $scope.doneLoading = true;
                            refreshUserManagerInfo();
                        },
                        function (result) {
                            if(result.errors){
                                $scope.showRegisteredLoginErrors = true;
                                $scope.RegisteredLoginErrors = '';
                                angular.forEach(result.errors, function (value, key){
                                    $scope.RegisteredLoginErrors  = $scope.RegisteredLoginErrors + value + '\n'
                                });
                            }
                            refreshUserManagerInfo();
                            $scope.doneLoading = true;
                        }
                    )
                }
                $scope.getFontAwesomeClass = function (name) {
                    return $.deui.getFontAwesomeClassForLoginProvider(name);
                }

                if ($.deui.common.login.userInfo == null) {
                    $scope.doneLoading = false;
                    $.deui.getUserInfo({ showErrorDialog: false, showLoginOn401Error: false }).then(function (userInfo) {
                        $scope.doneLoading = true;
                        $scope.manageInfoData.userInfo = userInfo;
                        $scope.$apply();
                    }, function (objError) {
                        $location.search({ 'redir': '/deui/user/manage' });
                        $location.path("/deui/user/login");
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                    
                } else {
                    $scope.doneLoading = true;
                    $scope.manageInfoData.userInfo = $.deui.common.login.userInfo;
                }

                var refreshUserManagerInfo = function () {
                    $scope.doneLoading = false;
                    var authredir = "/deui/user/manage";
                    //$.deui.aspnet.getUserManageInfo({ returnUrl: '/deui/auth?authredir=' + encodeURIComponent(authredir) }).then(function (manageInfo) {
                    $.deui.aspnet.getUserManageInfo({ returnUrl: '/deui/user/manage?addExternal=true'}).then(function (manageInfo) {
                        $scope.manageInfoData.manageInfo = manageInfo;
                        for (var i = 0; i < manageInfo.logins.length; i++) {
                            var login = manageInfo.logins[i];
                            if (login.loginProvider == manageInfo.localLoginProvider) {
                                $scope.manageInfoData.hasLocalAccount = true;
                                break;
                            }
                        }
                        $scope.doneLoading = true;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                }

                 //need to init the application so we have UserInfo Data
                refreshUserManagerInfo();
            }
        ]);

})();