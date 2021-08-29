(function () {

    'use strict';

    angular.module('deapp')
        .controller('userLoginController', [
            '$rootScope', '$scope', '$state', '$log', '$location', '$window', 'deui', function ($rootScope, $scope, $state, $log, $location, $window, deui) {
                
                
                var search = $location.search();
                $scope.showErrors = false;
                if (search.error) {
                    $scope.Errors = search.error;
                    $scope.showErrors = true;
                    console.error('Login Error ' + search.error);
                }
                if (search.externalLogin == "true" || search.externalLogin == true) {
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
                        if (search.registered == "true" || search.registered == true) {
                            $.deui.login({ grant_type: "externalbearer", token: search.access_token }).then(
                           function (result) {
                               var authredir;
                               if (search.authredir) {
                                   authredir = decodeURIComponent(search.authredir);
                               } else {
                                   authredir = "/";
                               }
                               $location.path(authredir);
                               $location.search('');
                               if (!$scope.$$phase) {
                                   $scope.$apply();
                               }
                            },
                           function (result) {
                               $scope.showAddLoginErrors = true;
                               $scope.AddLoginErrors = '';
                               if (result.errors) {
                                   angular.forEach(result.errors, function (value, key) {
                                       $scope.AddLoginErrors = $scope.AddLoginErrors + value + '<br/>'
                                   });
                               } else {
                                   $scope.AddLoginErrors = result.message;
                               }
                               if (!$scope.$$phase) {
                                   $scope.$apply();
                               }
                           }
                        )
                        } else {
                            //send them to the registration page and add the accesstoken to the search path
                            $location.search({ externalLogin: true, access_token: search.access_token });
                            $location.path('/deui/user/register')
                        }
                    } else {
                        $scope.showAddLoginErrors = true;
                        $scope.AddLoginErrors = 'Invalid State';
                        
                    }

                }


                $scope.user = { email: search.username || '', password: '', rememberMe: true };
                
                $scope.loginData = {externalLoginProviders:null}
                
                var authredir = "#";  //default to home

                if (search.redir) {
                    authredir = search.redir;
                    //location.pathname + location.hash
                }
                $scope.isLoginLoading = true;
                $.deui.aspnet.getExternalLoginProviders({ returnUrl: '/deui/user/login?externalLogin=true&authredir=' + encodeURIComponent(authredir) }).then(
                    function (response) {
                        $scope.loginData.externalLoginProviders = response;
                        //angular.copy(response, $scope.loginData.externalLoginProviders);
                        $scope.isLoginLoading = false;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                        
                    }
                )

                
                
                $scope.getFontAwesomeClass = function (name) {
                    return $.deui.getFontAwesomeClassForLoginProvider(name);
                }

                $scope.externalLogin = function (login) {
                    $scope.isLoginLoading = true;
                    $.deui.externalLogin(login).then(
                        function (result) {
                            if (result.redirect == true) {
                                //set the state in session so on the redirect back we can make sure it came from us
                                sessionStorage["state"] = login.state;
                                $window.location.href = result.redirectUrl;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            } else {
                                //we will only get here on the non redirected logins like facebook and google, the OpenIDs do redirects
                                // which are handled above as they will redirect back here with externalLogin=true set on the search
                                //if the result.registered == true then this account is already registered so do the login
                                // if registerd == false then we need to redirect to the user registration page
                                if (result.registered == true) {
                                    $.deui.login({ grant_type: "externalbearer", token: result.access_token }).then(
                                        function (result) {
                                            $location.path(authredir);
                                            if (!$scope.$$phase) {
                                                $scope.$apply();
                                            }
                                        },
                                       function (result) {
                                           $scope.isLoginLoading = false;
                                           $scope.showAddLoginErrors = true;
                                           $scope.AddLoginErrors = '';
                                           if(result.errors){
                                               angular.forEach(result.errors, function (value, key) {
                                                   $scope.AddLoginErrors = $scope.AddLoginErrors + value + '<br/>'
                                               });
                                           } else {
                                                $scope.AddLoginErrors = result.Message;
                                            }
                                           if (!$scope.$$phase) {
                                               $scope.$apply();
                                           }
                                           }
                                    )
                                } else {
                                    //send them to the registration page and add the accesstoken to the search path
                                    $location.search({ externalLogin: "true", access_token: result.access_token, redir: authredir });
                                    $location.path('/deui/user/register');
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            }
                        },
                        function (result) {
                            $scope.isLoginLoading = false;
                            $scope.showAddLoginErrors = true;
                            $scope.AddLoginErrors = '';
                            if (result.errors) {
                                angular.forEach(result.errors, function (value, key) {
                                    $scope.AddLoginErrors = $scope.AddLoginErrors + value + '<br/>'
                                });
                            } else {
                                $scope.AddLoginErrors = result.Message;
                            }
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                            
                        }
                    )
                }

                $scope.UserLogin = function () {
                    $scope.errors = '';
                    $scope.showerrors = false;
                    $scope.isLoginLoading = true;
                    $.deui.login({ grant_type: 'password', username: $scope.user.email, password: $scope.user.password, rememberMe: $scope.user.rememberMe }).then(
                        function (userInfo) {
                            //All of the $.deui.common.login properties should be set at this point so just close down the dialog and resolve the promise
                            $scope.isLoginLoading = false;
                            $log.debug('Login Success');
                            if (search.redir && search.redir[0] == "/") {
                                $location.url(search.redir);
                            } else {
                                if ($rootScope.previousState && $rootScope.previousState.name && $rootScope.previousState != 'user-forgot-password') {
                                    $state.go($rootScope.previousState, $rootScope.previousParams);
                                } else {
                                    $state.go('home');
                                }
                                
                            }
                        },
                        function (objError) {
                            $scope.isLoginLoading = false;
                            $log.debug('Error: deui.login() SERVER RETURNED', objError);
                            $scope.Errors = objError.message; //+ ": " + objError.exceptionMessage ;
                            $scope.showErrors = true;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    )
                }
            }
        ]);

})();