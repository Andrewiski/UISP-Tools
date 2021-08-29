(function () {
    'use strict';

    angular.module('deapp')
        .controller('debugMenuController', [
            '$rootScope', '$scope', '$log', '$window', 'deui', function ($rootScope, $scope, $log, $window, deui) {

                $scope.testErrorHandler = function () {
                    $log.debug("Testing Error Handler");

                    try {
                        throw new Error('Test Error Testing 123');
                    } catch (ex) {
                        $.deui.handleScriptException(ex);
                    }
                }

                $scope.alertIsUserLoggedIn = function () {
                    $log.info("alertIsUserLoggedIn");
                    try {
                        alert("deui.common.login.isUserLoggedIn:" + deui.common.login.isUserLoggedIn);
                    } catch (ex) {
                        $.deui.handleScriptException(ex);
                    }
                }

                $scope.debugPrintCommon = function () {
                    $log.debug("debugPrintCommon");

                    try {
                        $log.debug("deui.common");

                        console.dir(deui.common);

                        $log.debug("$scope.commonFoo");

                        console.dir($scope.commonFoo);
                    } catch (ex) {
                        $.deui.handleScriptException(ex);
                    }
                }

                $scope.testShowLoginDialog = function () {
                    $log.debug("debugtestShowLoginDialog");
                    try {
                        $log.debug("deui.testShowLoginDialog");

                        $.deui.showLoginDialog();
                    } catch (ex) {
                        $.deui.handleScriptException(ex);
                    }
                }

            }]);
})();