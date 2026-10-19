/** Unit tests: no network, no containers. Type errors are caught by `pnpm typecheck`, so tests only transpile. */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
  transform: { '^.+[.]ts$': ['ts-jest', { tsconfig: 'tsconfig.json', transpilation: true }] },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  collectCoverageFrom: ['apps/**/src/**/*.ts', 'libs/**/src/**/*.ts', '!**/main.ts', '!**/cli.ts'],
};
