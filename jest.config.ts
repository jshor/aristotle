export default {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/test/.coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/src/.*/__tests__'
  ],
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1'
  },
  setupFiles: [
    '<rootDir>/test/setup.ts'
  ],
  testMatch: [
    '<rootDir>/src/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.vue$': '@vue/vue3-jest'
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [
      'node',
      'node-addons'
    ]
  }
}
