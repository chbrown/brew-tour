/*jslint browser: true */ /*globals angular */
angular.module('app', [
  'ngResource',
  'ngStorage',
  'misc-js/angular-plugins',
])
.directive('formula', function() {
  return {
    restrict: 'A',
    templateUrl: '/static/formula.html',
    replace: true,
    scope: {
      formula: '='
    },
    link: function(scope, el) {
      scope.formula.$get();
      el.on('click', function() {
        scope.$apply(function() {
          scope.formula.checked = !scope.formula.checked;
        });
      });
    }
  };
})
.service('Formula', function($resource) {
  return $resource('/api/formulas/:name', {
    name: '@name',
  });
})
.controller('formulasCtrl', function($scope, $http, $localStorage, Formula) {
  $scope.$storage = $localStorage.$default();

  $scope.formulas = Formula.query();

  $scope.check_all = function() {
    $scope.formulas.forEach(function(formula) {
      formula.checked = true;
    });
  };
});
