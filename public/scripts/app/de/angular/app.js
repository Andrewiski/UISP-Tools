/**
* @brief Shim for textAngular in order to make it compatible with the latest 
*   version of angularjs
*/

var lowercase = function (string) {
    return (typeof string === 'string') ? string.toLowerCase() : string;
};

// Angular deprecated the lowercase function as of v1.6.7. TextAngular hasn't 
// updated to reflect this
angular.lowercase = lowercase;

/*
Create the root application here
*/
var app = angular.module('deapp',
    [
        'ui.router',
        'ui.date',
        'ui.utils',
        'ui.bootstrap',
        'ui.select',
        'ngSanitize',
        'ngAnimate',
        
        'angularFileUpload',
        //'ui.bootstrap.dateandtimepickers',
        'textAngular',
        'textAngularSetup',
        'angular-mailcheck',
        'creditcard',
        'moment-picker'
    ]);





/*
Now config the root application
*/
app.config(['$compileProvider', '$stateProvider', '$locationProvider', '$urlRouterProvider', '$anchorScrollProvider', 
            '$provide', '$logProvider', '$uibModalProvider',  
            'deuiProvider', 
            function ($compileProvider, $stateProvider, $locationProvider, $urlRouterProvider, $anchorScrollProvider, $provide,
                $logProvider, $uibModalProvider,  deuiProvider
                ) {

                try {
                    
                    //Enable / disable debugging based on the system setting
                    if ($.deui.isClientSideDebugging() === true) {
                        $logProvider.debugEnabled(true);
                        $compileProvider.debugInfoEnabled(true);
                    }
                    
                    

                    $stateProvider
                        .state('home', {
                            url: '/',
                            template: '<div data-page-content data-page-content-guid="00000000-0000-0000-0000-000000000001"></div>'
                        })
                        .state('pagecontent', {
                            url: '/deui/ContentPage/{contentPageGuid}',
                            controller: 'pageContentStateController',
                            templateUrl:'/Scripts/de/angular/PageContent/components/PageContent/views/pageContent.view.html'
                        })
                         .state('pagecontent.editor', {
                             url: '/editor',
                             controller: 'pageContentEditorStateController',
                             templateUrl: '/Scripts/de/angular/PageContent/components/PageContentEditor/views/pageContentEditor.view.html'

                         })
                        
                        .state('user', {
                            url: '/deui/user',
                            controller: 'userStateController',
                            templateUrl: '/Scripts/de/angular/User/components/user/views/user.view.html',
                            data: {
                                subMenuItems: [
                                    { linkUrl: '#/user/manage', linkText: 'Account', linkTarget: '_self' },
                                    { linkUrl: '#/user/invoices', linkText: 'Invoices', linkTarget: '_self' },
                                    { linkUrl: '#/user/billing', linkText: 'Billing', linkTarget: '_self' }
                                ]
                            }

                        })
                        .state('user.manage', {
                            url: '/manage',
                            template: '<div data-user-manage-account></div>'
                        })
                        .state('user.invoices', {
                            url: '/invoices?invoiceStatusId&pay&select',
                            templateUrl: '/Scripts/de/angular/Billing/components/invoiceList/invoiceList.view.html'
                        })
                        .state('user.invoice', {
                            url: '/invoice/{invoiceGuid}',
                            templateUrl: '/Scripts/de/angular/Billing/components/invoice/views/invoice.view.html'
                        })
                        
                        .state('user.customer', {
                            controller:'invoiceCustomerStateController',
                            url: '/customer',
                            templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomer/views/invoiceCustomer.user.view.html'
                        })
                         .state('user.customeredit', {
                             url: '/customer/edit',
                             templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomer/views/invoiceCustomer.user.edit.view.html'
                         })
                        .state('user-login', {
                            url: '/deui/user/login',
                            template: '<div data-user-login></div>'
                        })
                        .state('user-forgot-password', {
                            url: '/deui/user/forgotpassword',
                            template: '<div data-user-forgot-password></div>'
                        })
                        //.state('user-login-external', {
                        //    url: '/user/login/external',
                        //    controller: function ($scope, $location) {
                        //        var search = $location.search();
                        //        $.deui.aspnet.processExternalLogin(search).then(
                        //            function (result) {
                        //                if (result.showRegister) {
                        //                    //this is the add of an external account to an existing account
                        //                    $location.url("/user/register?externalLogin=true&redir=" + encodeURIComponent(search.redir));
                        //                } else {
                        //                    //this is a new login with external account kick them to the userregistrationpage
                        //                    $location.url(search.redir);
                        //                }
                        //                $scope.$apply();
                        //                return;
                        //            })
                        //        //$.deui.aspnet.getUserInfo().then(
                        //        //    function (userinfo) {
                        //        //        if (userinfo.hasRegistered) {
                        //        //            //this is the add of an external account to an existing account
                        //        //            $location.url("/user/manage?externalLogin=true&redir=" + encodeURIComponent(search.redir));
                        //        //        } else {
                        //        //            //this is a new login with external account kick them to the userregistrationpage
                        //        //            $location.url("/user/register?externalLogin=true&redir=" + encodeURIComponent(search.redir));
                        //        //        }
                        //        //        return;
                        //        //    })
                        //    },
                        //    templateUrl: '/Scripts/de/angular/Global/components/loading/loading.html',
                        //})
                        //.state('user-login-external-auth', {
                        //    url: '/auth',
                        //    controller: function ($location) {
                        //        var search = $location.search();
                               
                        //    },
                        //    templateUrl: '/Scripts/de/angular/Global/components/loading/loading.html',
                        //})
                        .state('user-register', {
                            url: '/deui/user/register',
                            template: '<div data-user-register></div>'
                        })
                        
                        .state('admin', {
                            url: '/deui/Admin',
                            controller: 'adminStateController',
                            templateUrl: '/Scripts/de/angular/Admin/components/admin/admin.view.html',
                            onEnter: function () {
                                console.log("enter Admin");
                            },
                            data: {
                                subMenuItems: [
                                    { linkUrl: '/deui/Admin/Invoices', linkText: 'Invoices', linkTarget: '_self' },
                                    { linkUrl: '/deui/Admin/Invoices/RecurenceInvoices', linkText: 'Recurence Invoices', linkTarget: '_self' },
                                    { linkUrl: '/deui/Admin/InvoiceCustomers', linkText: 'Customers', linkTarget: '_self' },
                                    { linkUrl: '/deui/Admin/InvoiceTransactions', linkText: 'Transactions', linkTarget: '_self' },
                                    { linkUrl: '/deui/Admin/Users', linkText: 'Users', linkTarget: '_self' }
                                ]
                            }
                            
                        })
                         .state('admin.invoices', {
                             url: '/Invoices',        // the /Admin is implied as its a child
                             controller: 'invoicesStateController',
                             templateUrl: '/Scripts/de/angular/Billing/components/invoices/views/invoices.admin.view.html',
                             //data: {
                             //    subMenuItems: [
                             //        { linkUrl: '/deui/Admin/Invoices', linkText: 'Invoices', linkTarget: '_self' },
                             //        { linkUrl: '/deui/Admin/Invoices/Invoice/new', linkText: 'New Invoice', linkTarget: '_self' },
                             //        { linkUrl: '/deui/Admin/Invoices/RecurenceInvoices', linkText: 'Recurence Invoices', linkTarget: '_self' },
                             //        { linkUrl: '/deui/Admin/InvoiceCustomers', linkText: 'Customers', linkTarget: '_self' },
                             //        { linkUrl: '/deui/Admin/InvoiceCustomers/InvoiceCustomer/new', linkText: 'New Customer', linkTarget: '_self' },
                             //    ]
                             //}
                        })

                        .state('admin.invoices.recurenceInvoices', {
                            url: '/RecurenceInvoices',        // the /Admin is implied as its a child
                            controller: 'invoicesStateController',
                            templateUrl: '/Scripts/de/angular/Billing/components/invoices/views/invoices.recurrence.admin.view.html',
                            //data: {
                            //    subMenuItems: [
                            //        { linkUrl: '/deui/Admin/Invoices', linkText: 'Invoices', linkTarget: '_self' },
                            //        { linkUrl: '/deui/Admin/Invoices/Invoice/new', linkText: 'New Invoice', linkTarget: '_self' },
                            //        { linkUrl: '/deui/Admin/Invoices/RecurenceInvoices', linkText: 'Recurence Invoices', linkTarget: '_self' },
                            //        { linkUrl: '/deui/Admin/InvoiceCustomers', linkText: 'Customers', linkTarget: '_self' },
                            //        { linkUrl: '/deui/Admin/InvoiceCustomers/InvoiceCustomer/new', linkText: 'New Customer', linkTarget: '_self' },
                            //    ]
                            //}
                        })

                        .state('admin.invoiceTransactions', {
                            url: '/InvoiceTransactions',        // the /Admin is implied as its a child
                            controller: 'invoiceTransactionsStateController',
                            templateUrl: '/Scripts/de/angular/Billing/components/invoiceTransactions/views/invoiceTransactions.admin.view.html',
                            //data: {
                            //    subMenuItems: [
                            //        { linkUrl: '/deui/Admin/Invoices', linkText: 'Invoices', linkTarget: '_self' },
                            //        { linkUrl: '/deui/Admin/Invoices/Invoice/new', linkText: 'New Invoice', linkTarget: '_self' },
                            //        { linkUrl: '/deui/Admin/Invoices/RecurenceInvoices', linkText: 'Recurence Invoices', linkTarget: '_self' },
                            //        { linkUrl: '/deui/Admin/InvoiceCustomers', linkText: 'Customers', linkTarget: '_self' },
                            //        { linkUrl: '/deui/Admin/InvoiceCustomers/InvoiceCustomer/new', linkText: 'New Customer', linkTarget: '_self' },
                            //    ]
                            //}
                        })

                        .state('admin.invoiceTransaction', {
                            url: '/InvoiceTransaction/{invoiceTransactionGuid}',        // the /Admin is implied as its a child
                            //controller: 'invoiceTransactionsAdminStateController',
                            templateUrl: '/Scripts/de/angular/Billing/components/invoiceTransaction/views/invoiceTransaction.view.html',
                            
                        })

                        .state('admin.users', {
                            url: '/Users',        // the /Admin is implied as its a child
                            
                            template: '<div data-user-list></div>'
                            
                        })
                         .state('admin.user', {
                             url: '/User/{userGuid}',        // the /Admin/Users is implied as its a child

                             template: '<div data-admin-user></div>'

                         })
                        .state('admin.invoices.invoice', {
                            url: '/Invoice/{invoiceGuid}',      // the /Admin/Invoices is implied as its a child state
                            
                            templateUrl: '/Scripts/de/angular/Billing/components/invoices/views/invoices.admin.editinvoice.view.html'
                        })
                        .state('admin.sendPaymentReminder', {
                            url: '/SendPaymentReminder/{customerGuid}',      // the /Admin/Invoices is implied as its a child state

                            template: '<div data-invoice-payment-reminder></div>'
                        })

                        
                        
                        .state('admin.invoicecustomers', {
                            url: '/InvoiceCustomers',      // the /Admin/Invoices is implied as its a child state
                            controller: 'invoiceCustomersAdminStateController',
                            templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomers/views/invoiceCustomers.admin.view.html',
                            data: {
                                invoiceCustomerList: { customerSearch: { name: '' }, customerSearchList: [] }
                            }
                        })

                        .state('admin.invoicecustomers.customer', {
                            url: '/InvoiceCustomer/{customerGuid}',      // the /Admin/Invoices is implied as its a child state
                            templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomer/views/invoiceCustomer.admin.view.html'
                        })
                        .state('admin.invoicecustomers.customerEdit', {
                            url: '/InvoiceCustomer/Edit/{customerGuid}',      // the /Admin/Invoices is implied as its a child state
                            templateUrl: '/Scripts/de/angular/Billing/components/invoiceCustomer/views/invoiceCustomer.admin.edit.view.html'
                        })
                    $urlRouterProvider.otherwise(function ($injector, $location) {
                        $.logToConsole("bad route $urlRouterProvider.otherwise redirecting to home page");
                       return "/";    
                    })
                    //errorHandlerProvider.setDefaultErrorMessage('An Error has occured on the server. Error Code NER100');
                    $locationProvider.html5Mode(true);
                    

                } catch (ex) {
                    $.logToConsole('Fatal Error in app.js config: ' + ex.message);
                }

            }]);

    /*
    Now execute run on the root application
    */
    app.run(['$templateCache', '$rootScope', '$location', '$anchorScroll', '$http', '$log',  'deui', '$state',
        function ($templateCache, $rootScope, $location, $anchorScroll, $http, $log, deui, $state) {

        if ($.deui.isClientSideDebugging()) {
            $log.debug("Debugging Enabled");
        }

       

        

        //Prefetch the ErrorHtml and stick it in cache so if the server is down we have a template to use.
        //$http.get('/Scripts/ctmangular/Global/js/providers/errorhandler/errorhandler.html', {
        //    cache: $templateCache
        //});

        $rootScope.previousState = 'home';
        $rootScope.currentState;
        $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
            $.logToConsole('app.js $rootScope.$on("$stateChangeSuccess")  Previous state: ' + from.name + ' Current state:' + to.name);
            $rootScope.previousState = from;
            $rootScope.previousParams = fromParams;
            $rootScope.currentState = to;
            $rootScope.currentState = toParams;
        });

        $rootScope.$on('$stateChangeStart', function (event, toState) {
            $.logToConsole('app.js $rootScope.$on("$stateChangeStart")');
            if (toState.data && toState.data.subMenuItems && toState.data.subMenuItems !== deui.common.menu.subMenuItems) {
                deui.common.menu.subMenuItems = toState.data.subMenuItems;
            }
        })

        //prefetch the Loading as we use that everywhere and want it to show asap
        $rootScope.loadingTemplateUrl = '/Scripts/de/angular/Global/components/loading/loading.html';
        $http.get($rootScope.loadingTemplateUrl, {
            cache: $templateCache
        });
        $rootScope.errorTemplateUrl = '/Scripts/de/jquery/templates/deui.error.html';
        $http.get($rootScope.errorTemplateUrl, {
            cache: $templateCache
        });

        //need to cache the icon images else black error page icons
         ///Content/themes/base/images/ui-icons_444444_256x240.png
            $http.get('/Content/themes/base/images/ui-icons_444444_256x240.png', {
                cache: $templateCache
            });
        // /Content/themes/base/images/ui-icons_777777_256x240.png
            $http.get('/Content/themes/base/images/ui-icons_777777_256x240.png', {
                cache: $templateCache
            });
        // /Content/themes/base/images/ui-icons_555555_256x240.png
            $http.get('/Content/themes/base/images/ui-icons_555555_256x240.png', {
                cache: $templateCache
            });
        }]);

    

/*############################################################
  Here we are fetching startup data for the app
    THEN we are bootstrapping angular

  If you want to add a call, just write a function that 
  returns a promise and add it to the when call below
############################################################*/
$(document).ready(function () {
    try {
        if (!document.getElementsByTagName('html')[0].hasAttribute('de-angular')) {            
            return;
        }
        
        $.when(
            $.deui.appInit()
        ).then(function () {
            //Now manually bootstrap angular
            angular.bootstrap(document, ['deapp']);
            $('#BootStrapLoad').hide();
            $.logToConsole('Angular bootstrap Complete');
        }, function (error) {
            //Now manually bootstrap angular
                $.logToConsole('Error in deui.appinit Did not execute Angular bootstrap');
            }
        );
    } catch (ex) {
        console.error('JANKS');
        console.error(ex);
        $.logToConsole('Fatal Error in Angular bootstrap: ' + ex.message)
    }
});

