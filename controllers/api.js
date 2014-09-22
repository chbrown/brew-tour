/*jslint node: true */
var async = require('async');
var Router = require('regex-router');
var child_process = require('child_process');
var logger = require('loge');
var streaming = require('streaming');
var request = require('request');

var summarize = require('../lib/summarize');

var p = console.log.bind(console);

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

var homebrew = {};
homebrew.getFormulas = function(callback) {
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
homebrew.getFormulaInfo = function(formula_name, callback) {
  // See https://github.com/Homebrew/homebrew/wiki/Querying-Brew for --json=v1 info
  var proc = child_process.spawn('brew', ['info', '--json=v1', formula_name]);
  proc.stdout.setEncoding('utf8');

  streaming.readToEnd(proc.stdout, function(err, chunks) {
    if (err) return callback(err);
    var content = chunks.join('');
    var data = JSON.parse(content);
    var formula = data[0];

    logger.info('Getting %s homepage: %s', formula_name, formula.homepage);
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

R.get(/^\/api\/formulas$/, function(req, res) {
  homebrew.getFormulas(function(err, formulas) {
    if (err) return res.die(err);
    res.json(formulas);
  });
});

R.get(/^\/api\/formulas\/([a-z0-9-]+)$/, function(req, res, m) {
  homebrew.getFormulaInfo(m[1], function(err, formula) {
    // max-age is in seconds; 86400 = 1 day; 3600 = 1 hour; 900 = 15 minutes
    res.setHeader('Cache-Control', 'max-age=900'); // 86400
    res.json(formula);
  });
});

module.exports = R.route.bind(R);
