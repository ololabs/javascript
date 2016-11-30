'use strict';

var path = require('path');
var process = require('process');
var merge = require('merge-stream');
var gulp = require('gulp');
var rev = require('gulp-rev');
var _ = require('lodash');
var scriptHelpers = require('./helpers/scripts');
var styleHelpers = require('./helpers/styles');
var a11y = require('gulp-a11y');
var remoteSrc = require('gulp-remote-src');

var currentDirectory = process.cwd();
var bundleDefaults = {
  assetConfigPath: './asset-config.json',
  outputPath: './Content/bundles/',
  bundlesForFile: null,
  webpack: {}
};
var karmaDefaults = {
  frameworks: ['mocha', 'chai', 'sinon-chai'],
  watch: false,
  webpack: {
    loaders: [],
    externals: {},
    plugins: []
  }
};

function getBundles(assetConfigFullPath, bundlesForFile) {
  var allBundles = require(assetConfigFullPath).bundles;
  
  return Object.keys(allBundles).filter(function (name) {
    if (!bundlesForFile) {
      return true;
    }
    
    var bundleFiles = allBundles[name];
    var relativePath = path.isAbsolute(bundlesForFile)
                        ? path.relative('./', bundlesForFile)
                        : bundlesForFile;
                        
    return bundleFiles.indexOf(relativePath) !== -1
            || bundleFiles.indexOf(relativePath.replace(/\\/g, '/')) !== -1;
  }).reduce(function (bundles, name) {
    bundles[name] = allBundles[name];
    
    return bundles;
  }, {});
}

function getWebpackBundles(assetConfigFullPath) {
  var allBundles = require(assetConfigFullPath).webpack || {};
  
  return Object.keys(allBundles).reduce(function (bundles, name) {
    bundles[name] = allBundles[name].startsWith('./')
      ? allBundles[name] 
      : ('./' + allBundles[name]);
      
    return bundles;
  }, {});
}

function audit(sources, options) {
  return remoteSrc(sources, options)
    .pipe(a11y())
    .pipe(a11y.reporter());
}

function bundle(options, watchMode) {
  var config = Object.assign({}, bundleDefaults, options);
  var assetConfigFullPath = path.join(currentDirectory, config.assetConfigPath);
  
  var bundles = getBundles(assetConfigFullPath, config.bundlesForFile);
  var bundleTasks = Object.keys(bundles).map(function (bundleName) {
    if (bundleName.toLowerCase().endsWith('.css')) {
      return styleHelpers.createBundle(bundleName, bundles[bundleName], config.outputPath, currentDirectory, watchMode);
    }
    
    return scriptHelpers.createBundle(bundleName, bundles[bundleName], config.outputPath, currentDirectory, watchMode);
  });
  var allBundleTasks = merge.apply(this, bundleTasks)
    .pipe(rev.manifest({
      merge: true,
      cwd: ''
    }))
    .pipe(gulp.dest('./'));
  
  var webpackBundles = getWebpackBundles(assetConfigFullPath);
  var webpackBundleTasks = config.bundlesForFile ? [] : Object.keys(webpackBundles).map(function (bundleName) {
    return scriptHelpers.createWebpackBundle(bundleName, webpackBundles[bundleName], config.outputPath, watchMode, config.webpack[bundleName]);
  });
  
  return merge.call(this, _.flatten([allBundleTasks, webpackBundleTasks]));
}

function watch(incrementalFilesToWatch, bundleOptions) {
  var config = Object.assign({}, bundleDefaults, bundleOptions);
  
  gulp.watch(incrementalFilesToWatch, function(e) {
    bundle(Object.assign({}, config, {
      bundlesForFile: e.path
    }), true);
  });
  
  gulp.watch(config.assetConfigPath, function() {
    bundle(config, true);
  });
  
  var assetConfigFullPath = path.join(currentDirectory, config.assetConfigPath);
  var webpackBundles = getWebpackBundles(assetConfigFullPath);
  
  Object.keys(webpackBundles).forEach(function (bundleName) {
    scriptHelpers.createWebpackBundle(bundleName, webpackBundles[bundleName], config.outputPath, true, config.webpack[bundleName]);
  });
}

function arrayify(input) {
  if (Array.isArray(input)) {
    return input;
  }
  
  return [input];
}

function lint(options) {
  function getScripts(scripts) {
    return _.concat(
      arrayify(scripts || []).map(function(localScriptPath) {
        return path.join(currentDirectory, localScriptPath);
      }),
      ['!**/typings/**/*', '!**/node_modules/**/*']);
  }
  
  var config = Object.assign({}, bundleDefaults, options);
  var javascripts = getScripts(config.scripts);
  var typescripts = getScripts(config.typescripts);

  return merge(
    scriptHelpers.lintJavaScript(javascripts),
    scriptHelpers.lintTypeScript(typescripts)
  );
}

function test(options, callback) {
  var config = _.merge({}, karmaDefaults, options);
  config.frameworks = _.concat(karmaDefaults.frameworks, options.frameworks || []);

  return scriptHelpers.runKarmaTests(config, callback);
}

module.exports = {
  lint: lint,
  audit: audit,
  bundle: bundle,
  watch: watch,
  test: test,
  restoreTypings: scriptHelpers.restoreTypings
};