(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceListAdminController', [
            '$scope', '$log', '$location', 'invoiceService', function ($scope, $log, $location, invoiceService) {
                $log.debug("invoicesListAdminController init");
                
                $scope.invoiceListDoneLoading = false;
            
                $scope.invoiceServiceCommon = invoiceService.common;

                
                //var startDate = new Date();
                //startDate.setDate(1)
                //startDate.setMonth(startDate.getMonth() - 6);

                $scope.customerSearchList = [];
                $scope.refreshCustomers = function (nameSearch) {
                    invoiceService.getCustomersSearch(nameSearch).then(
                        function (customers) {
                            $scope.customerSearchList = customers;
                        }
                    )
                }

                $scope.invoiceListRequest = { invoiceStatusId: -1, invoiceTypeId: 1, startDate: null, stopDate: null, customerGuid: null };

               



                

             

            $scope.getStaticName = invoiceService.getStaticName;

            
            var searchData = $location.search();
            if (searchData.invoiceStatusId) {
                $scope.invoiceListRequest.invoiceStatusId = parseInt(searchData.invoiceStatusId);
            }
            if (searchData.startDate) {
                $scope.invoiceListRequest.startDate = searchData.startDate;
            }
            if (searchData.stopDate) {
                $scope.invoiceListRequest.stopDate = searchData.stopDate;
            }
            if (searchData.customerGuid) {
                $scope.invoiceListRequest.customerGuid = searchData.customerGuid;
            }   

            $scope.refreshInvoices = function () {

                $scope.invoiceListDoneLoading = false;
                //Set the Search Params So we can BookMark and return 
                $location.search("invoiceStatusId", $scope.invoiceListRequest.invoiceStatusId);
                $location.search("customerGuid", $scope.invoiceListRequest.customerGuid);
                $location.search("startDate", $scope.invoiceListRequest.startDate);
                $location.search("stopDate", $scope.invoiceListRequest.stopDate);
                
                invoiceService.getAdminInvoiceList($scope.invoiceListRequest).then(
                    function (Invoices) {
                        $scope.invoiceList = Invoices;
                        $scope.invoiceListDoneLoading = true;
                        
                    }
                )
            }



            //Init Happens Here
            
            invoiceService.init().then(function () {
                $scope.invoiceStatusListSearch = angular.copy(invoiceService.common.statics.invoiceStatusList);
                $scope.invoiceStatusListSearch.push({ invoiceStatusId: -1, name: "All" });

                if (searchData.startDate || searchData.stopDate || searchData.customerGuid) {
                    invoiceService.getAdminInvoiceList($scope.invoiceListRequest).then(
                        function (Invoices) {
                            $scope.invoiceList = Invoices;
                        }
                    );
                }


                $scope.invoiceListDoneLoading = true;
            })
                

            }
        ]);

})();