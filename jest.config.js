module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.ts'],
    testTimeout: 220000, // Set global timeout to 30 seconds
};
