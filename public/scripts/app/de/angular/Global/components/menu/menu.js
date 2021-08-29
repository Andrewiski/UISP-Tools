(function () {

    'use strict';

    angular.module('deapp')
        .directive('topMenu', [
            function () {
                return {
                    restrict: 'A',
                    templateUrl: '/Scripts/de/angular/Global/components/menu/topMenu.tpl.html',
                    controller: 'topMenuController',
                    replace: true,
                    scope: true
                };
            }
        ])
        .directive('sideMenu', [
            function () {
                return {
                    restrict: 'A',
                    templateUrl: '/Scripts/de/angular/Global/components/menu/sideMenu.tpl.html',
                    controller: 'sideMenuController',
                    replace: false,
                    scope: true
                };
            }
        ])

    .directive('debugMenu', [
        function () {
            return {
                restrict: 'A',
                templateUrl: '/Scripts/de/angular/Global/components/menu/debugMenu.tpl.html',
                controller: 'debugMenuController',
                replace: true,
                scope: true
            };
        }
    ]);
})();
