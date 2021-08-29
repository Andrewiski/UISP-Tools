(function () {

    'use strict';

    angular.module('deapp')
        .controller('invoiceRecurrenceController', [
            '$scope', '$log', 'invoiceService', 'modalService', 'deui', function ($scope, $log, invoiceService, modalService, deui) {
                $.logToConsole('invoiceRecurrenceController init');
                
                $scope.invoiceServiceCommon = invoiceService.common;

                $scope.invoiceRecurrenceDoneLoading = false;

                $scope.recurrenceData = {
                    bymonth: [{ name: "January", value: 1 },
                    { name: "Febuary", value: 2 },
                    { name: "March", value: 3 },
                    { name: "April", value: 4 },
                    { name: "May", value: 5 },
                    { name: "June", value: 6 },
                    { name: "July", value: 7 },
                    { name: "August", value: 8 },
                    { name: "September", value: 9 },
                    { name: "October", value: 10 },
                    { name: "November", value: 11 },
                    { name: "December", value: 12 }],
                    byday: [{ name: "1", value: 1 },
                    { name: "2", value: 2 },
                    { name: "3", value: 3 },
                    { name: "4", value: 4 },
                    { name: "5", value: 5 },
                    { name: "6", value: 6 },
                    { name: "7", value: 7 },
                    { name: "8", value: 8 },
                    { name: "9", value: 9 },
                    { name: "10", value: 10 },
                    { name: "11", value: 11 },
                    { name: "12", value: 12 },
                    { name: "13", value: 13 },
                    { name: "14", value: 14 },
                    { name: "15", value: 15 },
                    { name: "16", value: 16 },
                    { name: "17", value: 17 },
                    { name: "18", value: 18 },
                    { name: "19", value: 19 },
                    { name: "20", value: 20 },
                    { name: "21", value: 21 },
                    { name: "22", value: 22 },
                    { name: "23", value: 23 },
                    { name: "24", value: 24 },
                    { name: "25", value: 25 },
                    { name: "26", value: 26 },
                    { name: "27", value: 27 },
                    { name: "28", value: 28 },
                    { name: "29", value: 29 },
                    { name: "30", value: 30 },
                    { name: "31", value: 31 }],
                    frequency: [{ name: "Month", value: 1 },
                    { name: "Year", value: 0 }],
                    interval: [
                    { name: "1", value: 1 },
                    { name: "2", value: 2 },
                    { name: "3", value: 3 },
                    { name: "4", value: 4 },
                    { name: "5", value: 5 },
                    { name: "6", value: 6 },
                    { name: "7", value: 7 },
                    { name: "8", value: 8 },
                    { name: "9", value: 9 },
                    { name: "10", value: 10 },
                    { name: "11", value: 11 },
                    { name: "12", value: 12 }]
                }

                invoiceService.init().then(function () {
                    
                    if (invoiceService.common.recurrenceInvoiceList.length == 0) {
                        invoiceService.getRecurrenceInvoices().then(function(results){
                            invoiceService.common.recurrenceInvoiceList = results;
                            $scope.invoiceRecurrenceDoneLoading = true;
                        })
                    }
                })

                if (!$scope.isAdminMode) {
                    $scope.isAdminMode = "false";
                } 
                $scope.getStaticName = invoiceService.getStaticName;

                if (!$scope.invoiceRecurrence) {
                    $scope.invoiceRecurrence = {};
                }

                if ($scope.invoiceRecurrence) {
                    if ($scope.invoiceRecurrence.recurrencePattern) {
                        //We need to split the recurrencePattern as we only care about the RRRULE:
                        /*
                            DTSTART:20120115T000000Z
                            DTEND:20120115T010000Z
                            RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15 
                         
                         */
                        
                        var myvals = $scope.invoiceRecurrence.recurrencePattern.split("\n");
                        var rrule = "";
                        //rrule = $scope.invoiceRecurrence.recurrencePattern.
                        $.each(myvals, function (i,val) {
                            if (val.startsWith("RRULE:") == true) {
                                rrule = val.substr(6);
                            }
                        })
                        if (rrule != '') {
                            var myRRRule = null;
                            try{
                                myRRRule = RRule.fromString(rrule);
                                if (myRRRule.options.bymonth == null || myRRRule.options.bymonth == undefined) {
                                    myRRRule.options.bymonth = [];
                                }
                            } catch (exception) {
                                $log.warn("Error parsign Recurrence Rule " + rrule + "\n" + exception.toString())
                                myRRRule = null;
                            }
                            if (myRRRule) {
                                $scope.invoiceRecurrence.rrule = myRRRule; // { interval: myRRRule.options.interval.toString(), freq: myRRRule.options.freq.toString(), bymonthday: myRRRule.options.bymonthday.toString()};
                               
                            }
                        }
                        if ($scope.invoiceRecurrence.rrule == undefined)
                        {
                            $scope.invoiceRecurrence.rrule = new RRule({ interval: "1", freq: RRule.MONTHLY.toString(), bymonthday: ["15"], bymonth:[] });
                            
                        }

                    }

                }
                
            }
        ]);

})();