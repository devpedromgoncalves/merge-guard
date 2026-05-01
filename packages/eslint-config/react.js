const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/**
 * ESLint configuration for React projects with TypeScript
 */

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'eslint-config-turbo'
  ],
  plugins: ['@typescript-eslint', 'only-warn'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project,
    sourceType: 'module',
    ecmaVersion: 'latest',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    'import/resolver': {
      typescript: {
        project
      }
    }
  },
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.turbo/', '*.config.js', '*.config.ts'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Preact/JSX specific
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+ new JSX transform
    'react/prop-types': 'off' // Using TypeScript instead
  }
};
