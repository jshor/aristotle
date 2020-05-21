const isDev = process.env.NODE_ENV !== 'production'
const path = require('path')
const filename = isDev ? 'index' : 'index-[hash]'
const webpack = require('webpack')

module.exports = {
  outputDir: path.resolve('../../build/alpha'),
  publicPath: '/alpha',
  productionSourceMap: false,
  configureWebpack: config => {
    config.entry = './src/index.ts'
    config.output.filename = `${filename}.js`

    config.plugins.push(new webpack.ProvidePlugin({
      '$': 'jquery',
      'jquery': 'jquery',
      'window.jQuery': 'jquery',
      'jQuery': 'jquery'
    }))
  }
}
