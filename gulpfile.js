var gulp = require('gulp')
  , concat = require('gulp-concat')
  , declare = require('gulp-declare')
  , decompress = require('decompress-bzip2')
  , del = require('del')
  , download = require('gulp-download')
  , filter = require('gulp-filter')
  , gutil = require('gulp-util')
  , handlebars = require('gulp-handlebars')
  , mainBowerFiles = require('main-bower-files')
  , minifycss = require('gulp-minify-css')
  , order = require('gulp-order')
  , package = require('./package.json')
  , sequence = require('run-sequence')
  , uglify = require('gulp-uglify')
  , vinylPaths = require('vinyl-paths')
  , wrap = require('gulp-wrap')
  , debug = require('gulp-debug')

// [ prepare ]------------------------------------------------------------------
gulp.task('prepare', function() {
  gulp.src('app/**/*.css')
    .pipe(gutil.env.type === 'production' ? minifycss() : gutil.noop())
    .pipe(concat('css/style.css'))
    .pipe(gulp.dest('public'))
    .pipe(gulp.dest('client'));

  gulp.src(['app/js/core/*.js', 'app/js/lists/*.js', 'app/js/maps/system_map.js', 'app/js/app.js'])
    .pipe(order([
      'js/core/util.js',
      'js/core/ui.js',
      'js/core/ui_panels.js',
      'js/core/data.js',
      'js/core/server.js',
      'js/map/system_map.js',
      'js/lists/advisory_list.js',
      'js/lists/member_list.js',
      'js/lists/hostile_list.js',
      'js/lists/event_list.js',
      'js/lists/scan_list.js',
      'js/core/event_handler.js',
      'js/app.js'
    ]))
    .pipe(concat('js/app.js'))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'));

  gulp.src(['app/js/core/*.js', 'app/js/maps/wormhole_map.js', 'app/js/lists/event_list.js', 'app/js/overview.js'])
    .pipe(order([
      'js/core/util.js',
      'js/core/ui.js',
      'js/core/ui_panels.js',
      'js/core/data.js',
      'js/core/server.js',
      'js/map/wormhole_map.js',
      'js/lists/event_list.js',
      'js/core/event_handler.js',
      'js/overview.js'
    ]))
    .pipe(concat('js/app-overview.js'))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'));

  gulp.src('app/js/client/*.js')
    .pipe(order([
      'js/client/util.js',
      'js/client/ui.js',
      'js/client/ui_panels.js',
      'js/client/data.js',
      'js/client/parser.js',
      'js/client/clipboard.js',
      'js/client/logs.js',
      'js/client/initialize.js'
    ]))
    .pipe(concat('js/app.js'))
    .pipe(gulp.dest('client'));

  gulp.src('app/js/client.js')
    .pipe(concat('js/client.js'))
    .pipe(gulp.dest('client'));

  gulp.src(['vendor/es5-shim/es5-shim.js', 'vendor/es5-shim/es5-sham.js'])
    .pipe(concat('js/es5.js'))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'));

  gulp.src(mainBowerFiles())
    .pipe(filter(['*.js', '!es5*']))
    .pipe(concat('js/lib.js'))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'));

  gulp.src(mainBowerFiles())
    .pipe(filter(['*.js', '!es5*', '!jquery.js', '!typeahead*']))
    .pipe(concat('js/lib.js'))
    .pipe(gulp.dest('client'));

    gulp.src(mainBowerFiles())
    .pipe(filter(['jquery.js']))
    .pipe(concat('js/jquery.js'))
    .pipe(gulp.dest('client'));

  gulp.src(mainBowerFiles())
    .pipe(filter(['*.css']))
    .pipe(concat('css/dist.css'))
    .pipe(gulp.dest('public'))
    .pipe(gulp.dest('client'));

  gulp.src(mainBowerFiles())
    .pipe(filter(['*.eot', '*.svg', '*.ttf', '*.woff', '*.woff2']))
    .pipe(gulp.dest('public/fonts'))
    .pipe(gulp.dest('client/fonts'));

  gulp.src('node_modules/faye/browser/faye-browser.js')
    .pipe(concat('js/data-client.js'))
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
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'))
    .pipe(gulp.dest('client'));
});

