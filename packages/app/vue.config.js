const path = require('path')

const title = 'Aristotle'

module.exports = {
  lintOnSave: false,
  outputDir: path.resolve('../../build/alpha'),
  publicPath: '/alpha',
  productionSourceMap: false,
  pages: {
    index: {
      title,
      entry: 'src/main.ts',
      template: 'public/index.html',
      filename: 'index.html',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
    splash: {
      title,
      entry: 'src/styles/splash.scss',
      template: 'public/splash.html',
      filename: 'splash.html'
    }
  },
  pluginOptions: {
    electronBuilder: {
      chainWebpackRendererProcess: config => {
        config.target('web');
      },
      preload: 'src/preload',
      // list all node_modules paths so that electron builder can find them in this monorepo
      nodeModulesPath: ['../../node_modules', './node_modules'],
      builderOptions: {
        // electron-builder config: https://www.electron.build/
        productName: title,
        directories: {
          buildResources: 'public/resources'
        },
        win: {
          target: 'nsis'
        },
        nsis: {
          oneClick: false,
          perMachine: true,
          allowToChangeInstallationDirectory: true
        }
      }
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
