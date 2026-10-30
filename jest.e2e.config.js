/** End-to-end tests: real Postgres, Redis and RabbitMQ in Testcontainers (Docker required). */
const base = require('./jest.config');

module.exports = {
  ...base,
  roots: ['<rootDir>/apps', '<rootDir>/libs', '<rootDir>/test'],
  testMatch: ['**/*.e2e-spec.ts'],
  testTimeout: 120_000,
  // AMQP client reconnect timers can outlive app.close(); containers are torn down in globalTeardown anyway.
  forceExit: true,
  globalSetup: '<rootDir>/libs/testing/src/global-setup.ts',
  globalTeardown: '<rootDir>/libs/testing/src/global-teardown.ts',
  testSequencer: '<rootDir>/libs/testing/src/sequencer.js',
};
