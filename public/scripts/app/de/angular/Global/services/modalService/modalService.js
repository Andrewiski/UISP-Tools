(function () {

    'use strict';

    angular.module('deapp')
    .factory('modalService', ['$http', '$q', '$log', '$uibModal', function ($http, $q, $log, $uibModal) {
        var service = {};

        service.showDialogYesNo = function (message, title) {
            if (title == undefined) {
                title = "Question";
            }
            return service.showModal(
                {
                    size:"sm",
                    scopeProperties: { message: message },
                    serviceOptions: {
                        templateUrl: '/Scripts/de/angular/Global/services/modalService/modalService.dialog.yesNo.tpl.html',
                        title:title, 
                        buttons:[
                            {text:"Yes", "class":"btn btn-primary", onClick: angular.noop, closeModal: true, resolve:true }, 
                            {text:"No", "class":"btn btn-warning", onClick: angular.noop, closeModal: true,  resolve:false} 
                        ]
                    }
                }
            )

        }

        service.showDialogOk = function (message, title) {
            if (title == undefined) {
                title = "Question";
            }
            return service.showModal(
                {
                    size: "sm",
                    scopeProperties: { message: message },
                    serviceOptions: {
                        templateUrl: '/Scripts/de/angular/Global/services/modalService/modalService.dialog.ok.tpl.html',
                        title: title,
                        buttons: [
                            { text: "OK", "class": "btn btn-primary", onClick: angular.noop, closeModal: true, resolve: true }
                            
                        ]
                    }
                }
            )

        }

        service.showModal = function (options) {
            var deferred = $q.defer();
            var myOptions = {};

            var ModalInstanceCtrl = ['$scope', '$uibModalInstance', 'scopeProperties', 'serviceOptions', function ($scope, $uibModalInstance, scopeProperties, serviceOptions) {
                //Set the properties on the scope so they can be accessed from the html mark up
                angular.extend($scope,  scopeProperties);
                $scope.serviceOptions = serviceOptions; 
                
                $scope.btnClick = function(button){
                    var closeModal = button.closeModal;
                    if (button.onClick){ 
                        var onClickRetval = button.onClick(scopeProperties);
                        if (typeof(onClickRetval) === "boolean"){
                            closeModal = onClickRetval;
                        }
                    }
                    if (closeModal){
                        if (button.resolve == false){
                            $scope.$dismiss({btn:button.text, scopeProperties:scopeProperties});
                        }else{
                            $scope.$close({btn:button.text, scopeProperties:scopeProperties});
                        }
                    }                       
                };
            }];

            var defaultOptions = {
                scopeProperties: {}, //This is the data object that is copied to the scope
                serviceOptions: {title:"Modal Title", templateUrl:'', buttons:[{text:"Save", "class":"btn btn-primary", onClick: angular.noop, closeModal: true, resolve:true }, {text:"Cancel", "class":"btn btn-warning", onClick: angular.noop, closeModal: true,  resolve:false } ]}, //This is the url to the innerTemplate
                controller: ModalInstanceCtrl,
                templateUrl: '/Scripts/de/angular/Global/services/modalService/modalService.tpl.html',
                backdrop: 'static',
                fade: false,
                animate: false,
                dialogClass: 'modal',
                backdropClass: 'modal-backdrop',
                windowClass: "modal fade in",
            //this is how we pass data to the Controller defined above
            resolve: {
               
                scopeProperties: function () {
                    return myOptions.scopeProperties;
                },
                serviceOptions: function(){
                    return myOptions.serviceOptions;
                }
            }
            }

            myOptions = angular.extend(myOptions, defaultOptions);

            angular.merge(myOptions,options)
            

            

            var ModalInstance = $uibModal.open(myOptions);
            //The result is a returned promise that we can use to affect the orginal promise 

            ModalInstance.result.then(function (response) {
                //The User Clicked the Retry button which closed the dialog
                $.logToConsole('modalService Success at: ' + new Date());
                //the retry was successfull so resolve the orginal deferred using the responseHandler
                //responseHandler is used to remove any wrapper that may be there ie return response.data versus just the response object.
                deferred.resolve(response);
                //errorModalInstance.close();
            }, function (response) {
                //The user Clicked the Cancel button so we need to call the reject on the promise
                $.logToConsole('modalService dismissed at: ' + new Date());
                deferred.reject(response);
                //errorModalInstance.dismiss(responseHandler(response));
            });

            return deferred.promise;
        }
     


        return service;
    }])
})();