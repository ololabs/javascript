/// <binding BeforeBuild='lint:scripts' ProjectOpened='bundle:watch' />
'use strict';
/* eslint-env node */

var gulp = require('gulp');
var buildHelpers = require('olo-gulp-helpers');

var allScriptsPaths = './src/*.js';


gulp.task('lint:scripts', function () {
  return buildHelpers.lint({
    scripts: [allScriptsPaths]
  });
});

gulp.task('bundle', function () {
  return buildHelpers.bundle();
});

gulp.task('bundle:watch', function () {
  buildHelpers.watch([allScriptsPaths]);
});

gulp.task('lint:scripts', function() {
  return buildHelpers.lint({
    scripts: allScriptsPaths,
    typescripts: [],
  });
});
