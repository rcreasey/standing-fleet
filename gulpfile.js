var gulp = require('gulp')
  , minifycss = require('gulp-minify-css')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , order = require('gulp-order')
  , mainBowerFiles = require('main-bower-files')
  , handlebars = require('gulp-handlebars')
  , wrap = require('gulp-wrap')
  , declare = require('gulp-declare')

gulp.task('default', function() {
  gulp.src('app/**/*.css')
    .pipe(minifycss())
    .pipe(concat('css/style.css'))
    .pipe(gulp.dest('public'));

  gulp.src('app/**/*.js')
    .pipe(order([
      'js/Util.js',
      'js/UI.js',
      'js/UIPanels.js',
      'js/Data.js',
      'js/Server.js',
      'js/SystemMap.js',
      'js/MemberList.js',
      'js/HostileList.js',
      'js/EventList.js',
      'js/ScanList.js',
      'js/EventHandler.js',
      'js/Main.js'
    ]))
    .pipe(concat('js/app.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public'));

  gulp.src(mainBowerFiles())
    .pipe(concat('js/lib.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public'));

  gulp.src('app/templates/*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'Templates',
      noRedeclare: true,
    }))
    .pipe(concat('js/templates.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public'));
});

gulp.task('heroku:staging', function() { gulp.start('default'); });
gulp.task('heroku:production', function() { gulp.start('default'); });

gulp.task('watch', function () {
   gulp.watch('app/**', ['default']);
});
