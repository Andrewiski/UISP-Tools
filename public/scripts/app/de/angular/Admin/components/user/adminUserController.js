(function () {

    'use strict';

    angular.module('deapp')
        .controller('adminUserController', [
            '$rootScope', '$scope', '$state', '$location', 'deui', 'invoiceService', 'modalService', function ($rootScope, $scope, $state, $location, deui, invoiceService, modalService) {
                $.logToConsole("adminUserController init");
                $scope.doneLoading = false;
                $scope.user = { id: $state.params.userGuid };
                
                $scope.isChangePasswordMode = false;
                $scope.pwdchange = { userid:$state.params.userGuid, password: '', confirm: '' };
                if ($state.params.userGuid && $state.params.userGuid == 'new') {
                    $scope.isNew = true;
                    $scope.mode = 'edit';
                } else {
                    $scope.isNew = false;
                    $scope.mode = 'view';
                }
                if ($state.params.userGuid != 'new'){
                    invoiceService.getAdminUser($state.params.userGuid).then(function (user) {
                        //Fetch the Customers if this user has any
                        if (user && user.id) {
                            invoiceService.getCustomersByUserID(user.id).then(function (customers) {
                                $scope.customers = customers;
                                $scope.user = user;
                                $scope.doneLoading = true;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });
                        } else {
                            $scope.doneLoading = true;
                        }
                    
                    });
                } else {
                    $scope.doneLoading = true;
                }
                $scope.SaveUser = function () {
                    $scope.doneLoading = false;
                    invoiceService.saveAdminUser($scope.user).then(function (user) {
                        $scope.doneLoading = true;
                        $scope.user = user;
                        if ($state.params.userGuid != user.id) {
                            $state.params.userGuid = user.id;
                            var url = $location.url();
                            $location.url(url.replace('new', user.id));
                        }
                        
                        $scope.mode = 'view';
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                }
                $scope.CancelEditUser = function () {
                    $scope.mode = 'view';
                }
                $scope.EditUser = function () {
                    $scope.mode = 'edit';
                }
                $scope.SaveChangePassword = function () {
                    if ($scope.pwdchange.password != $scope.pwdchange.confirm) {
                        modalService.showDialogYesNo("Password and Confirm do Not Match", "Change Password Error");
                    } else {
                        $scope.doneLoading = false;
                        invoiceService.saveAdminUserPassword($scope.pwdchange).then(function () {
                            $scope.pwdchange.password = '';
                            $scope.pwdchange.confirm = '';
                            $scope.mode = 'view';
                            $scope.doneLoading = true;
                        });
                    }
                }
                $scope.ChangePassword = function () {
                    $scope.mode = 'changepassword';
                }
                $scope.CancelChangePassword = function () {
                    $scope.mode = 'view';
                }
                $scope.DeleteUser = function () {
                    modalService.showDialogYesNo( "Are you Sure you want to Delete this User?","Delete User").then(
                        function () {
                            $scope.doneLoading = false;
                            invoiceService.deleteUserAdmin($scope.user.id).then(
                                function () {
                                    $scope.doneLoading = true;
                                    $state.go('admin.user');
                                },
                                function(result){
                                    $scope.doneLoading = true;
                                    modalService.showDialogOk("The Delete of this User Failed!", "Error Deleting User");
                                }
                            )
                            
                        },
                        function () {
                            $scope.mode = 'view';
                        }
                    )
                    
                }
            }
        ]);

})();