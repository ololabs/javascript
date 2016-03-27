'use strict';

var path = require('path');
var process = require('process');
var merge = require('merge-stream');
var gulp = require('gulp');
var rev = require('gulp-rev');
var scriptHelpers = require('./helpers/scripts');
var styleHelpers = require('./helpers/styles');

var currentDirectory = process.cwd();
var bundleDefaults = {
  assetConfigPath: './asset-config.json',
  outputPath: './Content/bundles/',
  bundlesForFile: null
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

function bundle(options, catchErrors) {
  var config = Object.assign({}, bundleDefaults, options);
  var assetConfigFullPath = path.join(currentDirectory, config.assetConfigPath);
  
  var bundles = getBundles(assetConfigFullPath, config.bundlesForFile);
  var bundleTasks = Object.keys(bundles).map(function (bundleName) {
    if (bundleName.toLowerCase().endsWith('.css')) {
      return styleHelpers.createBundle(bundleName, bundles[bundleName], config.outputPath, currentDirectory, catchErrors);
    }
    
    return scriptHelpers.createBundle(bundleName, bundles[bundleName], config.outputPath, currentDirectory, catchErrors);
  });
  
  return merge.apply(this, bundleTasks)
    .pipe(rev.manifest({
      merge: true,
      cwd: ''
    }))
    .pipe(gulp.dest('./'));
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
}

function arrayify(input) {
  if (Array.isArray(input)) {
    return input;
  }
  
  return [input];
}

function lint(options) {
  var config = Object.assign({}, bundleDefaults, options);
  var scripts = arrayify(config.scripts).map(function(localScriptPath) {
    return path.join(currentDirectory, localScriptPath);
  });
  
  scriptHelpers.lint(scripts);
}

module.exports = {
  lint: lint,
  bundle: bundle,
  watch: watch
};