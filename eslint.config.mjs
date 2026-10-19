import js from '@eslint/js';
import { readdirSync } from 'node:fs';
import tseslint from 'typescript-eslint';

const apps = readdirSync(new URL('./apps', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

/**
 * Service boundaries: an app may import shared code from libs/ (via @lib/*) but never another
 * app's code. Libraries never import apps. Services talk over HTTP, RPC and events only.
 */
const boundaryRules = [
  ...apps.map((app) => ({
    files: [`apps/${app}/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: apps
            .filter((other) => other !== app)
            .map((other) => ({
              group: [`**/apps/${other}/**`, `**/${other}/src/**`, `../../${other}/**`, `../../../${other}/**`],
              message: `apps/${app} must not import apps/${other}. Share code through libs/, or call the service.`,
            })),
        },
      ],
    },
  })),
  {
    files: ['libs/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/apps/**', ...apps.map((a) => `**/${a}/src/**`)], message: 'libs/ must not import application code.' }] },
      ],
    },
  },
];

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/migrations/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { parserOptions: { projectService: false } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  { files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'libs/testing/**'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
  { files: ['**/*.js', '**/*.mjs'], languageOptions: { globals: { URL: 'readonly', require: 'readonly', module: 'writable', process: 'readonly', console: 'readonly', __dirname: 'readonly' } }, rules: { '@typescript-eslint/no-require-imports': 'off' } },
  ...boundaryRules,
);
