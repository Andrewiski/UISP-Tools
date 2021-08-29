(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceContactController', [
            '$scope', 'invoiceService', '$http', function ($scope,  invoiceService, $http) {
                $.logToConsole('invoiceContactController init');
                var tabIndex;
                if (isNaN($scope.tabindex)) {
                    tabIndex = 100
                } else {
                    tabIndex = parseInt($scope.tabindex);
                }
                $scope.addressSearch = false;
                $scope.address = { selected: { formatted_address: ''}};
                $scope.refreshAddresses = function (address) {
                    if (address) {
                        var params = { address: address, sensor: false };
                        return $http.get(
                          'http://maps.googleapis.com/maps/api/geocode/json',
                          { params: params }
                        ).then(function (response) {
                            $scope.addresses = response.data.results
                        });
                    }
                };
                $scope.getTabIndex = function(index){
                    return (tabIndex + index).toString();
                }
                $scope.addressSelected = function ($item, $model, contact) {
                    $.logToConsole("addressSelected");
                    var stnum = '';
                    var stname = '';
                    var city = '';
                    var state = '';
                    var zip = '';
                    var addressLine2 = '';
                    var addressLine3 = '';
                    for (var i = 0; i < $model.address_components.length; i++) {
                        var type = $model.address_components[i].types[0]
                        switch (type) {
                            case "street_number":
                                stnum = $model.address_components[i].short_name;
                                break;
                            case "route":
                                stname = $model.address_components[i].short_name;
                                break;
                            case "locality":
                                city = $model.address_components[i].short_name;
                                break;
                            case "administrative_area_level_1":
                                state = $model.address_components[i].short_name;
                                break;
                            case "premise":
                                addressLine3 = $model.address_components[i].short_name;
                                break;
                            case "subpremise":
                                addressLine2 = '#' + $model.address_components[i].short_name;
                                break;
                            case "postal_code":
                                zip = $model.address_components[i].short_name;
                                break;
                        }
                    }
                    contact.address = stnum + ' ' + stname;
                    contact.address2 = addressLine2;
                    contact.address3 = addressLine3;
                    contact.city = city;
                    contact.state = state;
                    contact.zip = zip;
                    $scope.addressSearch = false;
                }
                $scope.enableAddressSearch = function () {
                    $scope.refreshAddresses(invoiceService.getContactFormatedAddress($scope.contact));
                    $scope.address.selected.formatted_address = invoiceService.getContactFormatedAddress($scope.contact);
                    
                    $scope.addressSearch = true;
                    $scope.$broadcast('Contact_AddressSearch');
                }
            }
        ]);

})();