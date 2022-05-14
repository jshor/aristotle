const title = 'Aristotle'

module.exports = {
  lintOnSave: false,
  outputDir: 'build/web',
  publicPath: '/web',
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
      electronVersion: '18.2.0',
      chainWebpackRendererProcess: config => config.target('web'),
      extraFiles: [
        'public'
      ],
      mainProcessFile: 'src/process/main',
      preload: 'src/process/preload',
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
        },
        fileAssociations: [
          {
            ext: 'alfx',
            description: 'Aristotle Logic File',
            mimeType: 'application/alfx',
            role: 'Editor',
            icon: 'circuit-icon.ico'
          }
        ]
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
