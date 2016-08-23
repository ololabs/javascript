'use strict';

var fs = require('fs');
var path = require('path');
var process = require('process');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var rev = require('gulp-rev');
var babel = require('gulp-babel');
var gulpif = require('gulp-if');
var plumber = require('gulp-plumber');
var teamcityESLintFormatter = require('eslint-teamcity');
var gulpWebpack = require('gulp-webpack');
var webpack = require('webpack');
var typings = require('gulp-typings');
var tslint = require('gulp-tslint');
var _ = require('lodash');
var WebpackMd5Hash = require('webpack-md5-hash');
var Server = require('karma').Server;

function lintJavaScript(scripts) {
  return gulp.src(scripts)
    .pipe(eslint())
    .pipe(eslint.format(process.env.TEAMCITY_VERSION ? teamcityESLintFormatter : undefined))
    .pipe(eslint.failAfterError());
}

function lintTypeScript(scripts) {
  return gulp.src(scripts)
    .pipe(tslint({
      formatter: process.env.TEAMCITY_VERSION ? 'tslint-teamcity-reporter' : undefined
    }))
    .pipe(tslint.report());
}

function createBundle(bundleName, bundleFiles, outputPath, currentDirectory, watchMode) {
  console.log('Creating script bundle: ' + bundleName);
    
  return gulp.src(bundleFiles)
    .pipe(gulpif(watchMode, plumber()))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(concat({ path: bundleName, cwd: currentDirectory }))
    .pipe(rev())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(outputPath));
}

function createWebpackManifestWriter(bundleName, watchMode) {
  return function(stats) {
    if (!watchMode && stats.compilation.errors && stats.compilation.errors.length) {
      console.error('Failed to generate webpack: ' + bundleName);
      
      stats.compilation.errors.forEach(function(error) {
        console.error('in ' + error.file + ':');
        console.error(error.message);
      });
      
      throw new Error('Error generating webpack');
    }
    
    // TODO: introduce a file lock here to avoid any concurrency issues (for now we just process these serially)
    var manifestPath = path.join(process.cwd(), 'rev-manifest.json');
    
    var hashedFileName = Object.keys(stats.compilation.assets)
      .filter(function(key) { return key.endsWith('.js'); })[0];
      
      var manifestContents = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
      manifestContents[bundleName] = hashedFileName;

      fs.writeFileSync(manifestPath, JSON.stringify(manifestContents, null, '  '));
  };
}

function createWebpackConfig(bundleName, entryScriptPath, watchMode, additionalWebpackConfig) {
  var webpackConfig = additionalWebpackConfig || {};
  var baseName = bundleName.replace(/(.*)\..*$/, '$1');
  var loaders = _.concat([{
    test: /\.ts(x?)$/,
    loaders: ['ts'],
    exclude: /(node_modules)/
  }], webpackConfig.loaders || []);

  return {
    devtool: 'source-map',
    entry: { bundle: entryScriptPath },
    exclude: {},
    output: { filename: baseName + '-[chunkhash].js' },
    watch: watchMode,
    module: {
      loaders: loaders
    },
    externals: webpackConfig.externals,
    plugins: _.chain(webpackConfig.plugins || [])
      .concat([
        new WebpackMd5Hash(),
        new webpack.NoErrorsPlugin(),
        new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify(process.env.TEAMCITY_VERSION ? 'production' : 'development')
          }
        }),
        process.env.TEAMCITY_VERSION && new webpack.optimize.UglifyJsPlugin({
          compress: { warnings: false }
        }),
        function() {
          this.plugin('done', createWebpackManifestWriter(bundleName, watchMode));
        }
      ])
      .without(undefined)
      .value(),
    resolve: {
      extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.jsx']
    }
  };
}

function createWebpackBundle(bundleName, entryScriptPath, outputPath, watchMode, additionalWebpackConfig) {
  console.log('Creating webpack script bundle: ' + bundleName);
  
  var webpackConfig = createWebpackConfig(bundleName, entryScriptPath, watchMode, additionalWebpackConfig);
  
  return gulp.src(entryScriptPath)
    .pipe(gulpif(watchMode, plumber()))
    .pipe(gulpWebpack(webpackConfig))
    .pipe(gulp.dest(outputPath));
}

function restoreTypings(typingsPaths) {
  return gulp.src(typingsPaths)
    .pipe(typings());
}

function runKarmaTests(config, callback) {
  new Server({
    basePath: '',
    frameworks: config.frameworks,
    files: config.files,
    exclude: [],
    preprocessors: {
      '**/*.ts': ['webpack'],
      '**/*.tsx': ['webpack']
    },
    webpack: {
      plugins: config.webpack.plugins || [],
      module: {
        loaders: _.concat(
          [{
            test: /\.ts(x?)$/,
            loaders: ['ts'],
            exclude: /(node_modules)/
          }],
          config.webpack.loaders || []),
        noParse: [
          /[\/\\]sinon\.js/,
        ]
      },
      resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.jsx'],
        alias: {
          sinon: 'sinon/pkg/sinon.js',
        }
      },
      externals: config.webpack.externals
    },
    reporters: [process.env.TEAMCITY_VERSION ? 'teamcity' : 'mocha'],
    mochaReporter: {
      output: 'autowatch'
    },
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers: ['PhantomJS'],
    concurrency: Infinity,
    singleRun: !config.watch
  }, callback).start();
}

module.exports = {
  lintJavaScript: lintJavaScript,
  lintTypeScript: lintTypeScript,
  createBundle: createBundle,
  createWebpackBundle: createWebpackBundle,
  restoreTypings: restoreTypings,
  runKarmaTests: runKarmaTests
};