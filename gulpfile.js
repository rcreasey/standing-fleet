var gulp = require('gulp')
  , minifycss = require('gulp-minify-css')
  , uglify = require('gulp-uglify')
  , rename = require('gulp-rename')
  , usemin = require('gulp-usemin')

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

gulp.task('watch', function () {
   gulp.watch('app/**', ['default']);
});
