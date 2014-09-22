/*jslint node: true */
var path = require('path');
var http = require('http-enhanced');
var logger = require('loge');

// consolidate config
var config = require('./package').config;
process.env.port = process.env.npm_config_port || config.port;
process.env.hostname = process.env.npm_config_hostname || config.hostname;

// start server
var root_controller = require('./controllers');
http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  root_controller(req, res);
}).listen(process.env.port, process.env.hostname, function() {
  logger.info('listening on http://%s:%d', process.env.hostname, process.env.port);
});
