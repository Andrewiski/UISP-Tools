(function () {

    'use strict';

    angular.module('deapp')
    .factory('invoiceService', ['$http', '$q',  '$log',  'deui', 'modalService', function ($http, $q, $log, deui, modalService) {
        var service = {};
        $.logToConsole('invoiceService Created');
        var inited = { isInited: false, deferred: $q.defer() };
        service.common = {
            invoice: null,
            invoiceList: [],
            merchantSettings: null,
            statics: {
                invoicePaymentTypeList:[],
                invoiceProcessingStatusList:[],
                invoiceProcessingTypeList:[],
                invoiceRecurrenceStatusList:[],
                invoiceTransactionServiceTypeList:[],
                invoiceTransactionStatusList:[],
                invoiceTransactionTypeList:[],
                invoiceStatusList:[],
                invoiceItemStatusList:[],
                invoiceTypeList: [],
                invoiceTermTypeList: [],
                invoiceTaxRateTypeList:[],
                customerStatusList:[]

            },
            recurrenceInvoiceList: [],
        }

        service.init = function () {

            if (inited.isInited == false) {
                inited.isInited = true;
                $.logToConsole('invoiceService initing');
                $q.all([
                    service.getMerchantSettings(),
                    service.getInvoiceStatics()
                ]).then(function () {
                    inited.deferred.resolve();
                }, function () {
                    inited.isInited = false;
                    inited.deferred.reject($.deui.createErrorFromScriptException('invoiceService Init Failed'));
                }

                )
            }
            return inited.deferred.promise;
        }

        service.payInvoices = function (payInvoiceData) {
            
            $.logToConsole('invoiceService payInvoices');
            var deferred = $q.defer();
            //if (productSearch || productSearch != '') {
            //validate the paymnetinfo
            var validationErrors = '';
            switch (payInvoiceData.invoicePaymentInfo.invoicePaymentType) {
                case 1: //creditcard
                    if (service.validateCreditCardNumber(payInvoiceData.invoicePaymentInfo.creditcard.creditCardNumber) == false) {
                        validationErrors = validationErrors + "Invalid Credit Card Number<br/>";
                    }
                    if (service.validateCreditCardExpirationDate(payInvoiceData.invoicePaymentInfo.creditcard.creditCardExp) == false) {
                        validationErrors = validationErrors + "Invalid Credit Card Expiration<br/>";
                    }
                    if (service.validateCreditCardCode(payInvoiceData.invoicePaymentInfo.creditcard.creditCardCode) == false) {
                        validationErrors = validationErrors + "Invalid Credit Card Code<br/>";
                    }
                    if (validationErrors.length > 0) {
                        deferred.reject($.deui.createError(validationErrors, validationErrors, "Client Error", validationErrors, 500));
                        return;
                    }
                    break;
            }
            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/PayInvoices',
                    data:  payInvoiceData 
                }

            ).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
           
            return deferred.promise;
        }

        service.validateCreditCardNumber = function (creditCardNumber) {
            
            try {
                // Luhn Algorithm 
                var cardNumber = (creditCardNumber || '').replace(/\D/g, ''),
                len = cardNumber.length,
                mul = 0,
                prodArr = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 2, 4, 6, 8, 1, 3, 5, 7, 9]],
                sum = 0;

                while (len--) {
                    sum += prodArr[mul][parseInt(cardNumber.charAt(len), 10)];
                    mul ^= 1;
                }

                var isValid = (sum % 10 === 0 && sum > 0) && cardNumber.length === 16;
                return isValid;
            } catch (ex) {
                return false;
            }
            
        }
        service.validateCreditCardExpirationDate = function (creditCardExpirationDate) {

            try {
                var expDate = creditCardExpirationDate;
                var isValid = true;
                var isValidMonth = true;
                var isValidYear = true;
                var isCardExpired = false;
                if (expDate.length != 9) {
                    isValid = false;
                } else {
                    if (expDate[3] != '/') {
                        isValid = false;
                    }
                    var myMonth = expDate.substring(0, 2);
                    var myYear = expDate.substring(5, 9);
                    var intMonth = 0;
                    var intYear = 0;
                    var currentMonth = new Date().getMonth() + 1;  //getMonth is Zero Based so + 1
                    var currentYear = new Date().getFullYear();
                    if ($.isNumeric(myMonth)) {
                        intMonth = parseInt(myMonth);
                        if (intMonth < 1 || intMonth > 12) {
                            isValidMonth = false;
                        }
                    } else {
                        isValidMonth = false;
                    }

                    if ($.isNumeric(myYear)) {
                        intYear = parseInt(myYear);
                        if (intYear < currentYear) {
                            isValidYear = false;
                        }
                        if (intYear > (currentYear + 8)) {
                            //Credit Card should not be valid for more then 8 years in the future
                            isValidYear = false;
                        }
                    } else {
                        isValidYear = false;
                    }
                    if (isValidYear && isValidMonth) {
                        if (intYear == currentYear && intMonth < currentMonth) {
                            //Card isExpired
                            isCardExpired = true;
                        }
                    }
                }

                if (isCardExpired == true || isValidMonth == false || isValidYear == false) {
                    isValid = false;
                }
                return isValid;
            } catch (ex) {
                return false;
            }
        }
        service.validateCreditCardCode = function (creditCardCode) {
            var isValid = true;
            if ($.isNumeric(creditCardCode)) {
                if (creditCardCode.length < 3) {
                    isValid = false;
                } else {
                    isValid = true;
                }

            } else {
                isValid = false;
            }
        }


        service.getMerchantSettings = function(){
            
            $.logToConsole('invoiceService getMerchantSettings');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "GET",
                    url: '/api/Billing/Invoice/MerchantSettings'
                }

            ).then(
                function (result) {
                    service.common.merchantSettings =  result;
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );    
            return deferred.promise;
        }

        service.getCustomersSearch = function (nameSearch) {

            $.logToConsole('invoiceService getCustomers');
            var deferred = $q.defer();
            //if (nameSearch || nameSearch != '') {
                deui.ajax(
                    {
                        method: "POST",
                        url: '/api/Billing/Admin/CustomerSearch',
                        data: { nameSearch: nameSearch }
                    }

                ).then(
                    function (result) {
                        deferred.resolve(result);
                    },
                    function (result) {
                        deferred.reject(result);
                    }
                );
            //} else {
            //    //if the search is blank return an empty list
            //    deferred.resolve([]);
            //}
            return deferred.promise;
        }
        service.getInvoiceSubTotal = function (invoice) {
            //$.logToConsole('invoiceService getInvoiceSubTotal');
            var retval = 0.00
            if (invoice && invoice.invoiceItems) {
                for (var i = 0; i < invoice.invoiceItems.length; i++) {
                    var invoiceItem = invoice.invoiceItems[i];
                    if (invoiceItem.invoiceItemStatusId != 0 && invoiceItem.isItemTotaled != false && invoiceItem.price) {
                        retval = retval + (invoiceItem.price * invoiceItem.quantity);
                    }
                }
            }
            //$.logToConsole('invoiceService getInvoiceSubTotal ' + retval);
            return retval;
        }
        service.getInvoiceTax = function (invoice) {
            //$.logToConsole('invoiceService getInvoiceSubTotal');
            var retval = 0.00
            if (invoice && invoice.invoiceItems && invoice.taxExempt != true) {
                for (var i = 0; i < invoice.invoiceItems.length; i++) {
                    var invoiceItem = invoice.invoiceItems[i];
                    if (invoiceItem.invoiceItemStatusId != 0 && invoiceItem.isItemTotaled != false && invoiceItem.price && invoiceItem.taxExempt != true) {
                        retval = retval + ((invoiceItem.price * invoiceItem.quantity) * invoice.taxRatePercentage);
                    }
                }
            } else {
                return 0.00;
            }

            //$.logToConsole('invoiceService getInvoiceSubTotal ' + retval);
            return retval;
        }

        service.getInvoiceSubTotal = function (invoice) {
            //$.logToConsole('invoiceService getInvoiceSubTotal');
            var retval = 0.00
            if (invoice && invoice.invoiceItems) {
                for (var i = 0; i < invoice.invoiceItems.length; i++) {
                    var invoiceItem = invoice.invoiceItems[i];
                    if (invoiceItem.invoiceItemStatusId != 0 && invoiceItem.isItemTotaled != false && invoiceItem.price) {
                        retval = retval + (invoiceItem.price * invoiceItem.quantity);
                    }
                }
            }
            //$.logToConsole('invoiceService getInvoiceSubTotal ' + retval);
            return retval;
        }

        service.getContactFormatedAddress = function (contact) {
            if (contact) {
                return contact.address + (contact.address2 ? ' ' + contact.address3 : '') + (contact.address3 ? ' ' + contact.address3 : '') + ' ' + contact.city + ", " + contact.state + " " + contact.zip + " " + contact.country;
            } else {
                return "";
            }
            
        }

        service.getContactFormatedName = function (contact) {
            if (contact) {
                var name;
                if (contact.companyName) {
                    name = contact.companyName;
                } else {
                    name = contact.firstName + ' ' + contact.lastName;
                }
                return name;
            } else {
                return "";
            }

        }

        service.getInvoiceItem = function(){
            return { "description": "", "invoiceItemStatusId": 1, "isItemCounted": true, "isItemTotaled": true, "isPackage": false, "isPackageItem": false, "itemId": -1, "itemTableName": "", "name": "", "packageId": -1, "price": 0.00, "productNumber": "", "quantity": 1, "taxExempt": false, "invoiceItemStatus": null };
        }
        service.getInvoiceTotal = function (invoice) {
            
            var retval = 0.00
            if (invoice && invoice.invoiceItems) {
                retval = retval + service.getInvoiceSubTotal(invoice);
                if (invoice.shippingCharge) {
                    retval = retval + invoice.shippingCharge;
                }
                //if (invoice.tax) {
                retval = retval + service.getInvoiceTax(invoice); //invoice.tax;
                //}
                if (invoice.dutyCharge) {
                    retval = retval + invoice.dutyCharge;
                }
            }
            //$.logToConsole('invoiceService getInvoiceTotal ' + retval);
            return retval;
        }
        service.getProductsSearch = function (productSearch) {

            $.logToConsole('invoiceService getProductsSearch');
            var deferred = $q.defer();
            //if (productSearch || productSearch != '') {
                deui.ajax(
                    {
                        method: "POST",
                        url: '/api/Product/Search',
                        data: { Search: productSearch }
                    }

                ).then(
                    function (result) {
                        deferred.resolve(result);
                    },
                    function (result) {
                        deferred.reject(result);
                    }
                );
            //} else {
            //    //if the search is blank return an empty list
            //    deferred.resolve([]);
            //}
            return deferred.promise;
        }

        service.getStaticName = function (listName, id) {
            if (service.common.statics[listName + "_keys"] && id != undefined && id != null) {
                return service.common.statics[listName + "_keys"][id.toString()]
            } else {
                return null;
            }
        }

        service.getStaticId = function (listName, name) {
            if (service.common.statics[listName + "_values"] && name) {
                return service.common.statics[listName + "_values"][name]
            } else {
                return null;
            }
        }

        service.getRecurrenceInvoices = function () {
            
            $.logToConsole('invoiceService getRecurrenceInvoices');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "GET",
                    url: 'api/Billing/Admin/Recurrence/InvoiceList'
                }

            ).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }
        service.getCustomers = function () {

            $.logToConsole('invoiceService getCustomers');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "GET",
                    url: '/api/Billing/Admin/Customers'
                }

            ).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }
        service.getCustomersByUserID = function (UserID) {

            $.logToConsole('invoiceService getCustomersByUserID');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "GET",
                    url: '/api/Billing/Admin/Customers/' + UserID
                }

            ).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }
        service.deleteUserAdmin = function (UserID) {

            $.logToConsole('invoiceService getCustomersByUserID');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "DELETE",
                    url: '/api/Account/Admin/User/' + UserID
                }

            ).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }


        service.sendEmailAdmin = function (sendEmailRequest) {

            $.logToConsole('invoiceService sendEmailAdmin');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/Admin/SendEmail',
                    data:sendEmailRequest
                }

            ).then(
                function (result) {
                    if (result.success == true) {
                        deferred.resolve(result);
                    } else {
                        deferred.reject(result);
                    }
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.getCustomerByGuidAdmin = function (CustomerGuid) {

            $.logToConsole('invoiceService getCustomerByGuidAdmin');
            var deferred = $q.defer();

            deui.ajax({url:'/api/Billing/Admin/Customer/'+CustomerGuid}).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.getCustomerForLoggedInUser = function () {

            $.logToConsole('invoiceService getCustomerForLoggedInUser');
            var deferred = $q.defer();

            deui.ajax({ url: 'api/Billing/Customer' }).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }
        service.getInvoiceStatics = function(){
            
            $.logToConsole('invoiceService getInvoiceStatics');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "GET",
                    url: '/api/Billing/Invoice/InvoiceStatics'
                }

            ).then(
                function (result) {
                    service.common.statics =  result;
                    for(var propertyName in result) {
                        var enumList = result[propertyName];
                        var keys = service.common.statics[propertyName + "_keys"] = {};
                        var values = service.common.statics[propertyName + "_values"] = {};
                        for (var i = 0; i < enumList.length; i++) {
                            var enumvalue = enumList[i];
                            var key;
                            var value;
                            for (var propName in enumvalue) {
                                if (propName.endsWith("Id")) {
                                    key = enumvalue[propName];
                                } else {
                                    value = enumvalue[propName];
                                }
                            }
                            
                            keys[key.toString()] = value;
                            values[value] = key;
                        }
                    }
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );    
            return deferred.promise;
        }

        service.payInvoices = function (data) {

            $.logToConsole('invoiceService payInvoices');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/PayInvoices',
                    data:data
                }

            ).then(
                function (result) {
                    if (result.success == true) {
                        deferred.resolve(result);
                    } else {
                        deferred.reject(result);
                    }
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.saveAdminInvoice = function (invoice) {

            $.logToConsole('invoiceService saveInvoice');
            invoice.tax = service.getInvoiceTax(invoice);
            invoice.total = service.getInvoiceTotal(invoice);
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/Admin/Invoice',
                    data: invoice
                }

            ).then(
                function (result) {
                    //does not return an Invoice but a SaveAdminInvoiceResponse
                    if (result.success == true) {
                        deferred.resolve(result);
                    } else {
                        deferred.reject(result);
                    }
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.saveCustomer = function (customer) {

            $.logToConsole('invoiceService saveCustomer');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/Customer',
                    data: customer
                }

            ).then(
                function (result) {
                   
                  deferred.resolve(result);
                    
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.saveAdminUser = function (user) {

            $.logToConsole('invoiceService saveAdminUser');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Account/Admin/User',
                    data: user
                }

            ).then(
                function (result) {

                    deferred.resolve(result);

                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }
        service.saveAdminUserPassword = function (userPassword) {

            $.logToConsole('invoiceService saveAdminUserPassword');
            var deferred = $q.defer();
            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Account/Admin/UserPassword',
                    data: userPassword
                }

            ).then(
                function (result) {

                    deferred.resolve(result);

                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.getInvoiceByGuidAdmin = function (InvoiceGuid) {
            
            $.logToConsole('invoiceService getInvoiceByGuid');
            var deferred = $q.defer();

            deui.ajax({ url: '/api/Billing/Admin/Invoice/' + InvoiceGuid }).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.getInvoiceByGuid = function (InvoiceGuid) {

            $.logToConsole('invoiceService getInvoiceByGuid');
            var deferred = $q.defer();

            deui.ajax({ url: '/api/Billing/Invoice/' + InvoiceGuid, method:'GET' }).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.getInvoicePaymentInfoByGuidAdmin = function (InvoicePaymentGuid) {

            $.logToConsole('invoiceService getInvoicePaymentInfoByGuidAdmin');
            var deferred = $q.defer();

            deui.ajax({ url: '/api/Billing/Admin/InvoicePaymentInfo/' + InvoicePaymentGuid }).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.deleteCustomerInvoicePaymentInfo = function (options) {
            
            $.logToConsole('invoiceService deleteCustomerInvoicePaymentInfo');
            var deferred = $q.defer();

            deui.ajax({ url: '/api/Billing/Customer/' + options.customerGuid + '/PaymentInfo/Delete/' + options.customerInvoicePaymentGuid }).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }


        service.executeCustomerInvoiceRecurrence = function (options) {

            $.logToConsole('invoiceService executeCustomerInvoiceRecurrence');
            var deferred = $q.defer();

            deui.ajax({ url: '/api/Billing/Customer/' + options.customerGuid + '/InvoiceRecurrence/' + options.invoiceRecurrenceGuid + '/Execute' }).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }
       
        service.saveCustomerInvoiceRecurrence = function (options) {
            $.logToConsole('invoiceService saveCustomerInvoiceRecurrence');
            var deferred = $q.defer();

            deui.ajax({
                url: '/api/Billing/Customer/InvoiceRecurrence/Save',
                method: "POST",
                data: { customerGuid: options.customerGuid, invoiceRecurrence: options.invoiceRecurrence}
            }).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }

        service.saveCustomerInvoicePaymentInfo = function (options) {
            
            $.logToConsole('invoiceService getInvoicePaymentInfoByGuidAdmin');
            var deferred = $q.defer();

            deui.ajax({ 
                url: '/api/Billing/Customer/' + options.customerGuid + '/PaymentInfo/Save',
                method: "POST",
                data: options.invoicePayment
            }).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }
        
        service.showEditCustomerDialog = function (customer){
            $.logToConsole('invoiceService editCustomerDialog');
            var deferred = $q.defer();
            
            modalService.showModal(
            {
                size:'lg',  //Make it a large model
                //deep cloan the customer so we can cancel
                scopeProperties: { customer: customer }, //This is the data object that is copied to the modelscope
                serviceOptions: {
                    title:"Edit Customer", 
                    templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomer/invoiceCustomer.modal.edit.tpl.html'
                }
            }).then(
                function (reason) {
                    $.logToConsole('User saved the Customer Edit');
                    var customer = reason.scopeProperties.customer;
                    // save the customer to the server
                    deferred.resolve()
                }, 
                function (reason) {
                    $.logToConsole('User Closed Dialog');
                    deferred.reject();
                }
            )

            return deferred.promise;
        }

        service.contactCopy = function(destinationContact, sourceContact){
            $.logToConsole('invoiceService contactCopy');
            var tempContactGuid = destinationContact.contactGuid;
            angular.extend(destinationContact, sourceContact);
            destinationContact.contactGuid = tempContactGuid;
            return destinationContact;
        }

        service.invoicePaymentCopy = function (destinationInvoicePayment, sourceInvoicePayment) {
            $.logToConsole('invoiceService invoicePaymentCopy');
            var tempInvoicePaymentGuid = sourceInvoicePayment.invoicePaymentGuid;
            angular.extend(destinationInvoicePayment, sourceInvoicePayment);
            sourceInvoicePayment.invoicePaymentGuid = tempInvoicePaymentGuid;
            return sourceInvoicePayment;
        }

        service.getInvoiceList = function (invoiceListRequest) {
            
            $.logToConsole('invoiceService getInvoiceList');
            var deferred = $q.defer();
            
            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/InvoiceList',
                    data: invoiceListRequest
                }

            ).then(
                function (result) {
                    
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );

            return deferred.promise;

        }

        service.getInvoiceTransactionList = function (invoiceTransactionListRequest) {

            $.logToConsole('invoiceService getInvoiceTransactionList');
            var deferred = $q.defer();

            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/InvoiceTransactionList',
                    data: invoiceTransactionListRequest
                }

            ).then(
                function (result) {

                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );

            return deferred.promise;

        }

        service.getInvoiceTransactionByGuid = function (invoiceTransactionGuid) {

            $.logToConsole('invoiceService getInvoiceTransactionByGuid');
            var deferred = $q.defer();

            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/InvoiceTransaction/' + invoiceTransactionGuid ,
                    data: null
                }

            ).then(
                function (result) {

                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );

            return deferred.promise;

        }

        service.isInvoiceTransactionPaid = function (invoiceTransaction) {
            if (invoiceTransaction && service.getStaticName('invoiceTransactionStatusList', invoiceTransaction.invoiceTransactionStatusId) == 'Paid') {
                return true;
            } else {
                return false;
            }
        }

        service.isInvoiceTransactionRefund = function (invoiceTransaction) {
            if (invoiceTransaction && service.getStaticName('invoiceTransactionStatusList', invoiceTransaction.invoiceTransactionStatusId) == 'Refunded') {
                return true;
            } else {
                return false;
            }
        }

        service.isInvoicePaid = function (invoice) {
            if (invoice && service.getStaticName('invoiceStatusList', invoice.invoiceStatusId) == 'Paid') {
                return true;
            } else {
                return false;
            }
        }

        service.isInvoiceOverdue = function (invoice) {
            
            if (invoice && service.isInvoicePaid(invoice) == false) {
                //if InvoiceStatusID != 1 then its no paid
                var strInvoiceTerms = service.getStaticName('invoiceTermTypeList', invoice.invoiceTermTypeId);
                if (strInvoiceTerms){
                    strInvoiceTerms = strInvoiceTerms.toLowerCase();
                }
                if (strInvoiceTerms == "due on receipt") {
                    return false; //
                } else if (strInvoiceTerms == "net 7" && moment(invoice.invoiceDate) < moment().add(7, 'days')) {
                    return true;
                } else if (strInvoiceTerms == "net 10" && moment(invoice.invoiceDate) < moment().add(10, 'days')) {
                    return true;
                } else if (strInvoiceTerms == "net 30" && moment(invoice.invoiceDate) < moment().add(30, 'days')) {
                    return true;
                } else if (strInvoiceTerms == "net 60" && moment(invoice.invoiceDate) < moment().add(60, 'days')) {
                    return true;
                } else if (strInvoiceTerms == "net 90" && moment(invoice.invoiceDate) < moment().add(90, 'days')) {
                    return true;
                }
                        
            }
            return false;
        }
            
        
        service.getAdminInvoiceList = function (invoiceListRequest) {

            $.logToConsole('invoiceService getInvoiceListAdmin');
            var deferred = $q.defer();

            deui.ajax(
                {
                    method: "POST",
                    url: '/api/Billing/Admin/InvoiceList',
                    data: invoiceListRequest
                }

            ).then(
                function (result) {
                    
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );

            return deferred.promise;

        }

        service.getAdminUserInfo = function (userGuid) {

            $.logToConsole('invoiceService getAdminUserInfo');
            var deferred = $q.defer();

            deui.ajax(
                {
                    method: "GET",
                    url: '/api/Account/Admin/UserInfo/' + userGuid,
                    data: null
                }

            ).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );

            return deferred.promise;

        }
        service.getAdminUser = function (userGuid) {

            $.logToConsole('invoiceService getAdminUser');
            var deferred = $q.defer();

            deui.ajax(
                {
                    method: "GET",
                    url: '/api/Account/Admin/User/' + userGuid,
                    data: null
                }

            ).then(
                function (result) {
                    deferred.resolve(result);
                },
                function (result) {
                    deferred.reject(result);
                }
            );

            return deferred.promise;

        }
        service.getSampleInvoice = function () {
            return {
                "adrecId": null,
                "comments": "Thank You",
                "description": "June Internet Bill",
                "dutyCharge": 0.0000,
                "externalInvoiceId": "INV1-0000-0000-0000-0001",
                "invoiceDate": "2015-06-15T00:00:00",
                "invoiceGuid": "0000000-0000-0000-000-000000000000",
                "invoiceId": 556,
                "invoiceProcessingStatusId": 0,
                "invoiceStatusId": 0,
                "invoiceTermTypeId": 1,
                "invoiceTypeId": 1,
                "ipaddress": "127.0.0.1",
                "processed": true,
                "purchaseOrderNumber": "",
                "shippingCharge": null,
                "shippingRequired": false,
                "tax": 0.0000,
                "taxExempt": true,
                "total": 35.0000,
                "invoiceItems": [
                    {
                        "description": "June Internet Service",
                        "invoiceId": 556,
                        "invoiceItemGuid": "0000000-0000-0000-000-000000000000",
                        "invoiceItemStatusId": 1,
                        "isItemCounted": true,
                        "isItemTotaled": true,
                        "isPackage": false,
                        "isPackageItem": false,
                        "itemId": 1,
                        "itemTableName": "de_products",
                        "name": "June Internet Service",
                        "packageId": -1,
                        "price": 35.0000,
                        "productNumber": "WISP-INTSRV-1MB",
                        "quantity": 1,
                        "taxExempt": false,
                        "invoiceItemStatus": null
                    }],
                "invoiceProcessings": [
                    {
                        "comments": "",
                        "dutyCharge": 0.0000,
                        "invoiceId": 556,
                        "invoiceProcessingGuid": "0000000-0000-0000-000-000000000000",
                        "invoiceProcessingStatusId": 1,
                        "invoiceProcessingTypeId": 3,
                        "processedBy": "Invoice Recurrence Background Task",
                        "processedDate": "2015-06-28T02:04:35.92",
                        "processingType": "Automated Invoice Recurrence",
                        "tax": 0.0000,
                        "total": 35.0000,
                        "invoiceProcessingItems": [],
                        "invoicePayment": {
                            "invoicePaymentGuid": "0000000-0000-0000-000-000000000000",
                            "invoicePaymentTypeId": 16,
                            "invoicePaymentType": null,
                            "invoicePaymentInfo": null
                        },
                        "invoiceProcessingStatus": null,
                        "invoiceProcessingType": null,
                        "invoiceShipping": null,
                        "invoiceTransaction": {
                            "invoicePaymentTypeId": 16,
                            "invoiceTransactionGuid": "0000000-0000-0000-000-000000000000",
                            "invoiceTransactionServiceTypeId": 3,
                            "invoiceTransactionStatusId": 5,
                            "invoiceTransactionTypeId": 15,
                            "transactionAmount": 35.0000,
                            "transactionComments": "",
                            "transactionDate": "2015-06-28T02:04:35.92",
                            "transactionException": "null",
                            "transactionIdentifier": "INV1-0000-0000-0000-0001",
                            "transactionResponse": "Qd55FENpNFo=",
                            "transactionResponseReason": "(Test Mode) Creation Of Paypal Invoice Successfull",
                            "invoiceProcessings": [],
                            "invoicePaymentType": null,
                            "invoiceTransactionServiceType": null,
                            "invoiceTransactionStatus": null,
                            "invoiceTransactionType": null
                        }
                    }],
                "invoiceRecurrences": [],
                "invoiceRecurrenceInvoiceCons": [],
                "billingContact": {
                    "address":
                        "350 E. XY Ave",
                    "address2": "",
                    "address3": "",
                    "city": "Vicksburg",
                    "companyName": "",
                    "contactGuid": "0000000-0000-0000-000-000000000000",
                    "country": "USA",
                    "email": "andy@digitalexample.com",
                    "firstName": "Andrew",
                    "lastName": "DeVries",
                    "phone": "269-207-5123",
                    "prefix": "Mr.",
                    "state": "Mi",
                    "suffix": "Jr.",
                    "title": "",
                    "zip": "49097",
                    "contactAdditionalInformation": null
                },
                "shippingContact": {
                    "address": "350 E. XY Ave",
                    "address2": "",
                    "address3": "",
                    "city": "Vicksburg",
                    "companyName": "",
                    "contactGuid": "0000000-0000-0000-000-000000000000",
                    "country": "USA",
                    "email": "andy@digitalexample.com",
                    "firstName": "Andrew",
                    "lastName": "DeVries",
                    "phone": "269-207-5123",
                    "prefix": "Mr.",
                    "state": "Mi",
                    "suffix": "Jr.",
                    "title": "",
                    "zip": "49097",
                    "contactAdditionalInformation": null
                },
                "customer": {
                    "customerGuid": "0000000-0000-0000-000-000000000000",
                    "taxId": "0",
                    "userKey": "0000000-0000-0000-000-000000000000",
                    "invoices": [],
                    "billingContact": {
                        "address": "350 E. Xy Ave",
                        "address2": "",
                        "address3": "",
                        "city": "Vicksburg",
                        "companyName": "Andrewiski Inc LLC",
                        "contactGuid": "0000000-0000-0000-000-000000000000",
                        "country": "USA",
                        "email": "adevries-buyer@digitalexample.com",
                        "firstName": "Andrewiski",
                        "lastName": "DeVries",
                        "phone": "269-207-5123",
                        "prefix": "Mr.",
                        "state": "Mi",
                        "suffix": "Jr.",
                        "title": "",
                        "zip": "49097",
                        "contactAdditionalInformation": null
                    }, "shippingContact": {
                        "address": "350 E. Xy Ave",
                        "address2": "",
                        "address3": "",
                        "city": "Vicksburg",
                        "companyName": "Andrewiski Inc LLC",
                        "contactGuid": "0000000-0000-0000-000-000000000000",
                        "country": "USA",
                        "email": "adevries-buyer@digitalexample.com",
                        "firstName": "Andrewiski",
                        "lastName": "DeVries",
                        "phone": "269-207-5123",
                        "prefix": "Mr.",
                        "state": "Mi",
                        "suffix": "Jr.",
                        "title": "",
                        "zip": "49097",
                        "contactAdditionalInformation": null
                    },
                    "invoicePayment": {
                        "invoicePaymentGuid": "0000000-0000-0000-000-000000000000",
                        "invoicePaymentTypeId": 16,
                        "invoicePaymentType": null,
                        "invoicePaymentInfo": null
                    }
                }, "invoicePayment": {
                    "invoicePaymentGuid": "0000000-0000-0000-000-000000000000",
                    "invoicePaymentTypeId": 16,
                    "invoicePaymentType": null,
                    "invoicePaymentInfo": null
                },
                "invoiceProcessingStatus": null,
                "invoiceStatus": null,
                "invoiceTermType": null,
                "invoiceType": null
            };
        }
        //this funtion will init the common data by prefetching the data if it hasn't already been fetched
        //If two controls on the page call this function only the first will fetch the rest will be cached
        

        return service;
    }])
})();