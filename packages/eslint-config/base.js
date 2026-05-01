/**
 * Base ESLint configuration for TypeScript projects
 */

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['eslint:recommended', 'prettier', 'eslint-config-turbo'],
  plugins: ['only-warn'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.turbo/', '*.config.js'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};
