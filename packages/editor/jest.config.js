module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/.coverage',
  moduleFileExtensions: ['js', 'ts'],
  preset: 'ts-jest/presets/js-with-babel',
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.svg$': 'html-loader-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: ['<rootDir>/test/setup.js']
}
