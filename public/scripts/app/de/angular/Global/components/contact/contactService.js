(function () {

    'use strict';

    angular.module('deapp')
    .factory('contactService', ['$http', '$q', '$rootScope', '$modal', '$location', '$log', 'deui', function ($http, $q, $rootScope, $modal, $location, $log, deui) {
        var service = {};

        service.commonData = {
            contactList: [],
            contact: undefined,
            contactTypes: undefined,
            emptyContact:undefined
        }

        service.getContactList = function () {
            $log.debug('contactService getContactList Fetching Contact List');
            var deferred = $q.defer();
            var fetchPromise = deui.ajax({url:"/api/Contact"});
            fetchPromise.then(function (contactList) {
                $log.debug('contactService getContactList Got Contact List');
                service.commonData.contactList = contactList;
                deferred.resolve(contactList);
            }, function (result) {
                $log.debug('contactService getContactList Failed' + result);
                deferred.reject(result);
            });

            return deferred.promise;
        }

        service.getContact = function (ContactGuid) {
            //authService.ensureAccesstoken(false);
            $log.debug('contactService getContact Fetching Contact');
            var deferred = $q.defer();
            var fetchPromise = deui.ajax({url:"/api/Contact/" + ContactGuid});
            fetchPromise.then(function (Contact) {
                $log.debug('contactService getContact Got Contact');
                service.commonData.contact = Contact;
                deferred.resolve(Contact);
            }, function (result) {
                $log.error('contactService getContact failed ' + result);
                deferred.reject(result);
            });
            return deferred.promise;
        }

        service.showContactDialog = function (contact, options) {
            $log.debug('contactService.showContactModal');

            if (contact == undefined) {
                contact = {};
            }
            if (options == undefined) {
                options = {};
            }

            //we clone contact into newcontact as the user has the option to cancel the change
            var contactclone = {};
            
            angular.extend(contactclone, contact)

            options.contact = contactclone;

            var deferred = $q.defer();

            var contactModalInstanceCtrl = function ($scope, $modalInstance, $http, options) {

                //Set the properties on the scope so they can be accessed from the html mark up
                var defaultOptions = {
                }

                angular.extend(defaultOptions, options)
                angular.extend($scope, defaultOptions)
            };

            var contactModalInstance = $modal.open({
                controller: contactModalInstanceCtrl,
                templateUrl: '/Scripts/de/Global/components/contact/modal/contact.modal.html',
                backdrop: 'static',
                fade: false,
                animate: false,
                dialogClass: 'modal',
                backdropClass: 'modal-backdrop',
                windowClass: "modal fade in",
                size:'lg',
                //this is how we pass data to the Controller defined above
                resolve: {
                    options: function () {
                        return options;
                    }

                }

            });

            //the Result is the cloneContact 
            contactModalInstance.result.then(function (result) {
                $log.debug('contactService.showContactModal contactModalInstance.result.then.resolved');

                //apply the changes to the contact object
                angular.extend(contact, result)
                deferred.resolve(contact);

            }, function (reason) {
                $log.debug('contactService.showContactModal contactModalInstance.result.then.rejected');

                //The user Clicked the Cancel button so we need to call the reject on the promise
                $log.debug('Contact Modal dismissed at: ' + new Date());

                deferred.reject(reason);
                
            });

          
            // promise leaving us in control of that based on the user button clicks that are set above
            return deferred.promise;
        };

        service.getEmptyContact = function () {
            $log.debug('contactService getEmptyContact');
            var deferred = $q.defer();

            if (service.commonData.emptyContact == undefined) {
                //we could go fetch this from the server but we will try it this way instead.
                var Empty = { contactyType: { name: '' }, emailAddresses:[], phones:[], addresses:[] };
                service.commonData.emptyContact = Empty;
                var cloneEmpty = {};
                angular.extend(cloneEmpty, service.commonData.emptyContact)
                deferred.resolve(cloneEmpty);

            } else {
                var cloneEmpty = {};
                angular.extend(cloneEmpty, service.commonData.emptyContact)
                deferred.resolve(cloneEmpty);
            }

            return deferred.promise;

        }

        service.getContactTypes = function () {
            $log.debug('ContactService getContactTypes');
            var deferred = $q.defer();

            if (service.commonData.contractTypes == undefined) {
                var fetchPromise = deui.ajax({ url: '/api/ContactType' });
                fetchPromise.then(function (ContactTypes) {
                    $log.debug('Got ContactType List');
                    service.commonData.contactTypes = ContactTypes;
                    deferred.resolve(service.commonData.contactTypes);
                }, function (result) {
                    $log.error('ContactService getContactTypes Failed');
                    deferred.reject(result);
                });
            } else {
                deferred.resolve(service.commonData.contactTypes);
            }

            return deferred.promise;
        }

        //this runtion will init the common data by prefetching the data if it hasn't already been fetched
        //If two controls on the page call this function only the first will fetch the rest will be cached
        service.initCommonData = function () {
            $log.debug('contactService initCommonData');
            var deferred = $q.defer();

            $q.all([
                 service.getContactTypes(),
                 service.getEmptyContact()

            ]).then(function (result) {
                deferred.resolve(result);
            },
            function (result) {
                deferred.reject(result);
            }
            );

            return deferred.promise;
        }

        return service;
    }])
})();