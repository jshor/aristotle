module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/test/.coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/src/.*/__spec__/.*'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'vue',
    'js',
    'jsx',
    'json',
    'node'
  ],
  testMatch: [
    '<rootDir>/src/**/*.spec.(js|jsx|ts|tsx)'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.vue$': 'vue-jest'
  }
}
