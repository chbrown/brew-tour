/*jslint node: true */
var child_process = require('child_process');
var streaming = require('streaming');
var logger = require('loge');
var summarize = require('./summarize');

var request = require('request').defaults({
  headers: {
    // libev happens to blocks blank User-Agents (?!); adopt current Chrome's
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36'
  }
});

exports.getFormulas = function(callback) {
  var proc = child_process.spawn('brew', ['list']);
  var stream = proc.stdout.pipe(new streaming.Splitter()).setEncoding('utf8');
  streaming.readToEnd(stream, function(err, formula_names) {
    if (err) return callback(err);

    var formulas = formula_names.map(function(formula_name) {
      return {name: formula_name};
    });

    callback(null, formulas);
  });
};

exports.getFormulaInfo = function(formula_name, callback) {
  // See https://github.com/Homebrew/homebrew/wiki/Querying-Brew for --json=v1 info
  var proc = child_process.spawn('brew', ['info', '--json=v1', formula_name]);
  proc.stdout.setEncoding('utf8');

  streaming.readToEnd(proc.stdout, function(err, chunks) {
    if (err) return callback(err);

    var content = chunks.join('');
    logger.debug('Formula info for %s: %s', formula_name, content);
    // TODO: this breaks for old things like gfortran and pil, which don't return JSON for --json=v1
    var data = JSON.parse(content);
    var formula = data[0];

    logger.debug('Fetching %s homepage: %s', formula_name, formula.homepage);
    request.get(formula.homepage, function(err, response, body) {
      if (err) return callback(err);

      summarize(body, 25, function(err, summary) {
        if (err) return callback(err);

        formula.summary = summary;

        callback(err, formula);
      });
    });
  });
};
