module.exports = {
  displayName: 'Unit Tests',
  moduleFileExtensions: [
    'js',
    'ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
  testMatch: [
    '<rootDir>/src/__tests__/unit/**/*.test.ts',
    '<rootDir>/src/__tests__/unit/*.test.ts',
  ],
  preset: 'ts-jest',
}
