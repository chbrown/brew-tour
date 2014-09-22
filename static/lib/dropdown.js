/*jslint browser: true */ /* globals exports, DOMLib */
/** Copyright 2011-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/dropdown.js

Usage:
  <input id="query" autocomplete="off">
  <script>
    var query_el = document.getElementById('query');
    var dropdown = Dropdown.attach(query_el)
      .on('change', function(query) {
        // suppose query == 'ch'
        $.getJSON('/search', {q: query}, function(data, textStatus, jqXHR) {
          // data looks like [{label: 'Charles', value: 'Charles'}, {label: 'Chris', value: 'chris'}, ...]
          dropdown.setOptions(data);
        });
      })
      .on('select', function(value) {
        query_el.value = value;
      });
  </script>
  <style>
    .dropdown {
      margin: 0 2px;
      padding: 0;
      list-style: none;
      border: 1px solid #CCC;
    }
    .dropdown li {
      padding: 1px;
      cursor: default;
    }
    .selected {
      background-color: pink;
    }
  </style>

TODO:
  keep track of mouseover vs. up-down arrow selection, and revert to keyed up-down selection on mouseout.

*/
var Dropdown = {};
(function(Dropdown) {
  var Controller = Dropdown.Controller = function(input_el) {
    /**
    input_el:
        the original text input element that listens for input
    results_el:
        the container element for results
    selected_el:
        the currently element for results

    */
    DOMLib.EventEmitter.call(this);
    this.input_el = input_el;
    // initialize results element, even though we don't use it yet
    this.results_el = DOMLib.El('ul', {'class': 'dropdown', style: 'position: absolute; display: none'});
    // insert results element as a sibling to the input element
    //   if input_el.nextSibling is null, this works just like .appendChild
    this.input_el.parentNode.insertBefore(this.results_el, this.input_el.nextSibling);

    this.input_el.addEventListener('keydown', this.keydown.bind(this));
    this.input_el.addEventListener('keyup', this.keyup.bind(this));
    // simply clicking or tabbing into the box should trigger the dropdown
    var self = this;
    this.input_el.addEventListener('focus', function(event) {
      self.changed();
    });
    this.input_el.addEventListener('blur', function(event) {
      self.reset();
    });
  };
  Controller.prototype = Object.create(DOMLib.EventEmitter.prototype);
  Controller.prototype.constructor = Controller;
  Controller.prototype.keydown = function(event) {
    if (event.which === 13) { // 13 == ENTER
      event.preventDefault();
    }
    else if (event.which == 38) { // 38 == UP-arrow
      if (this.selected_el) {
        // Don't go lower than 0 when clicking up
        if (this.selected_el.previousSibling) {
          this.preselect(this.selected_el.previousSibling);
        }
      }
      event.preventDefault();
    }
    else if (event.which == 40) { // 40 == DOWN-arrow
      event.preventDefault();
      if (this.selected_el) {
        // Don't go higher than the last available option when going down
        if (this.selected_el.nextSibling) {
          this.preselect(this.selected_el.nextSibling);
        }
      }
      else {
        this.preselect(this.results_el.firstChild);
      }
    }
  };
  Controller.prototype.keyup = function(event) {
    if (event.which === 13) { // 13 == ENTER
      this.selected();
      this.reset();
    }
    else {
      this.changed();
    }
  };
  Controller.prototype.selected = function() {
    this.emit('select', this.selected_el.dataset.value, this.selected_el);
  };
  Controller.prototype.changed = function() {
    var query = this.input_el.value;
    if (query !== this.query) {
      this.emit('change', query);
    }
  };
  Controller.prototype.preselect = function(el) {
    if (this.selected_el) {
      this.selected_el.classList.remove('selected');
    }
    if (el) {
      el.classList.add('selected');
      this.emit('preselect', el.dataset.value);
    }
    this.selected_el = el;
  };
  Controller.prototype.reset = function() {
    this.results_el.style.display = 'none';
    // is this the best place for this reset?
    this.query = null;
  };

  Controller.prototype.setOptions = function(options, query) {
    // set this.query so that we know when the input differs from the current query
    this.query = query;

    // clear
    var results_el = this.results_el.cloneNode(false);
    results_el.style.display = options.length > 0 ? 'block' : 'none';
    // while (this.results_el.lastChild) {
    //   results_el.removeChild(this.results_el.lastChild);
    // }
    options.forEach(function(option) {
      // label can be either a string or a DOM element
      var li = DOMLib.El('li', [option.label]);
      li.dataset.value = option.value;

      // I wish I could listen for mouseover / mousedown higher up, but it's harder,
      // since it's hard to listen at a certain level
      li.addEventListener('mouseover', function(event) {
        self.preselect(li);
      });
      li.addEventListener('mousedown', function(event) {
        self.preselect(li);
        self.selected();
      });
      results_el.appendChild(li);
    });

    var self = this;
    results_el.addEventListener('mouseout', function(event) {
      self.preselect(null);
    });

    // MDN: var replacedNode = parentNode.replaceChild(newChild, oldChild);
    this.results_el.parentNode.replaceChild(results_el, this.results_el);
    // and set the current results element to the new one
    this.results_el = results_el;
    this.selected_el = undefined;
  };

  Dropdown.attach = function(input_el) {
    /** Dropdown.attach is the preferred API endpoint for initializing an
    dropdown element. It sets up the controller object, all the listeners,
    and returns the results list element, which has some custom event listeners.
    */
    return new Controller(input_el);
  };
})(typeof exports !== 'undefined' ? exports : Dropdown);
