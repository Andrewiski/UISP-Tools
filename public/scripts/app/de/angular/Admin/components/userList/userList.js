(function () {

   'use strict';

    /**
    * @ngdoc directive
    * @name deapp.userList
    * @restrict A
    *
    * @description This needs a description
    */
   angular.module('deapp')
       .directive('userList', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: true,
                 controller: 'userListController',
                 templateUrl: '/Scripts/de/angular/Admin/components/userList/userList.tpl.html',
                 link: function (scope, elm, atts, c) {

                 }
              };
           }
       ]);

})();
