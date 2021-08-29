(function () {

    'use strict';

    angular.module('deapp').controller('deContactController', ['$rootScope', '$scope', '$log', '$q', 'contactService', 'addressService', 'emailAddressService',
        function ($rootScope, $scope, $log, $q, contactService, addressService, emailAddressService) {
            $log.debug("contactController init");
            $scope.doneLoading = false;
            var defaultOptions = {
                showCompanyName: true,
                showAddresses: true,
                showAddAddress: true, //show the add addresses button
                showAddressOfType: [], //this is the list of address types to show empty means all, if populated only Addresses of this type are shown
                showEmptyAddressTypes:false, // if true then the showAddressesOfType list is use to control which empty types are shown if list is empty then all are shown
                showPhones: true,
                showAddPhone:true,
                showPhoneOfType: [], //this is the list of phone number types to show empty means all, if populated only Phone Number of this type are shown
                showEmptyPhoneTypes: false, // if true then the showPhoneNumberOfType list is use to control which empty types are shown if list is empty then all are shown
                showEmailAddresses: true,
                showAddEmailAddress: true,
                showEmailAddressOfType: [], //this is the list of Email Address types to show empty means all, if populated only Email Address of this type are shown
                showEmptyEmailAddressTypes: false, // if true then the showEmailAddressOfType list is use to control which empty types are shown if list is empty then all are shown
                defaultEmailAddressTypeName: 'Home'

            }
            //$scope.options is passed through via the directive and may be undefined
            if ($scope.options == undefined) {
                $scope.options = {};
            }

            angular.extend(defaultOptions, $scope.options);
            $scope.options = defaultOptions;

            //wire the emailAddressService.getEmailAddresses to the $scope so we can call it from our template
            $scope.findEmailAddressesByType = emailAddressService.findEmailAddressesByType;

            $q.all([
                 contactService.initCommonData(),
                 addressService.initCommonData(),
                 emailAddressService.initCommonData()
            ]).then(function () {
                if ($scope.options.showEmailAddressOfType == undefined || $scope.options.showEmailAddressOfType.length == 0) {
                    $scope.options.showEmailAddressOfType = emailAddressService.commonData.emailAddressTypes;
                }
                //If contact is undefined init it with contactService.getEmptyContact();
                if ($scope.contact == undefined) {
                    contactService.getEmptyContact().then(function (result) {
                        $scope.contact = result;
                        $scope.doneLoading = true;
                    });
                } else {
                    $scope.doneLoading = true;
                }
                
            }, function (result) {
                $log.error('contractController fatal error on Init ' + result);
            })

            $scope.addPhone = function () {
                $log.debug("contactController addPhone");
            }
            $scope.addAddress = function () {
                $log.debug("contactController addAddress");
                addressService.getEmptyAddress().then(function (result) {
                    $scope.contact.addresses.push(result);
                });
            }
            $scope.addEmailAddress = function () {
                $log.debug("contactController addEmailAddress");
                emailAddressService.getEmptyEmailAddress().then(function (result) {
                    result.emailAddressType = emailAddressService.findEmailAddressType($scope.options.defaultEmailAddressTypeName);
                    $scope.contact.emailAddresses.push(result);
                });
            }
        }
    ]);
})();