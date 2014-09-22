/*jslint browser: true */ /* globals exports, DOMLib */
/** Copyright 2011-2014, Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/jquery.flags.js

Usage:

    document.getElementsByTagName('button')[0].addEventListener(function(ev) {
      flag(ev.target, {text: 'Clicked!', fade: 3000});
    });

Suggested CSS:

.flag {
  position: absolute;
  background-color: black;
  border-radius: 3px;
  padding: 2px 6px;
  color: white;
}
.flag .triangle {
  position: absolute;
  border: 6px solid transparent;
}

*/
var Flag = {};
(function(Flag) {
  // var nesw2trbl = {n: 't', e: 'r', s: 'b', w: 'l'}; // cardinal direction to css direction
  var opposites = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right'
  };
  var orientations = {
    top: 'horizontal',
    bottom: 'horizontal',
    left: 'vertical',
    right: 'vertical'
  };
  var full_names = {
    t: 'top',
    top: 'top',
    r: 'right',
    right: 'right',
    b: 'bottom',
    bottom: 'bottom',
    l: 'left',
    left: 'left',
    c: 'center',
    center: 'center',
    m: 'middle',
    middle: 'middle'
  };

  var createFlag = function(target_el, content, anchor, align) {
    /** createFlag: create a new flag element and attach it to an element.

    `target_el`: DOM Element
        Element on the page to point at.
    `content`: String | Node
        String or Element to insert into the content part of flag.

    Options:

      `anchor`: 't' | 'r' | 'b' | 'l'
          Edge of the target to be on. Defaults to "r".
      `gravity`: 't' | 'r' | 'b' | 'l' | null
          Side to drift toward along the anchor edge.
            If anchor == 't' or 'b', gravity = 'r' | 'l' | null
            If anchor == 'r' or 'l', gravity = 't' | 'b' | null
      `align`: 'l' | 'c' | 'r' | 't' | 'm' | 'b'
          Alignment within box.
            If anchor == 't' or 'b', align = 'l' | 'c' | 'r'
            If anchor == 'r' or 'l', align = 't' | 'm' | 'b'
          In many cases (if your message is only one line), this won't have any visible effect.
      `fade`: Number (optional)
          Fade out after this many milliseconds
    */
    // var options = resolveOptions(opts);
    // console.log('this.options', this.options);

    // todo? support updating
    // var flag = $target.data('flag');
    // if (!opts.update || !flag) {
    //   flag = new Flag($target, opts.anchor || 'r', opts.align || 'm', opts.parent || document.body);
    // }

    // measure target
    var target_style = getComputedStyle(target_el);
    var target_size = DOMLib.measureStyle(target_style);
    var target_offset = DOMLib.offset(target_el);

    // create elements
    var content_el = DOMLib.El('div', {'class': 'content'}, [content]);
    var triangle_el = DOMLib.El('div', {'class': 'triangle'});
    // set flag position to fixed if the target is fixed.
    var flag_style_string = target_style.position == 'fixed' ? 'position: fixed' : '';
    var flag_el = DOMLib.El('div', {'class': 'flag', style: flag_style_string}, [content_el, triangle_el]);
    // attach as sibling to target
    target_el.parentNode.insertBefore(flag_el, target_el.nextSibling);

    // measure flag
    var flag_style = getComputedStyle(flag_el);
    var flag_size = DOMLib.measureStyle(flag_style);
    // measure triangle
    var triangle_style = getComputedStyle(triangle_el);
    var triangle_radius = parseInt(triangle_style.borderTopWidth, 10);

    var orientation = orientations[anchor];
    var opposite = opposites[anchor];
    // console.log('anchor=%s, opposite=%s, orientation=%s, background_color=%s',
    //   anchor, opposite, orientation, background_color);
    // var gravity = full_names[this.options.gravity];

    // #4a. handle flag anchor
    // allot space to the triangle
    flag_el.style['margin-' + opposite] = triangle_radius + 'px';

    if (anchor == 'top') {
      flag_el.style.top = ((target_offset.top - flag_size.height) - triangle_radius) + 'px';
    }
    else if (anchor == 'right') {
      flag_el.style.left = (target_offset.left + target_size.width) + 'px';
    }
    else if (anchor == 'bottom') {
      flag_el.style.top = (target_offset.top + target_size.height) + 'px';
    }
    else if (anchor == 'left') {
      flag_el.style.left = ((target_offset.left - flag_size.width) - triangle_radius) + 'px';
    }
    else {
      throw new Error('Unsupported anchor: ' + anchor);
    }

    // #4b. handle align:
    if (orientation == 'horizontal') {
      // #4b.i. if anchor is t or b: l | c | r
      if (align == 'left') {
        flag_el.style.left = target_offset.left + 'px';
      }
      else if (align == 'center' || align === undefined) { // default
        flag_el.style.left = (target_offset.left + (target_size.width / 2) - (flag_size.width / 2)) + 'px';
      }
      else if (align == 'right') {
        flag_el.style.left = (target_offset.left + target_size.width - flag_size.width) + 'px';
      }
      else {
        throw new Error('Unsupported align: ' + align);
      }
    }
    else {
      // #4b.ii. if anchor is r or l: t | m | b
      if (align == 'top') {
        flag_el.style.top = target_offset.top + 'px';
      }
      else if (align == 'middle' || align === undefined) { // default
        flag_el.style.top = (target_offset.top + (target_size.height / 2) - (flag_size.height / 2)) + 'px';
      }
      else if (align == 'bottom') {
        flag_el.style.top = (target_offset.top + target_size.height - flag_size.height) + 'px';
      }
      else {
        throw new Error('Unsupported align: ' + align);
      }
    }

    /** Render triangle
    CSS borders are beveled. If only one side of the border is visible, it
    will look like a trapezoid with the small side facing the element. If the
    border is half the height/width of the element, the trapezoid will be a
    triangle, with the small side (a point) in the middle of the element.

    The triangle we want is the shaded x part of the following box element
    (the corner angles are actually 45 degrees):
         _____________
        |\xxxxxxxxxxx/|
        |  \xxxxxxx/  |
        |    \xxx/    |
        |      v      |
        |             |
        |             |
        |_____________|

    */
    if (orientation == 'horizontal') {
      triangle_el.style.left = ((flag_size.width - (triangle_radius * 2)) / 2) + 'px';
    }
    else {
      triangle_el.style.top = ((flag_size.height - (triangle_radius * 2)) / 2) + 'px';
    }
    // we want to show the same border color as the anchor side (which is the side near the flag)
    triangle_el.style['border-' + anchor + '-color'] = flag_style.backgroundColor;
    // and collapse the border that's in the same direction as the anchor (side toward from the target)
    triangle_el.style['border-' + opposite + '-width'] = 0;
    // and push away from the flag a little bit
    triangle_el.style[opposite] = -triangle_radius + 'px';

    // return main flag element so we can listen for clicks / hide it as needed.
    return flag_el;
  };

  var attachFlag = function(target_el, opts) {
    // overload opts as a string / Node, representing the contents
    if (typeof(opts) == 'string' || opts instanceof Node) {
      opts = {content: opts};
    }

    var content = opts.content;
    // opts.anchor should be one of t r b l, or null
    var anchor = full_names[opts.anchor] || 'right';
    var orientation = orientations[anchor];
    // the default align value varies based on the anchor
    var align = full_names[opts.align] || (orientation == 'horizontal') ? 'center' : 'middle';

    // create flag element and attach it
    var flag_el = createFlag(target_el, content, anchor, align);

    // hide it after a timeout if a fade value is specified
    if (opts.fade) {
      setTimeout(function() {
        flag_el.style.display = 'none';
      }, opts.fade);
    }
  };

  if (typeof jQuery !== 'undefined') {
    // attach as jQuery plugin if available
    jQuery.flag = function(target_el, opts) {
      /** jQuery.flag(target, opts) is not chainable:  */
      return attachFlag(target_el, opts);
    };
    jQuery.fn.flag = function(opts) {
      /** jQuery(selector).flag(opts) is chainable, to accord with the general jQuery design pattern. */
      return this.each(function() {
        jQuery.flag(this, opts);
      });
    };
  }
})(typeof exports !== 'undefined' ? exports : Flag);
