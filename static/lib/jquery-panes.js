/*jslint browser: true */ /*globals $ */
/** Copyright 2011-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/jquery-panes.js

*/
var PaneManager = (function($) {
  var PaneManager = function(opts) {
    this.$el = $(opts.el);
    // initialize stuff
    this.$el.css({width: '100%', height: '100%'});
  };
  PaneManager.prototype.add = function($pane) {
    // $pane could actually be html, just as well
    this.$el.append($pane);
    this.layout();
  };
  PaneManager.prototype.limit = function(count) {
    this.$el.children().slice(count).remove();
    this.layout();
  };
  PaneManager.prototype.set = function(index, $pane) {
    var $panes = this.$el.children();
    if ($panes.length == index) {
      // just like this.add()
      this.$el.append($pane);
      this.layout();
    }
    else {
      // throw error or just don't do anything if $panes.length == 2 and we set(4, '<br/>'), e.g.
      $panes.eq(index).replaceWith($pane);
      this.layout();
    }
  };
  PaneManager.prototype.layout = function(orientation) {
    if (orientation === undefined) orientation = 'v';
    var $panes = this.$el.children().attr('style', '').css({overflow: 'auto'});
    // console.log('layout -> ', $panes.length);
    if ($panes.length == 1) {
      // $panes.css({width: '', height: ''});
      $panes.css({
        width: '100%',
        height: '100%'
      });
    }
    else if ($panes.length == 2) {
      if (orientation == 'v') {
        $panes.eq(0).css({width: '50%'});
        $panes.eq(1).css({
          'position': 'absolute',
          'top': 0,
          'left': '50%'
          // 'min-height': '100%'
        });
      }
      else {
        $panes.eq(0).css({height: '50%'});
        $panes.eq(1).css({
          'position': 'absolute',
          'top': '50%'
          // 'min-height': '50%'
        });
      }
    }
    else if ($panes.length == 3) {
      // the first is the biggest
      // var $panes.eq(1) = $panes.eq(2);
      if (orientation == 'v') {
        /*  +--+--+
            |  |  |
            |  +--+
            |  |  |
            +--+--+  */
        $panes.eq(0).css({width: '50%'});
        $panes.eq(1).css({left: '50%', height: '50%'});
        $panes.eq(2).css({left: '50%'});
      }
      else {
        /*  +--+--+
            |     |
            +--+--+
            |  |  |
            +--+--+  */
        $panes.eq(0).css({height: '50%'});
        $panes.eq(1).css({width: '50%'});
        $panes.eq(2).css({left: '50%'});
      }
    }
    else {
      throw new Error('Too many panes. Maximum is 3.');
    }
  };

  $.fn.panes = function(opts) {
    // only use the first item
    return new PaneManager({el: this[0]});
  };

  return PaneManager;
})($);
