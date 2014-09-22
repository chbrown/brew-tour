/*jslint browser: true */ /*globals $ */
/** Copyright 2012-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/jquery.persistence.js

*/
var EventEmitter = {
  _JQInit: function() {
    this._JQ = $(this);
  },
  emit: function(ev) {
    if (!this._JQ) this._JQInit();
    this._JQ.trigger.apply(this._JQ, [ev, Array.prototype.slice.call(arguments, 1)]);
  },
  once: function(evt, handler) {
    if (!this._JQ) this._JQInit();
    this._JQ.one(evt, handler);
  },
  on: function(evt, handler) {
    if (!this._JQ) this._JQInit();
    this._JQ.bind(evt, handler);
  },
  off: function(evt, handler) {
    if (!this._JQ) this._JQInit();
    this._JQ.unbind(evt, handler);
  }
};

function isUniqueSelector(sel) { return $(sel).length == 1; }
function findUniqueSelector(el) {
  // strategies: find the first selector that can uniquely describe the given element
  // xxx: This function needs some work
  var keys = ['tagName', 'id', 'name', 'data-persist'];
  // var candidates = [];
  for (var k in keys) {
    if (el[keys[k]]) {
      // var candidate = prefix + el[keys[k]];
      var candidate = el[keys[k]];
      if (isUniqueSelector(candidate)) {
        return candidate;
      }
      // candidates.push(prefix + el[keys[k]]);
    }

  }
  var parent_selector = findUniqueSelector(el.parentNode, '');
  return findUniqueSelector(parent_selector + ' > ' + el);
}

function ControlSet(sel, tagName, type) {
  // can be an input, textarea, group of radio buttons, etc.
  this.sel = sel;
  this.tagName = tagName.toLowerCase();
  this.type = type.toLowerCase();

  this.initialize();
}
$.extend(ControlSet.prototype, EventEmitter);
ControlSet.prototype.initialize = function(value) {
  var self = this;
  if (this.tagName === 'select') {
    $(this.sel).on('change', function(ev) {
      // $(sel).children('option:selected').val()
      self.emit('change', self.sel, $(this).val());
    });
  }
  else if (this.type === 'checkbox') {
    $(this.sel).on('click', function(ev) {
      self.emit('change', self.sel, $(this).prop('checked'));
    });
  }
  else if (this.type === 'radio') {
    $(this.sel).on('click', function(ev) {
      self.emit('change', self.sel, $(this).val());
    });
  }
  else {
    $(this.sel).on('change keyup', function(ev) {
      self.emit('change', self.sel, $(this).val());
    });
  }
};
ControlSet.prototype.set = function(value) {
  if (this.tagName === 'select') {
    $(this.sel).children('option[value="' + value + '"]').prop('selected', true);
  }
  else if (this.type === 'radio') {
    // TODO: support getting (trimmed) html/text from parent label when value is not specified
    $(this.sel).filter('[value="' + value + '"]').prop('checked', true);
  }
  else if (this.type === 'checkbox') {
    $(this.sel).prop('checked', value.toString().toLowerCase() === 'true');
  }
  else {
    $(this.sel).val(value);
  }
};

function Persistence() {
  // simply mark inputs, selects, textarea, etc. with the data-persist attribute
  this.controls = {};
}
$.extend(Persistence.prototype, EventEmitter);
Persistence.prototype.initialize = function() {
  var self = this;
  $('[data-persist]').each(function() {
    // var sel = findUniqueSelector(this);
    var sel;
    if (this.id)
      sel = '#' + this.id;
    else if (this.name)
      sel = '[name="' + this.name + '"]';
    var control = new ControlSet(sel, this.tagName, this.type);
    var value = localStorage[sel];
    if (value !== undefined) {
      control.set(value);
    }
    control.on('change', function(ev, sel, value) {
      // console.log('control changed:', ev, ',', sel, '.', value);
      // first off, save
      localStorage[sel] = value;
      // second, notify anyone who might be listening
      self.emit('change', sel, value);
    });
    self.controls[sel] = control;
  });
};

var persistence = new Persistence();

$(function() {
  persistence.initialize();
  persistence.emit('ready');
});
