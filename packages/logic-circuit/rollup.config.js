import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'esm/index.js',
  output: {
    file: 'dist/index.js',
    format: 'umd',
    name: 'logic-circuit',
    exports: 'named'
  },
  plugins: [ commonjs() ]
}