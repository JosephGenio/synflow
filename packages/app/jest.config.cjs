/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '@testing-library/dom': '<rootDir>/src/__mocks__/@testing-library/dom.ts',
    '^@vercel/analytics/react$': '<rootDir>/src/__mocks__/@vercel/analytics.ts',
    '^(\\.{1,2}/)*config$': '<rootDir>/src/__mocks__/config.ts',
    '^@synflow/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  moduleDirectories: ['node_modules', '<rootDir>/../../node_modules'],
};
