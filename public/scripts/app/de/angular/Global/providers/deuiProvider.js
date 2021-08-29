(function () {

    'use strict';

    /**
     * @ngdoc service
     * @name deapp.deui
     * @description This provider will expose functionality in the deui libraries
    */
    angular.module('deapp')
       .provider('deui', function () {

           $.logToConsole("Debug: deuiProvider Loaded");

           if ($.deui == undefined) {
               throw ('deuiProvider is dependent on deui.js')
           }


           var deuiCommon = $.deui.common;

           this.$get = ['$rootScope', '$http', '$q', '$log', 
               function ($rootScope, $http, $q, $log) {

                   var showLoginDialog = function () {
                       var deferred = $q.defer();
                       var promise = $.deui.showLoginDialog(options);

                       promise.done(function (result) {
                           deferred.resolve(result);
                       });
                       promise.fail(function (thrownError) {
                           deferred.reject(thrownError);
                       });
                       return deferred.promise;
                       
                   }

                   var GetAjax = function (options) {
                       //return a angular deferred versus the jquery deferred
                       var deferred = $q.defer();
                       var promise = $.deui.ajax(options);

                       promise.done(function (result) {
                           deferred.resolve(result);
                       });
                       promise.fail(function (xhr, ajaxResult, thrownError) {
                           deferred.reject(thrownError);
                       });
                       return deferred.promise;
                   }

                   var httpErrorHandlerRetry = function (httpResponse) {
                       var mydefer = $q.defer();
                       $http(response.config).then(
                        function (response) {
                            mydefer.resolve(response);
                        },
                        function (response) {
                            httpErrorHandler(response);
                        }
                       );
                       return mydefer.promise;
                   }

                   var httpErrorHandler = function (httpresponse) {
                       
                       switch (response.status) {  //access is denied
                           case 401:
                               $log.warn('angular deui 401 response status');
                               $.deui.showLoginDialog().then(function () {

                               }, function (reason) {
                                   deferred.reject(reason);
                               });


                               return false;

                           default:
                               //assumes this is a WebApi Call

                               var responseHandler = function (response) {
                                   return response.data;
                               }
                               return errorHandler.ErrorInterceptor(response, deferred, retry, responseHandler); // error handled by Error Handler


                       }
                   }

                   return {
                       common: $.deui.common,
                       ajax: GetAjax,
                       isClientSideDebugging: function () { return $.deui.isClientSideDebugging(); }
                   }
               }];
       });

})();



