# tslint-config-olo

This package provides Olo's shared TSLint configuration, to be used in all TypeScript applications.

**Note:** the rules are defined in `rules` and exported via `index.js`. The `.eslintrc` is present so we can lint the rules files with our standard rules.

The v0.2.0 rule set assumes TypeScript 2.x.

## Usage

Specify the following in your `tslint.json` file:

```
{
  "extends": "tslint-config-olo"
}
```