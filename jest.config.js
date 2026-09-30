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
    collectCoverage: true,
    coverageDirectory: '../coverage',
    coverageProvider: 'v8',
    coverageThreshold: {
        global: {lines: 95, statements: 95, functions: 95, branches: 90},
        ...Object.fromEntries(
            [
                'amount-calculator',
                'contracts',
                'domains',
                'fusion-order',
                'sdk'
            ].map((dir) => [
                `./src/${dir}/`,
                {lines: 95, statements: 95, functions: 95, branches: 90}
            ])
        )
    },
    testEnvironment: 'node'
}
