"use strict";

const path = require("path");
const gulp = require("gulp");
const concat = require("gulp-concat");
const rev = require("gulp-rev");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const gulpif = require("gulp-if");
const plumber = require("gulp-plumber");

function createBundle(
  bundleName,
  bundleFiles,
  outputPath,
  currentDirectory,
  catchErrors
) {
  console.log("Creating style bundle: " + bundleName);
  return gulp
    .src(bundleFiles)
    .pipe(gulpif(catchErrors, plumber()))
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: ["partials/"],
        outputStyle: "compressed"
      })
    )
    .pipe(concat({ path: bundleName, cwd: currentDirectory }))
    .pipe(rev())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(path.join(outputPath)));
}

module.exports = {
  createBundle: createBundle
};
