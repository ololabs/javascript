# eslint-config-olo

This package provides Olo's `.eslintrc` as an extensible shared config. This was originally based off [Airbnb's implementation](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb).

Rules that are defined as warnings are likely to transition to errors over time, so try to make sure they are addressed.

## Usage

We export three ESLint configurations for your usage:

### eslint-config-olo

Our default export lints ES6+ but does not lint React. Requires `eslint` and `babel-eslint`.

Update your `.eslintrc` file with:

- `"extends": "olo"`
- `"parser": "babel-eslint"`

### eslint-config-olo/react

Lints ES6+ and React. It requires `eslint`, `babel-eslint`, and `eslint-plugin-react`.

Update your `.eslintrc` file with:

- `"extends": "olo/react"`
- `"parser": "babel-eslint"`

### eslint-config-olo/legacy

Lints ES5 and below. Only requires `eslint`.

- add `"extends": "olo/legacy"` to your .eslintrc