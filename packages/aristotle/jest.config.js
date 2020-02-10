module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/test/.coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/src/.*/__spec__/.*'
  ],
  // moduleDirectories: [
  //   "node_modules"
  // ],
  moduleFileExtensions: [
    'js',
    'ts',
    'json',
    'vue'
  ],
  setupFiles: ['<rootDir>/test/setup.js'],
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^.+\\.js$': 'babel-jest',
    '^.+\\.ts$': 'ts-jest'
  },
  // transformIgnorePatterns: ['node_modules'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  snapshotSerializers: [
    'jest-serializer-vue'
  ],
  "transformIgnorePatterns": [
    // Change MODULE_NAME_HERE to your module that isn't being compiled
    "/node_modules/$"
  ],
  testMatch: [
    '<rootDir>/src/**/*.spec.(js|ts)'
  ],
  testURL: 'http://localhost/'
}
