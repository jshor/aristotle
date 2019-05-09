const webpack = require('webpack')

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        '$': 'jquery',
        'jquery': 'jquery',
        'window.jQuery': 'jquery',
        'jQuery': 'jquery'
      })
    ]
  },
  css: {
    loaderOptions: {
      sass: {
        data: `
          @import "@/styles/_variables.scss";
          @import "@/styles/_overrides.scss";
          @import '~@fortawesome/fontawesome-free/scss/fontawesome';
          @import '"~@fortawesome/fontawesome-free/scss/solid';
        `
      }
    }
  }
}
