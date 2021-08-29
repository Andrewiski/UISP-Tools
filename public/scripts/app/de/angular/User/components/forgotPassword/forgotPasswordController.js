(function () {

    'use strict';

    angular.module('deapp')
        .controller('userForgotPasswordController', [
            '$rootScope', '$scope', '$state', '$log', '$location', '$window', 'deui', function ($rootScope, $scope, $state, $log, $location, $window, deui) {
                
               
                $scope.sendEmailData = { username: '' };
                $scope.setPasswordData = { username: null, token:null, newPassword:'', confirmPassword:'' };
                var search = $location.search();
                if (search.username) {
                    $scope.sendEmailData.username = search.username;
                }
                $scope.showSendEmailErrors = false;
                $scope.showResetPassword = false;
                if (search.token) {
                    $scope.showResetPassword = true;
                    $scope.setPasswordData.username = search.user;
                    $scope.setPasswordData.token = search.token;
                    $scope.setPasswordData.newPassword = '';
                    $scope.setPasswordData.confirmPassword = '';
                    $location.search('');
                    $log.debug('Show Reset Password');
                }
                //var authredir = "#";  //default to home

                //if (search.redir) {
                //    authredir = search.redir;
                //    //location.pathname + location.hash
                //}

                $scope.getLoginUrl = function () {
                    var url = '/deui/user/login'
                    if (search.user) {
                        url = url + "?username=" + encodeURIComponent(search.user);
                    }
                    return url;
                }
                $scope.sendEmail = function () {
                    $scope.sendEmailErrors = '';
                    $scope.showSendEmailErrors = false;
                    $scope.showSendEmailSuccess = false;
                    $.deui.resetPassword({ data: { username: $scope.sendEmailData.username, redir: '/deui/user/forgotpassword' } }).then(
                        function (result) {
                            //All of the $.deui.common.login properties should be set at this point so just close down the dialog and resolve the promise
                            $log.debug('send Email Success');
                            $scope.showSendEmailSuccess = true;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        },
                        function (result) {
                            if (result.errors) {
                                $scope.showSendEmailErrors = true;
                                $scope.sendEmailErrors = '';
                                angular.forEach(result.errors, function (value, key) {
                                    $scope.sendEmailErrors = $scope.sendEmailErrors + value + '\n'
                                });
                            } else {
                                $scope.sendEmailErrors = result.message + ": " + result.exceptionMessage;
                            }
                            
                            $scope.showSendEmailErrors = true;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    )
                }

                $scope.setPassword = function () {
                    $scope.setPasswordErrors = '';
                    $scope.showSetPasswordErrors = false;
                    $scope.showSetPasswordSuccess = false;
                    $.deui.resetPassword({ data: $scope.setPasswordData }).then(
                        function (result) {
                            //All of the $.deui.common.login properties should be set at this point so just close down the dialog and resolve the promise
                            $log.debug('Set Password Success');
                            $scope.showSetPasswordSuccess = true;

                            if (search.redir && search.redir[0] == "/") {
                                $location.url(search.redir);
                            } else {
                                $state.go('home');
                            }
                            //$location.path('/user/login');
                            //if (!$scope.$$phase) {
                            //    $scope.$apply();
                            //}
                        },
                        function (result) {
                            $scope.showSetPasswordErrors = true;
                            if (result.errors) {
                                $scope.setPasswordErrors = '';
                                angular.forEach(result.errors, function (value, key) {
                                    $scope.setPasswordErrors = $scope.setPasswordErrors + value + '\n'
                                });
                            } else {
                                $scope.setPasswordErrors = result.message + ": " + result.exceptionMessage;
                            }

                            $scope.showSendEmailErrors = true;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    )
                }
            }
        ]);

})();