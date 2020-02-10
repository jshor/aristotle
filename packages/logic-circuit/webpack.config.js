const path = require('path')

module.exports = {
  stats: 'minimal',
  entry: './src/index.ts',
  output: {
    filename: 'logic-circuit.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'editor',
    umdNamedDefine: true,
    // // https://stackoverflow.com/a/49119917
    globalObject: `(typeof self !== 'undefined' ? self : this)`
  },
  resolve: {
    // modulesDirectories: ['node_modules'],
    extensions: ['.ts'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  mode: 'development',
  devtool: 'eval-source-map'
}
