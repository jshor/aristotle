import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'umd',
    name: 'editor',
    exports: 'named'
  },
  plugins: [ commonjs() ]
}