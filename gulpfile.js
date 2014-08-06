var gulp = require('gulp'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    rev = require('gulp-rev'),
    usemin = require('gulp-usemin'),
    livereload = require('gulp-livereload');

gulp.task('styles', function() {
  return gulp.src('app/styles/main.css')
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest('public/css/styles.css'));
});

gulp.task('usemin', function() {
  gulp.src('app/*.html')
    .pipe(usemin({
      css: [minifycss(), 'concat', rename({suffix: '.min'})],
      js: [uglify()]
    }))
    .pipe(gulp.dest('public/'));
});

gulp.task('default', function() {
  gulp.start('usemin');
});
