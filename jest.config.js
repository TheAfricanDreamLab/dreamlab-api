/** Unit tests: no network, no containers. Type errors are caught by `pnpm typecheck`, so tests only transpile. */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+[.]ts$': ['ts-jest', { tsconfig: 'tsconfig.json', transpilation: true }],
    // ESM-only dependencies (cookie@2, via fastify's light-my-request) are transpiled for Jest's CommonJS loader.
    '^.+[.]m?js$': ['ts-jest', { tsconfig: { allowJs: true, module: 'commonjs' }, transpilation: true }],
  },
  transformIgnorePatterns: ['/node_modules/(?![.]pnpm/cookie@2|cookie/)'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  collectCoverageFrom: ['apps/**/src/**/*.ts', 'libs/**/src/**/*.ts', '!**/main.ts', '!**/cli.ts'],
};
