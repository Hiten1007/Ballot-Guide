/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {},
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/data/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
  ],
  verbose: true,
  testTimeout: 15000,
};
