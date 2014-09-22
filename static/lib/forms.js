/*jslint browser: true */
/** Copyright 2013-2014 Christopher Brown <io@henrian.com>, MIT Licensed

https://raw.github.com/chbrown/misc-js/master/forms.js
http://chbrown.github.io/misc-js/forms.js

Usage:

    var input_container = document.querySelector('.hform');
    var form = new Form(input_container);
    var default_values = {
      first_name: 'John',
      middle_name: 'Quincy',
      phone: '(512) ',
    };
    form.set(default_values);

    // let user change it...
    var user_values = form.get();
    console.log(user_values);

Unlike $.serialize(Array), this is a bit more magical
- See http://api.jquery.com/serializeArray/ and http://api.jquery.com/serialize/ for alternatives.

*/
var Form = (function() {
  function walk(node, callback) {
    /** walk(DOM Node, function): starting at some Node in the DOM,
    recursively walk the tree (depth-first)

    node: Node
    callback: function(Element)

    */
    // (From MDN) node.nodeType will return one of the following constants:
    //  1 ELEMENT_NODE
    //  2 ATTRIBUTE_NODE
    //  3 TEXT_NODE
    //  4 CDATA_SECTION_NODE
    //  5 ENTITY_REFERENCE_NODE
    //  6 ENTITY_NODE
    //  7 PROCESSING_INSTRUCTION_NODE
    //  8 COMMENT_NODE
    //  9 DOCUMENT_NODE
    // 10 DOCUMENT_TYPE_NODE
    // 11 DOCUMENT_FRAGMENT_NODE
    // 12 NOTATION_NODE
    callback(node);
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      if (child.nodeType == 1) {
        walk(child, callback);
      }
    }
  }

  var Input = {};
  Input.get = function(element) {
    // returns list of objects
    var tag = element.tagName.toLowerCase(); // == element.nodeName
    if (tag == 'input') {
      if (element.type === 'checkbox') {
        return [{value: element.value, checked: element.checked}];
      }
      else if (element.type === 'radio') {
        return [{value: element.value, checked: element.checked}];
      }
      else if (element.type === 'hidden') {
        return [{value: element.value, hidden: true}];
      }
      else { // (type =='text' || type == 'password' || ...)
        return [{value: element.value}]; // , type: element.type
      }
    }
    else if (tag == 'select') {
      if (element.multiple) {
        var items = [];
        for (var i = 0; i < element.options.length; i++) {
          var option = element.options[i];
          if (option.selected) {
            items.push({value: option.value, array: true});
          }
        }
        return items;
      }
      else {
        return [{value: element.options[element.selectedIndex].value}];
      }
    }
    else if (tag == 'textarea') {
      return [{value: element.value}];
    }
    else {
      console.log('ignoring element with unsupported tag:', element);
      return [];
    }
  };
  Input.set = function(element, value) {
    // both consume and pop very intentionally have side effects
    var consume = function(val) {
      // returns true if val is in value or is equal to value, and removes val from value
      // returns false and does not change value otherwise
      if (Array.isArray(value)) {
        var index = value.indexOf(val);
        if (index > -1) {
          value.splice(index, 1);
          return true;
        }
        return false;
      }
      else if (value === val) {
        value = null;
        return true;
      }
      return false;
    };
    var pop = function() {
      if (Array.isArray(value)) {
        return value.pop();
      }
      else {
        var val = value;
        value = null;
        return val;
      }
    };

    // value is mutable; returns the part of value that we did not persist to the form
    var tag = element.tagName.toLowerCase();
    if (tag == 'input') {
      if (element.type === 'checkbox') {
        element.checked = consume(element.value == 'on' ? true : element.value);
      }
      else if (element.type === 'radio') {
        element.checked = consume(element.value == 'on' ? true : element.value);
      }
      else { // (type =='text' || type == 'password' || ...)
        var input_val = pop();
        if (input_val !== undefined) element.value = input_val;
      }
    }
    else if (tag == 'select') {
      // we can fill a select[multiple] even with a single value
      for (var i = 0; i < element.options.length; i++) {
        var option = element.options[i];
        option.selected = consume(option.value);
      }
    }
    else if (tag == 'textarea') {
      var textarea_val = pop();
      if (textarea_val !== undefined) element.value = textarea_val;
    }
    else {
      console.log('ignoring element with unsupported tag:', element);
    }
    return value;
  };

  var InputGroup = {};
  InputGroup.get = function(elements) {
    // returns single coalsced value (String | Array | null | ...)
    var grouped_fields = elements.map(Input.get);
    // fields is a list of {value: 'xyz', checked: false}-like objects
    var fields = Array.prototype.concat.apply([], grouped_fields);

    var fieldValue = function(field) {
      // not sure if this is the right treatment
      if (field.checked !== undefined && field.value == 'on') {
        return field.checked;
      }
      else {
        return field.value;
      }
    };

    // handle special input[hidden] + checkbox case
    // we do not have access to the field 'type' attribute anymore, btw.
    if (fields.length == 2 && fields[0].hidden && fields[1].checked !== undefined) {
      return fields[1].checked ? fields[1].value : fields[0].value;
    }
    else if (fields.length) {
      // determine whether we should coerce to array, if:
      //   a) any input has input.array == true, OR
      //   b) there is more than one element in the group
      var array = fields.some(function(obj) { return obj.array === true; }) || fields.length > 1;
      if (array) {
        return fields.map(fieldValue);
      }
      else {
        return fieldValue(fields[0]);
      }
    }
    else {
      return null;
    }
  };
  InputGroup.set = function(elements, value) {
    // handle special cases first
    if (elements.length == 2 && elements[0].type == 'hidden' && elements[1].type == 'checkbox') {
      elements[1].checked = elements[1].value == value;
      // todo: what if the checkbox has no value?
      // should we also do this?: if (elements[1].value != value) elements[0].value = value;
    }
    else {
      // value is mutable; and may become null
      elements.forEach(function(element) {
        value = Input.set(element, value);
      });
    }
  };


  var Form = function(container, opts) {
    this.container = container;
  };
  Form.prototype.getFormData = function() {
    // FormData can be useful for sending directly through AJAX
    // see https://developer.mozilla.org/en-US/docs/Web/API/FormData
    var form_data = new FormData();
    // FormData.append(String name, File | Blob | String value [, String filename])
    throw new Error('Not yet implemented');
    // form_data.append();
    // return form_data;
  };
  Form.prototype.groupByName = function() {
    var groups = {};
    walk(this.container, function(element) {
      if (element.hasAttribute('name')) {
        var name = element.getAttribute('name');
        if (groups[name] === undefined) groups[name] = [];
        groups[name].push(element);
      }
    });
    return groups;
  };
  Form.prototype.get = function() {
    /** form.get(): returns obj using our protocol for transforming
    configurations of input elements into JSON-friendly objects.

    The goal is not to lose information present in the form, but also not

    While the format of the form is flexible, setting the values in the form should be invertable.
    */
    // names: all the inputs with names, grouped by name
    var names = this.groupByName();

    var value = {};
    for (var name in names) {
      value[name] = InputGroup.get(names[name]);
    }
    return value;
  };

  Form.prototype.set = function(value) {
    // group named inputs
    var names = this.groupByName();

    for (var name in names) {
      if (value.hasOwnProperty(name)) {
        var result = InputGroup.set(names[name], value[name]);
      }
    }
  };

  return Form;
})();
