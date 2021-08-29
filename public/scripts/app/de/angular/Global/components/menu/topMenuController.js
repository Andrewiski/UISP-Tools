(function () {

    'use strict';

    angular.module('deapp')
        .controller('topMenuController', [
            '$rootScope', '$scope', '$log', 'deui', '$state', '$location', function ($rootScope, $scope, $log, deui, $state, $location) {

                // Data binding
                $scope.commonLogin = deui.common.login;
                $scope.menu = deui.common.menu;
                $scope.$state = { is: $state.is };
                
                // Functions
               
                $scope.login = login;
                $scope.logout = logout;
                $scope.register = register;
                $scope.filterTopLevelMenuItemNotLoggedIn = filterTopLevelMenuItemNotLoggedIn;
                $scope.filterTopLevelMenuItem = filterTopLevelMenuItem;
                $scope.isClientSideDebugging = deui.isClientSideDebugging;
                function filterTopLevelMenuItem(menuItem) {
                    if (menuItem.parentPageContentId == '0') {
                        if (menuItem.aspNetRole == undefined || $.deui.isUserInRoleName(menuItem.aspNetRole.name)) {
                            return true;
                        } 
                    };
                    return false;
                };
                
                function filterTopLevelMenuItemNotLoggedIn(menuItem) {
                    if (menuItem.parentPageContentId == '0') {
                        if (menuItem.roleId == '') {
                            return true;
                        }
                    };
                    return false;
                };
               

                function login () {
                    $log.debug("Header Login");
                    //$state.go('user-login');
                    var redir = $location.url();
                    $state.go("user-login", { redir: encodeURIComponent(redir) })
                    //$location.url('/deui/user/login?redir=' + encodeURIComponent(redir));

                };

                function register() {
                    $log.debug("Header Login");
                    //$state.go('user-register');
                    var redir = $location.url();
                    $state.go("user-register", { redir: encodeURIComponent(redir) })
                    //$location.url('/deui/user/register?redir=' + encodeURIComponent(redir));
                };

                function logout() {
                    $log.debug("Header Logout");
                    $.deui.logout().then(function () {
                        $log.debug("Logout Complete");
                        $state.go('user-login');
                        $scope.$apply();
                    });
                    
                };

               

            }
        ]);

})();