/*jslint browser: true */ /*globals angular, Event */
/** Copyright 2012-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/angular-plugins.js

jslint with 'browser: true' really ought to recognize 'Event' as a global type

*/
angular.module('misc-js/angular-plugins', [])
// # Filters
.filter('trust', function($sce) {
  /** ng-bind-html="something.html | trust" lets us easily trust something as html

  Here's how you could  completely disable SCE:

  angular.module('app', []).config(function($sceProvider) {
    $sceProvider.enabled(false);
  });

  */
  return function(string) {
    return $sce.trustAsHtml(string);
  };
})
// # Directives
.directive('help', function() {
  /**
  <span class="help">This is a long but very useful help message but most often you probably won't want to read all of it because it's actually easy to remember and not all that helpful. Good for reference though.</span>

  This message will be truncated to the first 50 characters (TODO: make that configurable).
  */
  return {
    restrict: 'C',
    template:
      '<span class="summary" style="opacity: 0.5" ng-hide="expanded" ng-click="expanded = true"></span>' +
      '<span class="full" ng-show="expanded" ng-click="expanded = false" ng-transclude></span>',
    transclude: true,
    scope: {},
    link: function(scope, el, attrs) {
      var summary_el = el.children().eq(0);
      var full_el = el.children().eq(1);
      scope.expanded = false;

      // var content = el.text().trim();
      var content = full_el.text().trim();
      var summary = content.slice(0, 50) + ((content.length > 50) ? '...' : '');
      summary_el.text(summary);
    }
  };
})
.directive('fixedflow', function() {
  /** This directive is intended to be used with a <nav> element, so that it
  drops out of flow, in the current position, but creates an empty shadow
  element to keep its place

  <nav fixedflow>
    <a href="/admin/individuals">Individuals</a>
    <a href="/admin/administrators">Administrators</a>
  </nav>
  */
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      // set the el to "position: fixed" in case that's not in the css
      el.css('position', 'fixed');
      // placeholder is just a super simple empty shadow element
      var height = getComputedStyle(el[0]).height;
      var placeholder = angular.element('<div>');
      placeholder.css('height', height);
      el.after(placeholder);
    }
  };
})
.directive('activateCurrentAnchor', function($window, $rootScope) {
  /** This directive is also intended to be used with a <nav> element. It will
  add the class 'current' to the <a> with the closest matching href. It is
  similar to calling the following, only smarter / more adaptive.

      document.querySelector('a[href="' + window.location.pathname + '"]').classList.add('current');

  Use like:

      <nav activate-current-anchor>
        <a href="/users">Users</a>
        <a href="/products">Products</a>
        <a href="/orders">Orders</a>
      </nav>
  */
  return {
    scope: {
      activateCurrentAnchor: '@'
    },
    link: function(scope, element, attrs) {
      var className = scope.activateCurrentAnchor || 'current';
      var updateCurrent = function(anchor) {
        if (scope.current_anchor) {
          scope.current_anchor.classList.remove(className);
        }
        anchor.classList.add(className);
        scope.current_anchor = anchor;
      };
      var refresh = function() {
        var window_pathname = $window.location.pathname;
        var anchors = element.find('a');
        var i, anchor;
        // try for exact matches first
        for (i = 0; (anchor = anchors[i]); i++) {
          if (window_pathname == anchor.pathname) {
            return updateCurrent(anchor);
          }
        }
        // then for anchors with a prefix of the current url
        for (i = 0; (anchor = anchors[i]); i++) {
          if (window_pathname.indexOf(anchor.pathname) === 0) {
            return updateCurrent(anchor);
          }
        }
      };

      $rootScope.$on('$locationChangeSuccess', refresh); // function(ev, newUrl, oldUrl)
      refresh();
    }
  };
})
.directive('jsonTransform', function() {
  /** parser/serializer to edit a JSON object within a textarea or input[type=text] */
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, el, attrs, ngModel) {
      // set up communicating from DOM to model
      el.on('blur keyup change', function() {
        scope.$apply(function() {
          ngModel.$setViewValue(el.val());
          // if we wanted to read from page's html before from the model, we'd
          // run this function at the link level (but usually we want the model)
        });
      });
      // set up communicating from model to DOM
      ngModel.$render = function() {
        el.val(ngModel.$viewValue);
        // this would trigger a textarea to resizeToFit, for example. kind of awkward, though.
        el[0].dispatchEvent(new Event('input'));
      };

      // set up translations
      ngModel.$formatters.push(function(value) {
        if (value === null) {
          return '';
        }
        // signature: angular.toJson(obj, [pretty]);
        return angular.toJson(value, true);
      });
      ngModel.$parsers.push(function(value) {
        // we'll interpret the empty string as 'null'
        if (value === '') {
          value = null;
        }

        try {
          ngModel.$setValidity('json', true);
          // angular uses an unwrapped JSON.parse, so it'll throw on failure
          return angular.fromJson(value);
        }
        catch (exc) {
          ngModel.$setValidity('json', false);
          // return undefined;
        }
      });
    }
  };
})
.directive('enhance', function() {
  /** Only use this if you've loaded misc-js/textarea.js! */
  return {
    restrict: 'A',
    require: '?ngModel',
    scope: {},
    link: function(scope, el, attrs, ngModel) {
      // enhance textarea (check if it's a textarea)
      var textarea = el[0];
      if (textarea.tagName.toLowerCase() == 'textarea') {
        if (window.Textarea) {
          window.Textarea.enhance(textarea);
        }
        else {
          console.error('Cannot enhance <textarea> without first loading textarea.js', textarea);
        }
      }

      if (ngModel) {
        // console.log(textarea, 'ngModel', ngModel);
        // I think the built-in ng-model will handle actually setting the value?
        ngModel.$render = function() {
          // handle undefined input value by representing it as the empty string
          textarea.value = (ngModel.$viewValue === undefined || ngModel.$viewValue === null) ? '' : ngModel.$viewValue;
          // jump out of the $digest in case a different ng-model controller is listening
          setTimeout(function() {
            // but we need to trigger an 'input' event so that the enhanced Textarea triggers a resize
            textarea.dispatchEvent(new Event('input'));
          }, 0);
        };
        el.on('blur keyup change', function() {
          scope.$apply(function() {
            ngModel.$setViewValue(textarea.value);
          });
        });
      }
    }
  };
})
.directive('throbber', function() {
  /** Presumably the rest of misc-js is installed nearby.
  */
  return {
    restrict: 'E',
    template: '<img src="/static/lib/img/throbber-24.gif">'
  };
})
.directive('score', function() {
  /** Use like:

        <div score="match.score * 100.0">
          {{match.score.toFixed(3)}}
        </div>

    Or:

        <hr score="search_result.score * 100.0">

    This will add the class "score". I don't use restrict: 'C' because we need the score argument.

    You may want to style the element in a few ways.
    This directive only sets the border (for overflows), width, and background-color.

    For example:

        hr.score {
          height: 3px;
          box-sizing: border-box;
          border: 0;
          margin: 0;
        }

  */
  return {
    restrict: 'A',
    scope: {
      score: '='
    },
    link: function(scope, el, attrs) {
      el.addClass('score');
      // bound between 0 and 100
      var bounded_score = scope.score;
      var css = {};
      if (scope.score < 0) {
        bounded_score = 0;
        css.borderLeft = '1px dotted rgba(0, 0, 0, 0.2)';
      }
      else if (scope.score > 100) {
        bounded_score = 100;
        css.borderRight = '1px dotted black';
      }
      css.width = bounded_score + '%';
      css.backgroundColor = 'hsl(' + (bounded_score * 1.2).toFixed(2) + ', 100%, 50%)';
      el.css(css);
    }
  };
})
// .directive('time', function() {
//   /**  <time> is the HTML5 standard element
//   Use like:
//       <time datetime="user.created" class="date"></time>
//   Angular's built-in 'date' filter is very nice, though, so you likely don't need this.
//     * http://code.angularjs.org/1.2.13/docs/api/ng.filter:date
//   */
//   return {
//     restrict: 'E',
//     scope: {
//       datetime: '='
//     },
//     link: function(scope, el, attrs) {
//       var date = new Date(scope.datetime);
//       // move the actual datetime to the attribute
//       attrs.datetime = date.toISOString();
//       // and reformat the text content according to the class
//       if (el.hasClass('date')) {
//         el.text(date.toISOString().split('T')[0]);
//       }
//       else if (el.hasClass('long')) {
//         el.text(date.toString());
//       }
//       else { // default: datetime but in short iso8601
//         el.text(date.toISOString().replace(/T/, ' ').replace(/\..+/, ''));
//       }
//     }
//   };
// })
.directive('ajaxform', function($http) {
  /** Use like:

      <ajaxform method="DELETE" action="/admin/posts/{{post.id}}">
        <button>Delete</button>
      </ajaxform>

  */
  return {
    restrict: 'E',
    replace: true,
    template: '<form ng-submit="submit($event)" ng-transclude></form>',
    transclude: true,
    link: function(scope, el, attrs) {
      scope.submit = function(ev) {
        // standard html <form> can only handle POST and GET, so we hijack everything else
        if (attrs.method != 'POST' && attrs.method != 'GET') {
          ev.preventDefault();
          // var data = serializeForm(ev.target); // TODO
          $http({
            method: attrs.method,
            url: attrs.action,
            // data: data
          }).then(function(res) {
            // window.location = window.location;
          }, function() {

          });
        }
      };
    },
  };
})
.directive('checkboxSequence', function($http) {
  /** Use like:

    <ul checkbox-sequence>
      <li ng-repeat="user in users">
        <label><input type="checkbox" ng-model="user.selected"> {{user.name}}</label>
      </li>
    </ul>

  */
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      var previous_checkbox = null;
      // previous_action == true means the last selection was to change
      // a checkbox from unchecked to checked
      var previous_action = null;

      // addEventListener('DOMSubtreeModified', function()
      // requires jQuery (not just jQ-lite) for the selector stuff
      var sel = 'input[type="checkbox"]';
      el.on('click', sel, function(ev) {
        var action = ev.target.checked; // true = just checked, false = just unchecked
        if (ev.shiftKey) {
          if (action === previous_action && previous_checkbox) {
            var checkboxes = el.find(sel);
            var inside = false;
            // select all entries between the two, inclusive
            for (var i = 0, l = checkboxes.length; i < l; i++) {
              var checkbox = checkboxes[i];
              var boundary = checkbox == previous_checkbox || checkbox == ev.target;
              if (boundary) {
                if (inside === false) {
                  // the first boundary we hit puts us inside
                  inside = true;
                }
                else {
                  // the secondary boundary puts us outside, so we break out
                  break;
                }
              }
              else if (inside) {
                checkbox.checked = action;
                // checkbox.dispatchEvent(new Event('input', true, true));
                // angular.element(checkbox).trigger('click');
                // angular.element(checkbox).trigger('change');
                // angular.element(checkbox).prop('checked', action);
                angular.element(checkbox).triggerHandler('click');
              }
            }
          }
        }
        previous_checkbox = ev.target;
        previous_action = action;
      });

    },
  };
})
.directive('mapObject', function() {
  /** Use like:

      <table map-object="result.details"></table>
  */
  return {
    restrict: 'A',
    template:
      '<table class="map">' +
      '  <tr ng-repeat="(key, val) in mapObject">' +
      '    <td ng-bind="key"></td><td ng-bind="val"></td>' +
      '  </tr>' +
      '</table>',
    replace: true,
    scope: {
      mapObject: '=',
    }
  };
})
// services
.service('$flash', function($rootScope) {
  // basically a $rootScope wrapper
  return function(value, timeout) {
    // value can be a string or a promise
    // default to a 3 second timeout, but allow permanent flashes
    if (timeout === undefined) timeout = 3000;
    $rootScope.$broadcast('flash', value, timeout);
  };
})
.directive('flash', function($timeout, $q) {
  /**
  Inject $flash and use like:
      $flash('OMG it burns!')
  or
      $flash(asyncResultPromise)
  */
  return {
    restrict: 'E',
    template:
      '<div class="flash" ng-show="messages.length > 0">' +
        '<span ng-repeat="message in messages track by $index" ng-bind="message"></span>' +
      '</div>',
    replace: true,
    scope: {messages: '&'},
    link: function(scope, el, attrs) {
      scope.messages = [];

      scope.add = function(message) {
        scope.messages.push(message);
      };
      scope.remove = function(message) {
        var index = scope.messages.indexOf(message);
        scope.messages.splice(index, 1);
      };

      scope.$on('flash', function(ev, value, timeout) {
        // var throbber_el = angular.element('<img src="/static/lib/img/throbber-16.gif">');
        scope.add('...');

        // for some reason, .finally() doesn't get the promise's value,
        // so we have to use .then(a, a)
        var done = function(message) {
          // so we recreate
          scope.remove('...');
          scope.add(message);

          // if timeout is null, for example, leave the message permanently
          if (timeout) {
            $timeout(function() {
              scope.remove(message);
            }, timeout);
          }
        };
        // wrap value with .when() to support both strings and promises of strings
        $q.when(value).then(done, done);
      });
    }
  };
})
// # factories
.factory('$laghttp', function($q, $http) {
  // factories are instance generators, i.e., this function is run once and
  // should return a function that generates an instance
  return function(config) {
    var deferred = $q.defer();
    setTimeout(function() {
      $http(config).then(deferred.resolve.bind(deferred), deferred.reject.bind(deferred));
    }, 250);
    return deferred.promise;
  };
})
.factory('$httpqueue', function($q, $http) {
  var deferred = $q.defer();
  var http_queue_promise = deferred.promise;
  deferred.resolve();
  return function($http_options) {
    http_queue_promise = http_queue_promise.then(function() {
      return $http($http_options);
    });
    return http_queue_promise;
  };
});
// .config(function () {})
