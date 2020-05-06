const path = require('path')
const ManifestPlugin = require('webpack-manifest-plugin')

const filename = process.env.NODE_ENV !== 'production'
  ? 'index'
  : 'index-[hash]'

module.exports = {
  outputDir: path.join(__dirname, '../../build/app'),
  publicPath: '/app',
  productionSourceMap: false,
  devServer: {
    stats: 'errors-only',
    disableHostCheck: true,
    hot: true,
    progress: false,
    watchOptions: {
      aggregateTimeout: 300,
      poll: true
    }
  },
  chainWebpack: config => {
    config.plugins.delete('progress')
  },
  configureWebpack: config => {
    config.entry = './src/index.ts'
    config.output.filename = `${filename}.js`

    config.plugins.push(new ManifestPlugin())
  },
  css: {
    loaderOptions: {
      sass: {
        prependData: `
          @import "@/styles/_variables.scss";
          @import "@/styles/_overrides.scss";
          @import '~@fortawesome/fontawesome-free/scss/fontawesome';
          @import '~@fortawesome/fontawesome-free/scss/solid';

          @import '~open-sans-fonts/open-sans.scss';
        `
      }
    }
  }
}