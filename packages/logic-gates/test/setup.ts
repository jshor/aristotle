const fs = require('fs')
const path = require('path')
const diff = require('jest-diff')
const chalk = require('chalk')

declare namespace jest {
  interface Matchers<R> { //  Matchers<R> extends
    toMatchSvg(): CustomMatcherResult;
  }
}

const getSvgFolderPath = (testPath: string) => {
  const baseDir = testPath
    .split('/')
    .slice(0, -1)
    .join('/')

  return path.join(baseDir, '__svgs__')
}

const getFileName = (testName: string) => {
  const fileName = testName
    .replace(/[^0-9a-z_\- ]/ig, '')
    .replace(/ /g, '_')

  return `${fileName}.svg`
}

const mkdir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, 0o744)
  }
}

expect.extend({
  toMatchSvg (received) {
    const pathName = getSvgFolderPath(this['testPath'])
    const fileName = getFileName(this['currentTestName'])
    const filePath = path.join(pathName, fileName)
    const shouldUpdate = this['snapshotState']._updateSnapshot === 'all'

    mkdir(pathName)

    if (!fs.existsSync(filePath) || shouldUpdate) {
      fs.writeFileSync(filePath, received)

      if (shouldUpdate) {
        console.log(chalk.green(`1 SVG snapshot updated`))
      }

      return {
        pass: true,
        message: () => 'SVG written for the first time.'
      }
    }

    const expected = fs.readFileSync(filePath).toString()

    return {
      pass: expected === received,
      message: () => `Provided SVG does not match snapshot. ${diff(expected, received)}`
    }
  }
})
