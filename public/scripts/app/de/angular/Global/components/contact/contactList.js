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
    angular.module('deapp').directive('deContactList', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/Scripts/de/Global/components/contact/contactList.tpl.html',
                controller: 'deContactListController',
                replace: false,
                scope: {
                    contactList: '=?',
                    contactType: '=?'
                    },
                link: function (scope, elm, atts, c) {
                        $log.debug("deContactList Link");

                },
                compile: function (element, attributes) {
                    return {
                        pre: function (scope, element, attributes, controller, transcludeFn) {
                           $log.debug("ctmContactList PRE COMPILE");

                        },
                        post: function (scope, element, attributes, controller, transcludeFn) {
                                $log.debug("ctmContactList POST COMPILE");

                        }
                    }
                }
            };
        }
    ]);
})();