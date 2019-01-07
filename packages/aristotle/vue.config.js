const webpack = require('webpack')
const path = require('path')

module.exports = {
  chainWebpack: config => {
    config.module.plugins = [
      new webpack.ProvidePlugin({
        "$":"jquery",
        "jQuery":"jquery",
        "window.jQuery":"jquery"
      })
    ]
    config.alias = {
       // 'jquery-ui': 'jquery-ui-dist/jquery-ui.js'
    }
  }
}