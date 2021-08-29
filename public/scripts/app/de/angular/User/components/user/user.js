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
       .directive('userUser', [
           function () {
              return {
                 require: '?ngModel',
                 restrict: 'A',
                 replace: true,
                 scope: {
                     user: "=?",
                     viewName: "=?"
                 },
                 controller: 'userUserController',
                 templateUrl: '/Scripts/ctmangular/User/js/components/user/user.tpl.html',
                 link: function (scope, elm, atts, c) {
                     scope.getViewUrl = function () {
                         if (scope.viewName == undefined) {
                             scope.viewName = attrs.viewName;
                         }
                         switch (scope.viewName) {
                             case "edit":
                                 return "/App/User/js/user/user-edit.tpl.html";
                             default:
                                 return "/App/User/js/user/user.tpl.html";
                         }

                     }
                 }
              };
           }
       ]);

})();
