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
       .directive('userForgotPassword', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: true,
                 controller: 'userForgotPasswordController',
                 templateUrl: '/Scripts/de/angular/User/components/forgotPassword/forgotPassword.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
