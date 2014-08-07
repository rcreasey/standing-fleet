var gulp = require('gulp'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    rev = require('gulp-rev'),
    usemin = require('gulp-usemin'),
    livereload = require('gulp-livereload');

gulp.task('default', function() {
  gulp.src('app/*.html')
    .pipe(usemin({
      css: ['concat'],
      js: []
    }))
    .pipe(gulp.dest('public/'));
});
gulp.task('heroku:staging', function() { gulp.start('default'); });

gulp.task('heroku:production', function() {
  gulp.src('app/*.html')
    .pipe(usemin({
      css: [minifycss(), 'concat', rename({suffix: '.min'})],
      js: [uglify()]
    }))
    .pipe(gulp.dest('public/'));
});
