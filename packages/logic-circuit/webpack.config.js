var path = require('path')
var webpack = require('webpack')

const PATHS = {
  src: path.join(__dirname, './src'),
  build: path.join(__dirname, './dist')
}

module.exports = {
  mode: 'development',
  entry: {
    'logic-gates': PATHS.src + '/ic.ts'
  },
  output: {
    path: PATHS.build,
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ]
  }
}

// module.exports = {
//   entry: path.resolve(__dirname, 'src/index.ts'),
//   module: {
//     rules: [
//       {
//         test: /\.tsx?$/,
//         use: 'ts-loader',
//         exclude: /node_modules/
//       }
//     ]
//   },
//   resolve: {
//     extensions: [ '.tsx', '.ts', '.js' ]
//   },
//   output: {
//     filename: 'bundle.js',
//     path: path.resolve(__dirname, 'dist'),
//     libraryTarget: 'umd',
//     library: 'lib',
//     umdNamedDefine: true,
//   },
//   watchOptions: {
//     poll: true
//   }
// }