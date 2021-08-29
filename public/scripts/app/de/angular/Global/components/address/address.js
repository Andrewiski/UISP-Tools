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
    angular.module('deapp').directive('deAddress', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/Scripts/de/Global/components/address/address.tpl.html',
                controller: 'deAddressController',
                replace: false,
                scope: {
                    address: '=',
                    isValid: '=',
                    id: '@'
                    },
                link: function (scope, elm, atts, c) {
                    if ($.deui.isClientSideDebugging())
                        $log.debug("deAddress LINK");

                },
                compile: function (element, attributes) {
                    return {
                        pre: function (scope, element, attributes, controller, transcludeFn) {
                            if ($.deui.isClientSideDebugging())
                                $log.debug("deAddress PRE COMPILE");

                        },
                        post: function (scope, element, attributes, controller, transcludeFn) {
                            if ($.deui.isClientSideDebugging())
                                $log.debug("deAddress POST COMPILE");

                        }
                    }
                }
            };
        }
    ]);
})();