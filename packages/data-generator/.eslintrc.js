module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    mocha: true,
    node: true,
    jest: true,
  },
  globals: {
    expect: true,
    module: true,
  },
  ignorePatterns: ['node_modules/', 'coverage/', 'dist/'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  settings: {
    'import/resolver': {
      webpack: {
        config: 'webpack.config.js',
      },
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:import/typescript',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': [
      'error',
      {
        allowArgumentsExplicitlyTypedAsAny: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    camelcase: [
      'error',
      {
        allow: ['^UNSAFE_'],
      },
    ],
    'no-case-declarations': 'off',
    'no-prototype-builtins': 'off',
    'no-shadow': 'off',
    'no-unused-expressions': 'off',
    'no-use-before-define': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/__tests__/*.tsx', '**/test-util.ts'] }],
    'prefer-template': 'off',
  },
};