gulp.task('default', ['prepare']);

gulp.task('watch', function () {
   gulp.watch('app/**', ['default']);
});

// [ build ]--------------------------------------------------------------------
gulp.task('build:prepare:fonts', function(done) {
  return done();
  return gulp.src('public/fonts/**')
    .pipe(gulp.dest('client/fonts'), done);
});

gulp.task('build:dist', function(done) {
  var electron = require('gulp-atom-shell');

  return gulp.src('client/**')
    .pipe(electron({ 
      platform: require('os').platform(),
      version: package.engines.electron 
    }))
    .pipe(electron.zfsdest('public/clients/client-' + require('os').platform() + '-' + package.version + '.zip'), done);
});

gulp.task('build:extract', function(done) {
  var unzip = require('gulp-unzip');

  return gulp.src('public/clients/client-' + require('os').platform() + '-' + package.version + '.zip')
    .pipe(unzip())
    .pipe(gulp.dest('./build'), done);
});

gulp.task('build:clean', function(done) {
  return del(['./build/*'], done);
});

gulp.task('build', function(done) {
  return sequence('prepare', 'build:prepare:fonts', 'build:dist', 'build:clean', 'build:extract', done);
});

gulp.task('build:release', function(done) {
  return sequence('prepare', 'build:prepare:fonts', 'build:dist', done);
});


// [ sde ]---------------------------------------------------------------------
gulp.task('sde:clean', function() {
  return del(['./sde/*']);
});

gulp.task('sde:download', function() {
  return download('https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2')
           .pipe(gulp.dest('./sde/'));
});

gulp.task('sde:extract', function() {
  return gulp.src('./sde/sqlite-latest.sqlite.bz2')
           .pipe(decompress())
           .pipe(gulp.dest('./sde/'));
});

gulp.task('sde:update', function(done) {
  sequence('sde:clean', 'sde:download', 'sde:extract', done);
});

gulp.task('sde:refresh', function(done) {
  var sqlite3 = require('sqlite3').verbose()
  , mongoose = require('mongoose')
  , _ = require('lodash')
  , System = require('./server/models/system')
  , Region = require('./server/models/region')
  , Jump = require('./server/models/jump')
  , Ship = require('./server/models/ship')
  , map_data = require('./public/data/map.json')

  var db = mongoose.connect(process.env.MONGODB_URL)
    , sde = new sqlite3.Database('./sde/sqlite-latest.sqlite')
  mongoose.set('debug', true);

  // map data
  sde.each('select * from mapSolarSystemJumps', function(err, row) {
    jump = {toSystem: row.toSolarSystemID, fromSystem: row.fromSolarSystemID,
            toRegion: row.toRegionID, fromRegion: row.fromRegionID,
            toConstellation: row.toConstellationID, fromConstellation: row.fromConstellationID};
    Jump.updateQ({toSystem: jump.toSystem, fromSystem: jump.fromSystem}, jump, {upsert: true}, function (err, numberAffected, raw) {
      console.log(raw);
    });
  });

  sde.each('select * from mapSolarSystems', function(err, row) {
    system = {id: row.solarSystemID, regionID: row.regionID, constellationID: row.constellationID, name: row.solarSystemName,
              security: row.security, security_class: row.securityClass};
    System.updateQ({id: system.id}, system, {upsert: true}, function (err, numberAffected, raw) {
      console.log(raw);
    });
  });

  sde.each('select * from mapRegions', function(err, row) {
    region = {id: row.regionID, name: row.regionName};
    Region.updateQ({id: region.id}, region, {upsert: true}, function (err, numberAffected, raw) {
      console.log(raw);
    });
  });

  // ship data
  sde.each('SELECT i.typeID id, i.typeName name, g.groupName class, IFNULL(img.metaGroupName, "Tech I") as meta FROM invTypes i INNER JOIN invGroups g ON i.groupID = g.groupID LEFT JOIN invMetaTypes imt ON i.typeID = imt.typeID LEFT JOIN invMetaGroups img ON imt.metaGroupID = img.metaGroupID WHERE g.categoryID = 6 AND i.published = 1 ORDER BY i.typeID ASC', function(err, row) {
    ship = {id: row.id, name: row.name, class: row.class, meta: row.meta};
    Ship.updateQ({id: ship.id}, ship, {upsert: true}, function (err, numberAffected, raw) {
      console.log(raw);
    });
  });

  // sde.close(function() {
  //   db.disconnect(done);
  // });
  
});

