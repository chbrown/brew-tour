#!/usr/bin/env node
/*jslint node: true */
var http = require('http-enhanced');
var logger = require('loge');

var controllers = require('./controllers');

var server = module.exports = http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  controllers(req, res);
}).on('listening', function() {
  var address = server.address();
  logger.info('server listening on http://%s:%d', address.address, address.port);
});

if (require.main === module) {
  server.listen(parseInt(process.env.PORT) || 1394, process.env.HOSTNAME);
}
