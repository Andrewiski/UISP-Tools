(function () {

    'use strict';

    angular.module('deapp').controller('invoiceCustomersAdminStateController', ['$rootScope','$state', '$stateParams', '$scope', '$log', '$q', 'deui', 'invoiceService',
        function ($rootScope, $state, $stateParams, $scope, $log, $q, deui, invoiceService) {
            $log.debug("invoiceCustomersAdminStateController init");
            $scope.$state = $state;
            $scope.invoiceServiceCommon = invoiceService.common;
            //$scope.onCustomerSave = function (customer) {
            //    $state.go('admin.invoicecustomers.customer', { customerGuid: $state.params.customerGuid });
            //}
            if ($.deui.isUserInRoleName('admin') == false) {
                $.deui.showErrorDialog({
                    error: $.deui.getErrorAccessIsDenied("User is not an Admin!"),
                    showRetry: false,
                    showCancel:false,
                }
                ).then(
                    function () {
                        $.logToConsole("Redirecting to previousState from Access is denied")
                        
                        $state.go($rootScope.previousState);
                    }
                )
            } else {
                $scope.invoiceCustomersAdminDoneLoading = false;
                //$.deui.common.menu.subMenuItems = [
                //    { linkUrl: '/deui/Admin/Invoices', linkText: 'Invoices', linkTarget: '_self' },
                //    { linkUrl: '/deui/Admin/InvoiceCustomers', linkText: 'Customers', linkTarget: '_self' },
                //    { linkUrl: '/deui/Admin/InvoiceCustomers/InvoiceCustomer/new', linkText: 'New Customer', linkTarget: '_self' },
                //]

                //Init Happens Here
                $scope.invoiceCustomersAdminDoneLoading = false;
                invoiceService.init().then(function () {
                    $scope.invoiceCustomersAdminDoneLoading = true;
                })
                
            }
            //

            //$.logToConsole("pageContentController init");

            //if ($scope.pageContentGuid) {
            //    pageContentService.getPageContentByGuid($scope.pageContentGuid).then(
            //        function (pageContent) {
            //            $scope.pageContent = pageContent;
            //            $scope.doneLoading = true;
            //        }
            //    )
            //}
        }
    ]);
})();