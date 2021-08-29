(function () {
    'use strict';

    angular.module('deapp')
        .controller('sideMenuController', [
            '$rootScope', '$scope', '$state', '$log',  '$window', 'deui', function ($rootScope, $scope, $state, $log, $window, deui) {
                
                // Data binding
                $scope.commonLogin = deui.common.login;
                $scope.menu = deui.common.menu;

                //$scope.$parent.sideMenu = $scope.sideMenu
                //$rootScope.sideMenu = $scope.sideMenu;

                $scope.onlyActiveMenuSubMenus = onlyActiveMenuSubMenus;

                $scope.$watch(windowHash, windowHashChangedHandler);


                var defaultMenu = { pageContentId: 1 }


                function onlyActiveMenuSubMenus(menuItem) {
                    if (deui.common.menu.currentMenu != null && (menuItem.parentPageContentId == deui.common.menu.currentMenu.pageContentId ||
                        
                        (menuItem.pageContentId == deui.common.menu.currentMenu.parentPageContentId && menuItem.parentPageContentId != 0 ))) {
                        return true;
                    }
                    return false;
                }               
                                              
                function windowHash() {
                    return $window.location.hash;
                }

                function windowHashChangedHandler(newValue) {
                    var activeMenu;
                    
                    activeMenu = _.find(deui.common.menu.menuItems, function (menuItem) {
                        return menuItem.linkUrl == newValue;
                    });
                    

                    if (!activeMenu) {
                        activeMenu = deui.common.menu.menuItems[0];
                    }

                    deui.common.menu.currentMenu = activeMenu;
                    $scope.pageHash = newValue;
                }

               
            }
        ]);

})();