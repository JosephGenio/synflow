/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
        },
      },
    ],
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@vercel/analytics/react$': '<rootDir>/src/__mocks__/@vercel/analytics.ts',
    '^./config$': '<rootDir>/src/__mocks__/config.ts',
    '^@synflow/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  moduleDirectories: ['node_modules', '<rootDir>/../../node_modules'],
};
