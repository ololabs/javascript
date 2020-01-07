module.exports = {
  extends: [
    './rules/best-practices.js',
    './rules/errors.js',
    './rules/legacy.js',
    './rules/style.js',
    './rules/variables.js'
  ].map(require.resolve),
  env: {
    browser: true
  },
  parserOptions: {},
  rules: {}
};
