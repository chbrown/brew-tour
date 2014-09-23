/*jslint node: true */
var logger = require('loge');
// var path = require('path');
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

R.any(/^\/api/, require('./api'));
R.any(/^\/static/, require('./static'));

R.get(/^\//, function(req, res) {
  res.redirect('/static/index.html');
});

module.exports = R.route.bind(R);
