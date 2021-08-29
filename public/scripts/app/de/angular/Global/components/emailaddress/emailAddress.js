(function () {

    'use strict';
    /**
     * @ngdoc directive
     * @name deapp.address
     * @function
     *
     * @description
     * This directive will generate a widget that will allow a user to enter an Address
     */
    angular.module('deapp').directive('emailAddress', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/Scripts/de/angular/Global/components/emailaddress/emailaddress.tpl.html',
                controller: 'emailAddressController',
                replace: false,
                scope: {
                    emailAddress: '=',
                    isValid: '=',
                    id: '@'
                    },
                link: function (scope, elm, atts, c) {
                   $log.debug("emailAddress LINK");

                },
                compile: function (element, attributes) {
                    return {
                        pre: function (scope, element, attributes, controller, transcludeFn) {
                           $log.debug("emailAddress PRE COMPILE");
                        },
                        post: function (scope, element, attributes, controller, transcludeFn) {
                          $log.debug("emailAddress POST COMPILE");

                        }
                    }
                }
            };
        }
    ]);
})();