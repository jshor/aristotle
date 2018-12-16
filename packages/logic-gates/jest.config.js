module.exports = {
  roots: [
    '<rootDir>/src'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  setupTestFrameworkScriptFile: '<rootDir>/test/setup.ts',
  reporters: [
    'default',
    '<rootDir>/test/reporter.js'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  coverageDirectory: '<rootDir>/.coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!<rootDir>/test/setup.ts'
  ],
  collectCoverage: true
}
