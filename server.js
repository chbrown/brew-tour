#!/usr/bin/env node
/*jslint node: true */
var path = require('path');
var http = require('http-enhanced');
var logger = require('loge');

// consolidate config
var config = require('./package').config;
process.env.port = process.env.npm_config_port || config.port;
process.env.hostname = process.env.npm_config_hostname || config.hostname;

var argv = require('optimist').argv;
logger.level = argv.verbose ? 'debug' : 'info';

var root_controller = require('./controllers');
http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  root_controller(req, res);
}).listen(process.env.port, process.env.hostname, function() {
  logger.info('Ready; go to http://%s:%d/ in your browser', process.env.hostname, process.env.port);
});
