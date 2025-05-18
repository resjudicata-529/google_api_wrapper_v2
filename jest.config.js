/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: [
    'dotenv/config',
    '<rootDir>/src/__tests__/setup/jest.setup.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
    '!<rootDir>/src/__tests__/setup/**',
    '!<rootDir>/src/__tests__/utils/**'
  ],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  verbose: true,
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
}; 