gulp.task('sde:refresh:wormhole_classes', function(done) {
  var sqlite3 = require('sqlite3').verbose()
    , mongoose = require('mongoose')
    , System = require('./server/models/system')

  var db = mongoose.connect(process.env.MONGODB_URL)
    , sde = new sqlite3.Database('./sde/sqlite-latest.sqlite')

  mongoose.set('debug', true);

  sde.each('SELECT solarsystemname,wormholeclassid FROM mapSolarSystems JOIN mapLocationWormholeClasses ON regionid=locationid WHERE regionID >= 11000001 ORDER by wormholeclassid;', function(err, row) {
    var data = {$set: {wormhole_class: row.wormholeClassID}, $unset: {security_class: 1}};
    System.update({name: row.solarSystemName}, data, { multi: true }, function (err, affected, raw) {
      console.log(affected);
    });

  });

  // sde.close(function() {
  //   db.disconnect(done);
  // });
});

gulp.task('db:repair:0', function(done) {
  var mongoose = require('mongoose')
    , _ = require('lodash')
    , System = require('./server/models/system')
    , Region = require('./server/models/region')
    , Jump = require('./server/models/jump')
    , map_data = require('./public/data/map.json')

  var db = mongoose.connect(process.env.MONGODB_URL);
  mongoose.set('debug', true);

  db.models.Jump.remove().execQ();
  db.models.System.remove().execQ();
  db.models.Region.remove().execQ();

  db.disconnect(done);
});

gulp.task('db:repair:1', function(done) {
  var mongoose = require('mongoose')
    , sqlite3 = require('sqlite3').verbose()
    , _ = require('lodash')
    , System = require('./server/models/system')
    , sde = new sqlite3.Database('./sde/sqlite-latest.sqlite')

  var db = mongoose.connect(process.env.MONGODB_URL);
  mongoose.set('debug', true);

  sde.each('select * from mapSolarSystems', function(err, row) {
    system = {id: row.solarSystemID, regionID: row.regionID, constellationID: row.constellationID, name: row.solarSystemName,
              security: row.security, security_class: row.securityClass};
    System.updateQ({id: system.id}, system, {upsert: true}, function (err, numberAffected, raw) {
      console.log(raw);
    });
  });

  // sde.close(function() {
  //   db.disconnect(done);
  // });
});

gulp.task('db:repair:2', function(done) {
  var mongoose = require('mongoose')
    , _ = require('lodash')
    , System = require('./server/models/system')
    , wormholes = require('./test/fixtures/wormholes.json')

  var db = mongoose.connect(process.env.MONGODB_URL);
  mongoose.set('debug', true);

  _.forEach(wormholes.wormholes, function(wormhole) {
    System.updateQ({name: wormhole.name}, {'wormhole_data.class': wormhole.class}, {upsert: true}, function (err, affected, raw) {
      console.log(affected);
    })
  });

  // db.disconnect(done);
});

gulp.task('db:repair:3', function(done) {
  var mongoose = require('mongoose')
    , _ = require('lodash')
    , System = require('./server/models/system')
    , map_data = require('./public/data/map.json')

  var db = mongoose.connect(process.env.MONGODB_URL);
  mongoose.set('debug', true);

  _.forEach(map_data.Systems, function(data) {
    System.updateQ({name: data.name}, {x: data.x, y: data.y}, {upsert: true}, function(err, affected, raw) {
      console.log(affected)
    })
  });

  // db.disconnect(done);
});

gulp.task('db:reset', function(done) {
  sequence('db:repair:0', 'sde:refresh', 'sde:refresh:wormhole_classes', 'db:repair:1', 'db:repair:2', 'db:repair:3', done);
});
