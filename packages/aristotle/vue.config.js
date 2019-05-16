const webpack = require('webpack')

module.exports = {
  configureWebpack: {
    // module: {
    //   rules: [
    //     {
    //       test: /\.(svg)(\?.*)?$/,
    //       use: [
    //         {
    //           loader: 'svg-inline-loader',
    //           options: {
    //             limit: 10000,
    //             name: 'assets/img/[name].[hash:7].[ext]'
    //           }
    //         }
    //       ]
    //     }
    //   ]
    // }
  },
  chainWebpack: (config) => {
    config.resolve.symlinks(false)
  },
  // chainWebpack: config => {
  //   config.module
  //     .rule('svg')
  //     .test(() => false)
  //     .use('file-loader')
  // },
  css: {
    loaderOptions: {
      sass: {
        data: `
          @import "@/styles/_variables.scss";
          @import "@/styles/_overrides.scss";
          @import '~@fortawesome/fontawesome-free/scss/fontawesome';
          @import '~@fortawesome/fontawesome-free/scss/solid';
        `
      }
    }
  }
}
