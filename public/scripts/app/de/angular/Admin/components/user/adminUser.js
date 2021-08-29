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
       .directive('adminUser', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope:true,
                 controller: 'adminUserController',
                 templateUrl: '/Scripts/de/angular/Admin/components/user/adminUser-edit.tpl.html',
                 link: function (scope, elm, atts, c) {
                     $.logToConsole("adminUserController init");
                 }
              };
           }
       ]);

})();
