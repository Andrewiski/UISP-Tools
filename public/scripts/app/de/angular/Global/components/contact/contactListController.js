(function () {

    'use strict';

    angular.module('deapp').controller('deContactListController', ['$scope', '$log', '$q', 'contactService',
        function ($scope, $log, $q, contactService) {
            $scope.doneLoading = false;
            $log.debug("contactListController init");
            if ($scope.contactList == undefined) {
                contactService.getContactList().then(function (result) {
                    $scope.contactList = result;
                    $scope.doneLoading = true;
                })
            } else {
                $scope.doneLoading = true;
            }
            
            $scope.showContactDialog = function (contact) {
                contactService.showContactDialog(contact).then(
                    function (result) {
                        if (contact == undefined) {
                            $scope.contactList.push(result);
                        } else {
                            //WE do nothing here as we should have passed in a ref to an object alrady on the list so
                            // it already updated
                        }
                    }

                )
            }
            

            



            
        }
    ]);
})();