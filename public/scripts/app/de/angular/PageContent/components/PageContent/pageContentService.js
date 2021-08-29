(function () {

    'use strict';

    angular.module('deapp')
    .factory('pageContentService', ['$http', '$q',  '$log', 'deui', function ($http, $q, $log, deui) {
        var service = {};

        service.getPageContentByGuid = function (PageContentGuid) {
            //we could go fetch this from the server but we will try it this way instead.

            $.logToConsole('pageContentService getPage');
            var deferred = $q.defer();

            deui.ajax(
                {
                    method:"GET",
                    url: '/api/PageContent/Content/' + PageContentGuid
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

        service.save = function (pageContent) {
            $.logToConsole('pageContentService save');
            return deui.ajax({
                method: "POST",
                url: 'api/PageContent/Content',
                data: pageContent
            });
        }
        

        //this funtion will init the common data by prefetching the data if it hasn't already been fetched
        //If two controls on the page call this function only the first will fetch the rest will be cached
        

        return service;
    }])
})();