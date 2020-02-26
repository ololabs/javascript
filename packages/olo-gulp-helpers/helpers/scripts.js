"use strict";

const fs = require("fs");
const path = require("path");
const process = require("process");
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");
const rev = require("gulp-rev");
const babel = require("gulp-babel");
const gulpif = require("gulp-if");
const plumber = require("gulp-plumber");
const teamcityESLintFormatter = require("eslint-teamcity");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const tslint = require("gulp-tslint");
const lodashConcat = require("lodash.concat");
const WebpackMd5Hash = require("webpack-md5-hash");
const Server = require("karma").Server;

function lintJavaScript(scripts) {
  return gulp
    .src(scripts)
    .pipe(eslint())
    .pipe(
      eslint.format(
        process.env.TEAMCITY_VERSION ? teamcityESLintFormatter : undefined
      )
    )
    .pipe(eslint.failAfterError());
}

function lintTypeScript(scripts, projectRoot) {
  return gulp
    .src(scripts)
    .pipe(
      tslint({
        formatter: process.env.TEAMCITY_VERSION
          ? "tslint-teamcity-reporter"
          : undefined,
        formattersDirectory: process.env.TEAMCITY_VERSION
          ? projectRoot + "/node_modules/tslint-teamcity-reporter/"
          : undefined
      })
    )
    .pipe(tslint.report());
}

function createBundle(
  bundleName,
  bundleFiles,
  outputPath,
  currentDirectory,
  watchMode
) {
  console.log("Creating script bundle: " + bundleName);

  return gulp
    .src(bundleFiles)
    .pipe(gulpif(watchMode, plumber()))
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ["es2015"] // ensure that uglify does not choke on potential es6 code
    }))
    .pipe(uglify())
    .pipe(concat({ path: bundleName, cwd: currentDirectory }))
    .pipe(rev())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(outputPath));
}

function createWebpackManifestWriter(bundleName, watchMode) {
  return stats => {
    if (
      !watchMode &&
      stats.compilation.errors &&
      stats.compilation.errors.length
    ) {
      console.error("Failed to generate webpack: " + bundleName);

      stats.compilation.errors.forEach(error => {
        console.error("in " + error.file + ":");
        console.error(error.message);
      });

      throw new Error("Error generating webpack");
    }

    // TODO: introduce a file lock here to avoid any concurrency issues (for now we just process these serially)
    const manifestPath = path.join(process.cwd(), "rev-manifest.json");

    const hashedFileName = Object.keys(stats.compilation.assets).filter(key =>
      key.endsWith(".js")
    )[0];

    const manifestContents = fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
      : {};
    manifestContents[bundleName] = hashedFileName;

    fs.writeFileSync(
      manifestPath,
      JSON.stringify(manifestContents, null, "  ")
    );
  };
}

function createWebpackConfig(
  bundleName,
  entryScriptPath,
  watchMode,
  additionalWebpackConfig
) {
  const webpackConfig = additionalWebpackConfig || {};
  const baseName = bundleName.replace(/(.*)\..*$/, "$1");
  const loaders = lodashConcat(
    [
      {
        test: /\.ts(x?)$/,
        loaders: ["ts-loader"]
      }
    ],
    webpackConfig.loaders || []
  );

  const output = Object.assign({},
    webpackConfig.output || {},
    { filename: baseName + "-[chunkhash].js" });

  return {
    devtool: "source-map",
    entry: { bundle: entryScriptPath },
    output: output,
    watch: watchMode,
    module: {
      loaders: loaders
    },
    externals: webpackConfig.externals,
    plugins: lodashConcat(webpackConfig.plugins || [],
      [
        new WebpackMd5Hash(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin({
          "process.env": {
            NODE_ENV: JSON.stringify(
              process.env.TEAMCITY_VERSION ? "production" : "development"
            )
          }
        }),
        process.env.TEAMCITY_VERSION &&
          new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            sourceMap: true
          }),
        function() {
          this.plugin(
            "done",
            createWebpackManifestWriter(bundleName, watchMode)
          );
        }
      ]).filter(Boolean),
    resolve: {
      extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".jsx"]
    }
  };
}

function createWebpackBundle(
  bundleName,
  entryScriptPath,
  outputPath,
  watchMode,
  additionalWebpackConfig
) {
  console.log("Creating webpack script bundle: " + bundleName);

  const webpackConfig = createWebpackConfig(
    bundleName,
    entryScriptPath,
    watchMode,
    additionalWebpackConfig
  );

  return gulp
    .src(entryScriptPath)
    .pipe(gulpif(watchMode, plumber()))
    .pipe(webpackStream(webpackConfig))
    .pipe(gulp.dest(outputPath));
}

function runKarmaTests(config, callback) {
  new Server(
    {
      basePath: "",
      frameworks: config.frameworks,
      files: config.files,
      preprocessors: {
        "**/*.ts": ["webpack"],
        "**/*.tsx": ["webpack"]
      },
      webpack: {
        plugins: config.webpack.plugins || [],
        module: {
          loaders: config.webpack.loaders || [],
          noParse: [/[\/\\]sinon\.js/]
        },
        resolve: {
          extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".jsx"],
          alias: {
            sinon: "sinon/pkg/sinon.js"
          }
        },
        externals: config.webpack.externals
      },
      reporters: [process.env.TEAMCITY_VERSION ? "teamcity" : "mocha"],
      mochaReporter: {
        output: "autowatch"
      },
      port: 9876,
      colors: true,
      autoWatch: true,
      browsers: ["PhantomJS"],
      concurrency: Infinity,
      singleRun: !config.watch
    },
    callback
  ).start();
}

module.exports = {
  lintJavaScript: lintJavaScript,
  lintTypeScript: lintTypeScript,
  createBundle: createBundle,
  createWebpackBundle: createWebpackBundle,
  runKarmaTests: runKarmaTests
};
