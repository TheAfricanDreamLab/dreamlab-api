/**
 * Runs the e2e suites in path order (apps/…, then test/learning-journey, then the later slices), not
 * by cached durations: the suites share one database, and the journey's platform-wide counts assume
 * it runs before the suites that enrol more learners.
 */
const path = require('node:path');

// pnpm does not hoist jest's own packages: find the default sequencer through jest's dependencies.
const from = (name, base) => require.resolve(name, { paths: [base] });
const jestDir = path.dirname(from('jest/package.json', process.cwd()));
const coreDir = path.dirname(from('@jest/core/package.json', jestDir));
const Sequencer = require(from('@jest/test-sequencer', coreDir)).default;

module.exports = class PathOrder extends Sequencer {
  sort(tests) {
    return [...tests].sort((a, b) => a.path.localeCompare(b.path));
  }
};
