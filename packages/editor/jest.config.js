module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/.coverage',
  moduleFileExtensions: ['js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.svg$': 'html-loader-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: ['<rootDir>/test/setup.js']
}
