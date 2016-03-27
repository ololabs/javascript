'use strict';

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
var teamcity = require('eslint-teamcity');

function lint(scripts) {
  return gulp.src(scripts)
    .pipe(eslint())
    .pipe(eslint.format(process.env.TEAMCITY_VERSION ? teamcity : undefined))
    .pipe(eslint.failAfterError());
}

function createBundle(bundleName, bundleFiles, outputPath, currentDirectory, catchErrors) {
  console.log('Creating script bundle: ' + bundleName);
    
  return gulp.src(bundleFiles)
    .pipe(gulpif(catchErrors, plumber()))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(concat({ path: bundleName, cwd: currentDirectory }))
    .pipe(rev())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join(outputPath)));
}

module.exports = {
  lint: lint,
  createBundle: createBundle
};