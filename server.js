var restify = require('restify');
var homebrew = require('./homebrew');

var app = restify.createServer();

app.get(/\/static\/?.*/, restify.serveStatic({
  directory: __dirname,
  default: 'index.html',
}));

app.get('api/formulas/:name', function(req, res, next) {
  homebrew.getFormulaInfo(req.params.name, function(err, formula) {
    if (err) return next(err);
    // max-age is in seconds; 86400 = 1 day; 3600 = 1 hour; 900 = 15 minutes
    res.setHeader('Cache-Control', 'max-age=86400');
    res.send(formula);
    next();
  });
});

app.get('api/formulas', function(req, res, next) {
  homebrew.getFormulas(function(err, formulas) {
    if (err) return next(err);
    res.send(formulas);
    next();
  });
});

app.get('/', function(req, res, next) {
  res.redirect('/static/index.html', next);
});

app.on('listening', function() {
  var address = this.address();
  console.info('server listening on http://%s:%d', address.address, address.port);
});

module.exports = app;
