const child_process = require('child_process');
const streaming = require('streaming');
const Splitter = require('streaming/splitter').Splitter;
const websum = require('websum');

const request = require('request').defaults({
  headers: {
    // libev happens to blocks blank User-Agents (?!); adopt current Chrome's
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
  },
});

function getFormulas(callback) {
  const proc = child_process.spawn('brew', ['list']);
  const stream = proc.stdout.pipe(new Splitter()).setEncoding('utf8');
  streaming.readToEnd(stream, (err, formula_names) => {
    if (err) return callback(err);

    const formulas = formula_names.map(name => ({name}));

    callback(null, formulas);
  });
}
exports.getFormulas = getFormulas;

function getFormulaInfo(formula_name, callback) {
  // See https://github.com/Homebrew/homebrew/wiki/Querying-Brew for --json=v1 info
  const proc = child_process.spawn('brew', ['info', '--json=v1', formula_name]);
  proc.stdout.setEncoding('utf8');
  streaming.readToEnd(proc.stdout, (err, chunks) => {
    if (err) return callback(err);

    const content = chunks.join('');
    console.info('Formula info for %s: %s', formula_name, content);
    let formula;
    try {
      // this breaks for old things like gfortran and pil, which don't return JSON for --json=v1
      const formulas = JSON.parse(content);
      formula = formulas[0];
    }
    catch (exc) {
      console.error('Error parsing JSON: %s', exc.message);
    }

    if (formula) {
      console.info('Fetching %s homepage: %s', formula_name, formula.homepage);
      request.get(formula.homepage, (err, response, body) => {
        if (err) return callback(err);

        websum.summarizeHtml(body, 25, (err, summary) => {
          if (err) return callback(err);

          formula.summary = summary;

          callback(err, formula);
        });
      });
    }
    else {
      callback(err, formula);
    }
  });
}
exports.getFormulaInfo = getFormulaInfo;
