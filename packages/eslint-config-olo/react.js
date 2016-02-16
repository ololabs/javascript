module.exports = {
  extends: [
    './base.js',
    './rules/strict.js',
    './rules/react.js',
  ].map(require.resolve),
  rules: {}
};