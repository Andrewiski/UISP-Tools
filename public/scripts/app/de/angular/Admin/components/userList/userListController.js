(function () {

    'use strict';

    angular.module('deapp')
        .controller('userListController', [
            '$scope',  function ($scope ) {
                $scope.doneLoading = false;
                $.deui.getUsers().then(function (users) {
                    $scope.doneLoading = true;
                    $scope.users = users;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                });
            }
        ]);

})();