const path = require('path')

const isDev = process.env.NODE_ENV !== 'production'
const filename = isDev ? 'index' : 'index-[hash]'

module.exports = {
  lintOnSave: false,
  outputDir: path.resolve('../../build/alpha'),
  publicPath: '/alpha',
  productionSourceMap: false,
  configureWebpack: config => {
    config.output.filename = `${filename}.js`
  }
}
