"use strict";

const fs = require("fs");
const path = require("path");
const process = require("process");
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const terser = require("gulp-terser");
const rev = require("gulp-rev");
const babel = require("gulp-babel");
const gulpif = require("gulp-if");
const plumber = require("gulp-plumber");
const teamcityESLintFormatter = require("eslint-teamcity");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const tslint = require("gulp-tslint");
const lodashConcat = require("lodash.concat");

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
    .pipe(babel())
    .pipe(terser())
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
    { filename: baseName + "-[contenthash].js" });

  return {
    devtool: "source-map",
    entry: { bundle: entryScriptPath },
    output: output,
    watch: watchMode,
    module: {
      rules: loaders
    },
    externals: webpackConfig.externals,
    mode: process.env.TEAMCITY_VERSION ? "production" : "development",
    plugins: lodashConcat(webpackConfig.plugins || [],
      [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin({
          "process.env": {
            NODE_ENV: JSON.stringify(
              process.env.TEAMCITY_VERSION ? "production" : "development"
            )
          }
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

function runKarmaTests() {
  throw new Error('Testing is no longer supported directly by olo-gulp-helpers, please install test scripts in your project directly');
}

module.exports = {
  lintJavaScript: lintJavaScript,
  lintTypeScript: lintTypeScript,
  createBundle: createBundle,
  createWebpackBundle: createWebpackBundle,
  runKarmaTests: runKarmaTests
};
