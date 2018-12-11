const chalk = require('chalk')

class Reporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    if (results.numFailedTests) {
      const count = results
        .testResults
        .filter(({ failureMessage }) => failureMessage.includes('SVG does not match'))
        .length

      console.log(chalk.red(`${count} SVG snapshot(s) failed.`))
    }
  }
}

module.exports = Reporter
