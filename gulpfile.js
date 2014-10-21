var gulp = require('gulp')
  , minifycss = require('gulp-minify-css')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , order = require('gulp-order')
  , mainBowerFiles = require('main-bower-files')
  , handlebars = require('gulp-handlebars')
  , wrap = require('gulp-wrap')
  , declare = require('gulp-declare')
  , gutil = require('gulp-util')

gulp.task('prepare', function() {
  gulp.src('app/**/*.css')
    .pipe(gutil.env.type === 'production' ? minifycss() : gutil.noop())
    .pipe(concat('css/style.css'))
    .pipe(gulp.dest('public'))
    .pipe(gulp.dest('client'));

  gulp.src('app/js/*.js')
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
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'))

  gulp.src('app/js/client/*.js')
    .pipe(order([
      'js/client/Util.js',
      'js/client/UI.js',
      'js/client/UIPanels.js',
      'js/client/Data.js',
      'js/client/Main.js'
    ]))
    .pipe(concat('js/client.js'))
    .pipe(gulp.dest('client'));

  gulp.src(mainBowerFiles())
    .pipe(concat('js/lib.js'))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'))
    .pipe(gulp.dest('client'));

  gulp.src('app/templates/*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'Templates',
      noRedeclare: true,
    }))
    .pipe(concat('js/templates.js'))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'))
    .pipe(gulp.dest('client'));
});

gulp.task('default', function() {
  gutil.env.type = 'development';
  gulp.start('prepare');
});

gulp.task('heroku:staging', function() {
  gutil.env.type = 'development';
  gulp.start('prepare');
});

gulp.task('heroku:production', function() {
  gutil.env.type = 'production';
  gulp.start('prepare');
});

gulp.task('watch', function () {
   gulp.watch('app/**', ['default']);
});

gulp.task('build', function() {
  var nwbuilder = require('node-webkit-builder')

  var nw = new nwbuilder({
    files: './client/**/**',
    platforms: ['win','osx']
  });

  nw.build().then(function () {
    console.log('all done!');
  }).catch(function (error) {
    console.error(error);
  });
})

gulp.task('db:seed', function(done) {
  var mongoose = require('mongoose')
    , _ = require('lodash')
    , System = require('./server/models/system')
    , Region = require('./server/models/region')
    , Jump = require('./server/models/jump')
    , map_data = require('./public/data/map.json')

  var db = mongoose.connect(process.env.MONGODB_URL);
  mongoose.set('debug', true);

  db.models.System.remove().execQ();
  db.models.Region.remove().execQ();
  db.models.Jump.remove().execQ();
  _.forEach(map_data.Regions, function(data) {
    var region = new Region(data);
    region.save();
  });

  _.forEach(map_data.Systems, function(data) {
    var system = new System(data);
    system.save();
  });

  _.forEach(map_data.Gates, function(data) {
    var jump = new Jump(data);
    jump.save();
  });

});
