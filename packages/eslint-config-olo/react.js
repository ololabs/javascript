module.exports = {
  extends: [
    './index.js',
    './rules/strict.js',
    './rules/react.js',
  ].map(require.resolve),
  rules: {}
};
