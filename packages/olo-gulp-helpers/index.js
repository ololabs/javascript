"use strict";

const path = require("path");
const process = require("process");
const merge = require("merge-stream");
const gulp = require("gulp");
const rev = require("gulp-rev");
const lodashFlatten = require("lodash.flatten");
const lodashConcat = require("lodash.concat");
const lodashMerge = require("lodash.merge");
const scriptHelpers = require("./helpers/scripts");
const styleHelpers = require("./helpers/styles");

const currentDirectory = process.cwd();
const BUNDLE_DEFAULTS = {
  assetConfigPath: "./asset-config.json",
  outputPath: "./Content/bundles/",
  bundlesForFile: null,
  webpack: {}
};
const KARMA_DEFAULTS = {
  frameworks: ["mocha", "chai", "sinon-chai"],
  watch: false,
  webpack: {
    loaders: [],
    externals: {},
    plugins: []
  }
};

function getBundles(assetConfigFullPath, bundlesForFile) {
  const allBundles = require(assetConfigFullPath).bundles;

  return Object.keys(allBundles)
    .filter(name => {
      if (!bundlesForFile) {
        return true;
      }

      const bundleFiles = allBundles[name];
      const relativePath = path.isAbsolute(bundlesForFile)
        ? path.relative("./", bundlesForFile)
        : bundlesForFile;

      return (
        bundleFiles.includes(relativePath) ||
        bundleFiles.includes(relativePath.replace(/\\/g, "/"))
      );
    })
    .reduce((bundles, name) => {
      bundles[name] = allBundles[name];

      return bundles;
    }, {});
}

function getWebpackBundles(assetConfigFullPath) {
  const allBundles = require(assetConfigFullPath).webpack || {};

  return Object.keys(allBundles).reduce((bundles, name) => {
    bundles[name] = allBundles[name].startsWith("./")
      ? allBundles[name]
      : "./" + allBundles[name];

    return bundles;
  }, {});
}

function bundle(options, watchMode) {
  const config = Object.assign({}, BUNDLE_DEFAULTS, options);
  const assetConfigFullPath = path.join(
    currentDirectory,
    config.assetConfigPath
  );

  const bundles = getBundles(assetConfigFullPath, config.bundlesForFile);
  const bundleTasks = Object.keys(bundles).map(bundleName => {
    const { createBundle } = bundleName.toLowerCase().endsWith(".css")
      ? styleHelpers
      : scriptHelpers;

    return createBundle(
      bundleName,
      bundles[bundleName],
      config.outputPath,
      currentDirectory,
      watchMode
    );
  });

  const allBundleTasks = merge
    .apply(this, bundleTasks)
    .pipe(
      rev.manifest({
        merge: true,
        cwd: ""
      })
    )
    .pipe(gulp.dest("./"));

  const webpackBundles = getWebpackBundles(assetConfigFullPath);
  const webpackBundleTasks = config.bundlesForFile
    ? []
    : Object.keys(webpackBundles).map(bundleName =>
        scriptHelpers.createWebpackBundle(
          bundleName,
          webpackBundles[bundleName],
          config.outputPath,
          watchMode,
          config.webpack[bundleName]
        )
      );

  return merge.call(this, lodashFlatten([allBundleTasks, webpackBundleTasks]));
}

function watch(incrementalFilesToWatch, bundleOptions) {
  const config = Object.assign({}, BUNDLE_DEFAULTS, bundleOptions);
  gulp.watch(incrementalFilesToWatch).on("change", e => {
    bundle(Object.assign({}, config, { bundlesForFile: e }), true);
  });

  gulp.watch(config.assetConfigPath, () => {
    bundle(config, true);
  });

  const assetConfigFullPath = path.join(
    currentDirectory,
    config.assetConfigPath
  );
  const webpackBundles = getWebpackBundles(assetConfigFullPath);

  Object.keys(webpackBundles).forEach(bundleName => {
    scriptHelpers.createWebpackBundle(
      bundleName,
      webpackBundles[bundleName],
      config.outputPath,
      true,
      config.webpack[bundleName]
    );
  });
}

function arrayify(input) {
  return Array.isArray(input) ? input : [input];
}

function lint(options) {
  const getScripts = (scripts = []) =>
    scripts.length > 0
      ? lodashConcat(
          arrayify(scripts).map(localScriptPath =>
            path.join(currentDirectory, localScriptPath)
          ),
          ["!**/typings/**/*", "!**/node_modules/**/*"]
        )
      : [];

  const config = Object.assign({}, BUNDLE_DEFAULTS, options);
  const javascripts = getScripts(config.scripts);
  const typescripts = getScripts(config.typescripts);

  if (javascripts.length > 0 && typescripts.length > 0) {
    return merge(
      scriptHelpers.lintJavaScript(javascripts),
      scriptHelpers.lintTypeScript(typescripts, currentDirectory)
    );
  } else if (javascripts.length > 0) {
    return scriptHelpers.lintJavaScript(javascripts);
  } else if (typescripts.length > 0) {
    return scriptHelpers.lintTypeScript(typescripts, currentDirectory);
  }

  // composes nicely with other streaming APIs this way.
  return Promise.resolve();
}

function test(options, callback) {
  const config = lodashMerge({}, KARMA_DEFAULTS, options, {
    frameworks: lodashConcat(KARMA_DEFAULTS.frameworks, options.frameworks || [])
  });

  return scriptHelpers.runKarmaTests(config, callback);
}

module.exports = {
  lint: lint,
  bundle: bundle,
  watch: watch,
  test: test
};
