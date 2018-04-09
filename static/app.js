import angular from 'angular'
import 'angular-resource'
import 'ngstorage'

import './site.less'

angular.module('app', [
  'ngResource',
  'ngStorage',
])
.directive('fixedflow', function() {
  return {
    restrict: 'A',
    link(scope, el) {
      el.css('position', 'fixed')
      const height = getComputedStyle(el[0]).height
      const placeholder = angular.element('<div>')
      placeholder.css('height', height)
      placeholder.addClass('fixedflow-placeholder')
      el.after(placeholder)
    },
  }
})
.directive('formula', function() {
  return {
    restrict: 'A',
    templateUrl: '/static/formula.html',
    replace: true,
    scope: {
      formula: '=',
    },
    link(scope, el) {
      scope.formula.$get()
      el.on('click', () => {
        scope.$apply(() => {
          scope.formula.checked = !scope.formula.checked
        })
      })
    },
  }
})
.service('Formula', function($resource) {
  return $resource('/api/formulas/:name', {
    name: '@name',
  })
})
.controller('formulasCtrl', function($scope, $http, $localStorage, Formula) {
  $scope.$storage = $localStorage.$default()

  $scope.formulas = Formula.query()

  $scope.check_all = () => {
    $scope.formulas.forEach(formula => {
      formula.checked = true
    })
  }
})
