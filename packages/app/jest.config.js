module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.vue$': 'vue-jest'
  },
  testMatch: [
    '<rootDir>/src/**/*.spec.(js|jsx|ts|tsx)'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'vue',
    'js',
    'jsx',
    'json',
    'node'
  ]
}
