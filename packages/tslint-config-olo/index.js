module.exports = {
  extends: [
    './rules/functionality.js',
    './rules/maintainability.js',
    './rules/style.js',
    './rules/typescript.js',
  ].map(require.resolve),
  rules: {},
  env: {}
};