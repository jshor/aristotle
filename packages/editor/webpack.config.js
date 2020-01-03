const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'editor.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'editor',
    umdNamedDefine: true,
    // https://stackoverflow.com/a/49119917
    globalObject: `(typeof self !== 'undefined' ? self : this)`
  },
  resolve: {
    extensions: ['.ts', '.js']
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
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      },
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
