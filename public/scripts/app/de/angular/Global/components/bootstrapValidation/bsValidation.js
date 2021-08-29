(function () {

    'use strict';

    angular.module('deapp')

    .factory('bsProcessValidator',['$timeout', function ($timeout) {
        return function (scope, element, ngClass, bsType) {
            $timeout(function () {
                element.find('.form-control-feedback').hide();
                var alerts = element.find('.form-control-alert').hide();
                var input = element.find('input');
                if (!input.length) { input = element.find('select'); }
                if (!input.length) { input = element.find('textarea'); }
                if (input.length) {
                    scope.$watch(function () {
                        return input.hasClass(ngClass) && input.hasClass('ng-dirty');
                    }, function (isValid) {
                        element.toggleClass('has-' + bsType, isValid);
                        //element.find('.form-control-feedback').hide();
                        if (isValid) {
                            element.find('.form-control-feedback.bs-' + bsType).show();
                            element.find('.form-control-alert.bs-' + bsType).show();
                        } else {
                            element.find('.form-control-feedback.bs-' + bsType).hide();
                            element.find('.form-control-alert.bs-' + bsType).hide();
                        }
                    });
                }
            });
        };
    }])

    .directive('bsHasSuccess', ['bsProcessValidator', function (bsProcessValidator) {
        return {
            restrict: 'A',
            link: function(scope, element) {
                bsProcessValidator(scope, element, 'ng-valid', 'success');
            }
        };
    }])
  .directive('bsHasError', ['bsProcessValidator', function(bsProcessValidator) {
      return {
          restrict: 'A',
          link: function(scope, element) {
              bsProcessValidator(scope, element, 'ng-invalid', 'error');
          }
      };
  }])
  .directive('bsHas', ['bsProcessValidator', function(bsProcessValidator) {
      return {
          restrict: 'A',
          link: function(scope, element) {
              bsProcessValidator(scope, element, 'ng-valid', 'success');
              bsProcessValidator(scope, element, 'ng-invalid', 'error');
          }
      };
  }]);



})();