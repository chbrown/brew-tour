const optimist = require('optimist')
const restify = require('restify')

const homebrew = require('./homebrew')

const app = restify.createServer()

app.get(/\/static\/?.*/, restify.plugins.serveStatic({
  directory: __dirname,
  default: 'index.html',
}))

app.get('api/formulas/:name', (req, res, next) => {
  homebrew.getFormulaInfo(req.params.name, (err, formula) => {
    if (err) return next(err)
    // max-age is in seconds; 86400 = 1 day; 3600 = 1 hour; 900 = 15 minutes
    res.setHeader('Cache-Control', 'max-age=86400')
    res.send(formula)
    next()
  })
})

app.get('api/formulas', (req, res, next) => {
  homebrew.getFormulas((err, formulas) => {
    if (err) return next(err)
    res.send(formulas)
    next()
  })
})

app.get('/', (req, res, next) => {
  res.redirect('/static/index.html', next)
})

app.on('listening', function() {
  const address = this.address()
  console.info('server listening on http://%s:%d', address.address, address.port)
})

module.exports = app

function main() {
  const argvparser = optimist
  .usage('brew-tour --port 1394 -v')
  .describe({
    hostname: 'hostname to listen on',
    port: 'port to listen on',
    help: 'print this help message',
    verbose: 'print extra output',
    version: 'print version',
  })
  .boolean(['help', 'verbose', 'version'])
  .alias({help: 'h', port: 'p', verbose: 'v'})
  .default({
    hostname: process.env.HOSTNAME || '127.0.0.1',
    port: parseInt(process.env.PORT, 10) || 1394,
    verbose: process.env.DEBUG !== undefined,
  })

  const argv = argvparser.argv

  if (argv.help) {
    argvparser.showHelp()
  }
  else if (argv.version) {
    console.log(require('./package').version)
  }
  else {
    app.listen(argv.port, argv.hostname)
  }
}
module.exports.main = main

if (require.main === module) {
  main()
}
