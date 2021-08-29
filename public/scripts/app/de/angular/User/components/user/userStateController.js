(function () {

    'use strict';

    angular.module('deapp').controller('userStateController', ['$rootScope','$state', '$stateParams', '$scope', '$log', '$q', '$location', 'deui',
        function ($rootScope, $state, $stateParams, $scope, $log, $q, $location, deui ) {
            $log.debug("userStateController init");
            if (deui.common.login.isUserLoggedIn == false) {
                $log.warn("userStateController User Not Logged In");
                $state.go('user-login');
                return;
            }
            $scope.$state = $state;
            $scope.onCustomerSave = function (customer) {
                $log.debug("userStateController onCustomerSave");
                $state.go('user.customer');
            }
        }
    ]);
})();