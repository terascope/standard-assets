'use strict';

module.exports = {
    rootDir: '.',
    verbose: true,
    testEnvironment: 'node',
    setupFilesAfterEnv: ['jest-extended'],
    testMatch: [
        '<rootDir>/test/*-spec.{ts,js}'
    ],
    collectCoverage: true,
    coverageReporters: ['lcov', 'text-summary', 'html'],
    coverageDirectory: '<rootDir>/coverage'
};
