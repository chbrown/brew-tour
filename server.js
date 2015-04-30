var http = require('http-enhanced');
var logger = require('loge');
var controllers = require('./controllers');

module.exports = http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  controllers(req, res);
}).on('listening', function() {
  var address = this.address();
  logger.info('server listening on http://%s:%d', address.address, address.port);
});
