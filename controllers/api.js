var Router = require('regex-router');
var homebrew = require('../homebrew');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

R.get(/^\/api\/formulas$/, function(req, res) {
  homebrew.getFormulas(function(err, formulas) {
    if (err) return res.die(err);
    res.json(formulas);
  });
});

R.get(/^\/api\/formulas\/([a-z0-9+_-]+)$/, function(req, res, m) {
  homebrew.getFormulaInfo(m[1], function(err, formula) {
    // max-age is in seconds; 86400 = 1 day; 3600 = 1 hour; 900 = 15 minutes
    res.setHeader('Cache-Control', 'max-age=86400');
    res.json(formula);
  });
});

module.exports = R.route.bind(R);
