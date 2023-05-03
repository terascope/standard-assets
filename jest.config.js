'use strict';

const path = require('path');

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/test/test.setup.js'],
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'html'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '<rootDir>/asset/**/*.ts',
        '!<rootDir>/asset/src/index.ts',
        '!<rootDir>/packages/*/**/*.ts',
        '!<rootDir>/packages/*/test/**',
        '!<rootDir>/**/coverage/**',
        '!<rootDir>/**/*.d.ts',
        '!<rootDir>/**/dist/**',
        '!<rootDir>/**/coverage/**'
    ],
    testMatch: [
        '<rootDir>/test/**/*-spec.{ts,js}',
        '<rootDir>/test/*-spec.{ts,js}',
    ],
    moduleNameMapper: {
        '^@terascope/file-asset-apis$': path.join(__dirname, '/packages/standard-asset-apis/src/index.ts'),
    },
    preset: 'ts-jest',
    globals: {
        ignoreDirectories: ['dist'],
        availableExtensions: ['.js', '.ts']
    },
    transform: {
        testMatch: [
            'ts-jest', {
                tsconfig: './tsconfig.json',
                diagnostics: true,
            },],
    },
};
