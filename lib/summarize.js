/*jslint node: true */
var logger = require('loge');
var htmlparser2 = require('htmlparser2');

var tag_scores = {
  title: 100000,
  h1: 50000,
  h2: 10000,
  h3: 5000,
  h4: 1000,
  h5: 500,
  h6: 100,
  main: 1000,
  section: 500,
  article: 500,
  p: 100,
  ul: 100,
  ol: 200,
  script: -100000,
  style: -100000,
};

var meta_scores = {
  description: 10000,
  keywords: 5000,
  author: 1000,
};

var Handler = module.exports = function(callback) {
  /** From the docs: https://github.com/fb55/htmlparser2/wiki/Parser-options

      onopentag(<str> name, <obj> attributes)
      onopentagname(<str> name)
      onattribute(<str> name, <str> value)
      ontext(<str> text)
      onclosetag(<str> name)
      onprocessinginstruction(<str> name, <str> data)
      oncomment(<str> data)
      oncommentend()
      oncdatastart()
      oncdataend()
      onerror(<err> error)
      onreset()
      onend()
  */
  this.callback = callback;
  this.spans = [];
  // current score:
  this._score = 1;
  this._position = -50;
};

Handler.prototype.onreset = function() {
  // logger.debug('Handler reset');
  Handler.call(this, this.callback);
};

Handler.prototype.onend = function() {
  // logger.debug('Handler end');
  this.callback(null, this.spans);
};

Handler.prototype.onerror = function(error) {
  logger.error('HTML Handler error: %s', error);
  this.callback(error);
};

Handler.prototype.onopentag = function(name, attribs) {
  this._score += tag_scores[name] || 0;

  if (name == 'meta' && attribs.name && attribs.content) {
    this.spans.push({
      score: meta_scores[attribs.name.toLowerCase()],
      content: attribs.content
    });
  }
};

Handler.prototype.onclosetag = function(name) {
  this._score -= tag_scores[name] || 0;
};

Handler.prototype.ontext = function(data) {
  if (this.spans.length && this.spans[this.spans.length - 1].score == this._score) {
    // merge if possible
    var last_span = this.spans.pop();
    data = last_span.content + data;
  }
  this._position++;

  this.spans.push({
    score: this._score - this._position,
    content: data,
  });
};

var summarize = module.exports = function(html, minimum_score, callback) {
  var handler = new Handler(function(err, spans) {
    if (err) return callback(err);

    var text = spans.filter(function(span) {
      return span.score >= minimum_score && span.content.trim().length > 1;
    }).sort(function(span_a, span_b) {
      // sort descending by score
      return span_b.score - span_a.score;
    }).map(function(span) {
      return span.content.replace(/\s+/g, ' ').trim();
    }).join('; ');

    callback(null, text);
  });

  var parser = new htmlparser2.Parser(handler, {decodeEntities: true});
  parser.write(html);
  parser.end();
};

// var summarizeURL = function(url, minimum_score, callback) {
//   var request = require('request');

//   request.get(url, function(err, response, body) {
//     summarize(body, minimum_score, callback);
//   });
// };

// var main = function() {
//   var printSummary = function(url) {
//     summarizeURL(url, 25, function(err, text) {
//       if (err) throw err;
//       console.log(url, text);
//     });
//   };

//   printSummary('http://jonas.nitro.dk/tig/');
//   // printSummary('http://henrian.com/');
// };

if (require.main === module) {
  var request = require('request');
  var async = require('async');

  var argv = require('optimist').argv;

  // process.stdin.setEncoding('utf8');
  // streaming.readToEnd(process.stdin, function(err, chunks) {
    // var url = chunks.join('');
  async.each(argv._, function(url, callback) {
    request.get(url, function(err, response, body) {
      if (err) throw err;
      summarize(body, 25, function(err, text) {
        if (err) throw err;

        console.log(url, text);
      });
    });
  });
}