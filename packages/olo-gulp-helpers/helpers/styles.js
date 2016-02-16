'use strict';

var path = require('path');
var gulp = require('gulp');
var concat = require('gulp-concat');
var rev = require('gulp-rev');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var gulpif = require('gulp-if');
var plumber = require('gulp-plumber');

function createBundle(bundleName, bundleFiles, outputPath, currentDirectory, catchErrors) {
  console.log('Creating style bundle: ' + bundleName);
    
  return gulp.src(bundleFiles)
    .pipe(gulpif(catchErrors, plumber()))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }))
    .pipe(concat({path: bundleName, cwd: currentDirectory}))
    .pipe(rev())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join(outputPath)));
}

module.exports = {
  createBundle: createBundle
};