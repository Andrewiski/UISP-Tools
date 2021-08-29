(function () {

    'use strict';
    /**
     * @ngdoc directive
     * @name deapp.contact
     * @function
     *
     * @description
     * This directive will generate a widget that will allow a user to enter a Contact
     */
    angular.module('deapp').directive('deContact', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/Scripts/de/Global/components/contact/contact.tpl.html',
                controller: 'deContactController',
                replace: false,
                scope: {
                    contact: '=', //mandatory two way databinding
                    options: '&?'  //optional one way databinding
                    },
                link: function (scope, elm, atts, c) {
                        $log.debug("deContact LINK");

                },
                compile: function (element, attributes) {
                    return {
                        pre: function (scope, element, attributes, controller, transcludeFn) {
                                $log.debug("deContact PRE COMPILE");

                        },
                        post: function (scope, element, attributes, controller, transcludeFn) {
                                $log.debug("deContact POST COMPILE");

                        }
                    }
                }
            };
        }
    ]);
})();