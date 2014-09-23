/*jslint browser: true, devel: true */ /*globals _, angular */

var app = angular.module('app', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'misc-js/angular-plugins',
]);

var p = console.log.bind(console);

app.service('Formula', function($resource) {
  return $resource('/api/formulas/:name', {
    name: '@name',
  });
});

app.controller('formulasCtrl', function($scope, $http, $localStorage, Formula) {
  $scope.$storage = $localStorage.$default();

  $scope.formulas = Formula.query();

  $scope.check_all = function() {
    $scope.formulas.forEach(function(formula) {
      formula.checked = true;
    });
  };
});

app.directive('formula', function($http) {
  return {
    restrict: 'A',
    templateUrl: '/static/formula-tr.html',
    replace: true,
    scope: {
      formula: '='
    },
    link: function(scope, el, attrs) {
      scope.formula.$get();
      el.on('click', function() {
        scope.$apply(function() {
          scope.formula.checked = !scope.formula.checked;
        });
      });
    }
  };
});
