/*jslint browser: true */
/** Copyright 2012-2014, Christopher Brown <io@henrian.com>, MIT Licensed

Cookies v0.3.0 API:

`cookies.defaults`: settable option defaults. Often something like:

    cookies.defaults = function() {
      var one_month = new Date(new Date().getTime() + 31*24*60*60*1000);
      return {path: '/', expires: one_month};
    };

`cookies.get(name [, options])`: get the string value of the cookie named `name`

`cookies.set(name, value [, options])`: set the string value of the cookie named `name`

`cookies.del(name [, options])`: expire the cookie named `name` and set its value to the empty string

`cookies.all([options])`: get all cookies as an object mapping names to values

This module exposes the `Cookies` class, as well as `cookies`, which is a singleton instance of Cookies

    var Cookies = [closure around class definition];
    var cookies = new Cookies();

https://raw.github.com/chbrown/misc-js/master/cookies.js

*/
var Cookies = (function() {
  function mergeDefaults(target, defaults) {
    /** mergeDefaults: extend an object with potentially missing fields with specified default values

    `target`: Object | null
    `defaults`: Object | function() -> Object

    `defaults` can be either an Object or a 0-argument function that returns an Object.

    The `defaults` should never override any values in `target` (even null or undefined).
    */
    // if `defaults` is a function, call it to get an object we can iterate over
    if (target === undefined) target = {};
    var source = defaults.call ? defaults() : defaults;
    for (var key in source) {
      if (source.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  var Cookies = function(defaults) {
    this.defaults = defaults || {};
  };
  Cookies.version = '0.3.0';

  Cookies.prototype.get = function(name, opts) {
    // get() called without parameters (or with null) defers to all()
    if (name === undefined || name === null) return this.all(opts);

    // otherwise, simply returns a single string value
    opts = mergeDefaults(opts, this.defaults);

    var document_cookie = document.cookie;
    var cookies = (document_cookie && document_cookie !== '') ? document_cookie.split(/\s*;\s*/) : [];
    for (var i = 0, cookie; (cookie = cookies[i]); i++) {
      // Does this cookie string begin with the name we want?
      if (cookie.slice(0, name.length + 1) == (name + '=')) {
        var raw = cookie.slice(name.length + 1);
        return opts.raw ? raw : decodeURIComponent(raw);
      }
    }
  };

  Cookies.prototype.set = function(name, value, opts) {
    opts = mergeDefaults(opts, this.defaults);

    var encode = opts.raw ? function(s) { return s; } : encodeURIComponent;

    var pairs = [[encode(name), encode(value.toString())]];
    if (opts.expires) pairs.push(['expires', opts.expires.toUTCString ? opts.expires.toUTCString() : opts.expires]);
    if (opts.path) pairs.push(['path', opts.path]);
    if (opts.domain) pairs.push(['domain', opts.domain]);
    if (opts.secure) pairs.push(['secure']);
    var cookie = pairs.map(function(pair) { return pair.join('='); }).join('; ');
    document.cookie = cookie;
    return cookie;
  };

  Cookies.prototype.del = function(name, opts) {
    opts = mergeDefaults(opts, this.defaults);

    // delete by setting the expirartion date to the UNIX epoch (Thu, 01 Jan 1970 00:00:00 GMT)
    return this.set(name, '', {expires: new Date(0)});
  };

  Cookies.prototype.all = function(opts) {
    opts = mergeDefaults(opts, this.defaults);

    var cookies = {};
    var document_cookie = document.cookie;
    var cookies_list = (document_cookie && document_cookie !== '') ? document_cookie.split(/\s*;\s*/) : [];
    var cookies_length = cookies_list.length;
    for (var i = 0; i < cookies_length; i++) {
      var cookie = cookies_list[i];
      var cookie_parts = cookie.split('=');
      var cookie_value = cookie_parts.slice(1).join('=');
      cookies[cookie_parts[0]] = opts.raw ? cookie_value : decodeURIComponent(cookie_value);
    }
    return cookies;
  };

  return Cookies;
})();
var cookies = new Cookies();
