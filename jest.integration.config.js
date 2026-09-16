module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'tests',
    testRegex: '.*\\.(spec|test)\\.ts$',

    globalSetup: '<rootDir>/global-setup.ts',
    globalTeardown: '<rootDir>/global-tear-down.ts',
    transform: {
        '^.+\\.(t|j)s$': ['@swc/jest', {sourceMaps: true}]
    },
    collectCoverageFrom: [
        '../src/**/*.(t|j)s',
        '!../src/**/*.spec.ts',
        '!../src/**/*.test.ts',
        '!../src/**/idl/**'
    ],
    testTimeout: 20_000,
    coverageDirectory: '../coverage',
    coverageProvider: 'v8',
    testEnvironment: 'node'
}
