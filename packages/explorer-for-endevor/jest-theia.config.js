module.exports = {
  testEnvironment: 'node', // make test faster

  // ts preprocessor
  testMatch: ['**/__tests__/theia/__tests__/*.theia-test.ts'],
  preset: 'ts-jest',

  testTimeout: 50000,
};
