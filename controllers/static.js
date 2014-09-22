/*jslint node: true */
var send = require('send');

var path = require('path');
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

// static/*
R.get(/^\/static\/([^?]+)(\?|$)/, function(req, res, m) {
  var root = path.join(__dirname, '..', 'static');
  send(req, m[1], {root: root})
    .on('error', function(err) {
      res.die(err.status || 500, 'send error: ' + err.message);
    })
    .on('directory', function() {
      res.status(404).die('No resource at: ' + req.url);
    })
    .pipe(res);
});

module.exports = R.route.bind(R);
