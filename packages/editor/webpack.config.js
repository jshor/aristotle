const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'editor.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'editor',
    umdNamedDefine: true,
    // https://stackoverflow.com/a/49119917
    globalObject: `(typeof self !== 'undefined' ? self : this)`
  },
  plugins: [
    new webpack.ProvidePlugin({
      '$': 'jquery',
      'jquery': 'jquery',
      'window.jQuery': 'jquery',
      'jQuery': 'jquery'
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          // options: {
          //   presets: ['@babel/preset-env'],
          //   plugins: ['@babel/plugin-proposal-class-properties']
          // }
        }
      },
      {
        test: /\.svg$/i,
        use: 'raw-loader'
      }
    ]
  },
  mode: 'development',
  devtool: 'eval-source-map'
}