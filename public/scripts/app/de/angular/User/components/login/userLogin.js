(function () {

    'use strict';

    /**
    * @ngdoc directive
    * @name deapp.userUser
    * @restrict A
    *
    * @description This needs a description
    */
   angular.module('deapp')
       .directive('userLogin', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: true,
                 controller: 'userLoginController',
                 templateUrl: '/Scripts/de/angular/User/components/login/userLogin.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
