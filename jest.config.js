import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
export default {
    verbose: true,
    testEnvironment: 'node',
    setupFilesAfterEnv: ['jest-extended/all'],
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
        '<rootDir>/test/*-spec.{ts,js}'
    ],
    moduleNameMapper: {
        '^@terascope/standard-asset-apis$': path.join(dirname, '/packages/standard-asset-apis/src/index.ts'),
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    preset: 'ts-jest',
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
        ignoreDirectories: ['dist'],
        availableExtensions: ['.js', '.ts', '.mjs']
    },
    transform: {
        '\\.[jt]sx?$': ['ts-jest',
            {
                isolatedModules: true,
                useESM: true
            }]
    },
    setupFiles: [
        '<rootDir>/test/test.setup.js'
    ]
};
