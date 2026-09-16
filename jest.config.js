module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.(spec|test)\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['@swc/jest', {sourceMaps: true}]
    },
    collectCoverageFrom: [
        '**/*.(t|j)s',
        '!**/*.spec.ts',
        '!**/*.test.ts',
        '!**/idl/**'
    ],
    coverageDirectory: '../coverage',
    coverageProvider: 'v8',
    testEnvironment: 'node'
}
