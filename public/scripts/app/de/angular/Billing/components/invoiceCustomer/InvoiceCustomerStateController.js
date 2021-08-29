(function () {

    'use strict';

    angular.module('deapp').controller('invoiceCustomerStateController', ['$rootScope','$state', '$stateParams', '$scope', '$log', '$q', 'deui', 'invoiceService',
        function ($rootScope, $state, $stateParams, $scope, $log, $q, deui, invoiceService) {
            $log.debug("invoiceCustomerStateController init");
            $scope.$state = $state;
            $scope.invoiceServiceCommon = invoiceService.common;
            invoiceService.init().then(function () {
                $scope.invoiceCustomersAdminDoneLoading = true;
            })
            $scope.onCustomerSave = function (customer) {
                $log.debug("invoicesStateController onCustomerSave");
                $state.go('admin.invoicecustomers.customer', { customerGuid: $state.params.customerGuid });
            }
        }
    ]);
})();