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
       .directive('userManageAccount', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 controller: 'userManageAccountController',
                 templateUrl: '/Scripts/de/angular/User/components/userManageAccount/userManageAccount.tpl.html',
                 link: function (scope, elm, atts, c) {
                     $.logToConsole('userManageAccount link');
                 }
              };
           }
       ]);

})();
