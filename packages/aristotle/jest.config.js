module.exports = {
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'vue',
    'ts',
    'tsx'
  ],
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.js$': 'babel-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  snapshotSerializers: [
    'jest-serializer-vue'
  ],
  setupFiles: [
    '<rootDir>/test/setup.js'
  ],
  testMatch: [
    '**/src/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.(js|jsx|ts|tsx)',
    '!<rootDir>/src/designer/Canvas.ts'
  ],
  testURL: 'http://localhost/'
}
