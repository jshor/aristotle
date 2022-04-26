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
  },
  chainWebpack: config => {
    config.performance
      .maxEntrypointSize(1000000)
      .maxAssetSize(500000)
  },
  pluginOptions: {
    electronBuilder: {
      // list all node_modules paths so that electron builder can find them in this monorepo
      nodeModulesPath: ['../../node_modules', './node_modules']
    }
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import "@/styles/_globals.scss";
          @import "@/styles/_variables.scss";
        `
      }
    }
  }
}
