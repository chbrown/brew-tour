/*jslint browser: true */ /* globals exports */
/** Copyright 2014, Christopher Brown <io@henrian.com>, MIT Licensed

A collection of DOM helpers, and other useful includes, for modern browsers.

*/
var DOMLib = {};
(function(DOMLib) {
  function atoi(str) {
    return parseInt(str, 10);
  }

  var EventEmitter = DOMLib.EventEmitter = function() {
    /** EventEmitter is an extensible class with .on() and .emit() methods

    Use like:

    var Cleaner = function(element) {
      DOMLib.EventEmitter.call(this);
    };
    Cleaner.prototype = Object.create(DOMLib.EventEmitter.prototype);
    Cleaner.prototype.constructor = Cleaner;
    */
    this.events = {};
  };
  EventEmitter.prototype.on = function(name, callback, context) {
    if (this.events[name] === undefined) this.events[name] = [];
    this.events[name].push({fn: callback, thisArg: context});
    return this;
  };
  EventEmitter.prototype.off = function(name, callback) {
    for (var i = (this.events[name] ? this.events[name].length : 0) - 1; i >= 0; i--) {
      if (this.events[name][i].callback === callback) {
        this.events[name].splice(i, 1);
      }
    }
    return this;
  };
  EventEmitter.prototype.emit = function(name /*, args*/) {
    var length = this.events[name] ? this.events[name].length : 0;
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < length; i++) {
      var handler = this.events[name][i];
      handler.fn.apply(handler.thisArg, args);
    }
    return this;
  };

  DOMLib.extend = function(target /*, sources... */) {
    if (target === undefined) target = {};
    // var sources = Array.prototype.slice.call(arguments, 1);
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  DOMLib.measureStyle = function(style) {
    return {
      width: atoi(style.width) +
        atoi(style.borderLeftWidth) +
        atoi(style.borderLeftWidth) +
        atoi(style.borderRightWidth) +
        atoi(style.paddingLeft) +
        atoi(style.paddingRight),
      height: atoi(style.height) +
        atoi(style.borderTopWidth) +
        atoi(style.borderBottomWidth) +
        atoi(style.paddingTop) +
        atoi(style.paddingBottom)
    };
  };
  DOMLib.measureBox = function(el) {
    /** measureBox(element) returns a {width: Number, height: Number} object. */
    // probably not optimal...
    var style = getComputedStyle(el);
    return DOMLib.sumBoxStyle(style);
  };
  DOMLib.offset = function(el) {
    var rect = el.getBoundingClientRect();
    return {
      left: rect.left + document.body.scrollLeft,
      top: rect.top + document.body.scrollTop,
      width: rect.width,
      height: rect.height
    };
  };
  DOMLib.El = function(tagName, attributes, childNodes) {
    if (childNodes === undefined) {
      if (Array.isArray(attributes)) {
        // overload as El(tagName, childNodes)
        childNodes = attributes;
        attributes = {};
      }
      else {
        // default to empty list of children
        childNodes = [];
      }
    }
    // 1. create element
    var el = document.createElement(tagName);
    // 2. set attributes
    for (var key in attributes) {
      el.setAttribute(key, attributes[key]);
    }
    // 3. add children
    childNodes.forEach(function(childNode) {
      // 3a. automatically convert plain strings to text nodes
      if (!(childNode instanceof Node)) {
        childNode = document.createTextNode(String(childNode));
      }
      el.appendChild(childNode);
    });
    return el;
  };
  DOMLib.stripTags = function(html) {
    return html.replace(/<[^>]+>/g, '');
  };
})(typeof exports !== 'undefined' ? exports : DOMLib);
