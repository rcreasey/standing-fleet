var gulp = require('gulp')
  , minifycss = require('gulp-minify-css')
  , filter = require('gulp-filter')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , order = require('gulp-order')
  , mainBowerFiles = require('main-bower-files')
  , handlebars = require('gulp-handlebars')
  , wrap = require('gulp-wrap')
  , declare = require('gulp-declare')
  , gutil = require('gulp-util')
  , download = require('gulp-download')
  , decompress = require('decompress-bzip2')
  , del = require('del')
  , sequence = require('run-sequence')

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

  gulp.src(['app/js/core/*.js', 'app/js/maps/wormhole_map.js', 'app/js/overview.js'])
    .pipe(order([
      'js/core/util.js',
      'js/core/ui.js',
      'js/core/ui_panels.js',
      'js/core/data.js',
      'js/core/server.js',
      'js/map/wormhole_map.js',
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
      'js/client/app.js'
    ]))
    .pipe(concat('js/client.js'))
    .pipe(gulp.dest('client'));

  gulp.src(mainBowerFiles())
    .pipe(filter(['*.js']))
    .pipe(concat('js/lib.js'))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(gulp.dest('public'))
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

gulp.task('build', function() {
  var nwbuilder = require('node-webkit-builder')

  var nw = new nwbuilder({
    files: './client/**/**',
    platforms: ['win']
  });

  nw.build().then(function () {
    console.log('all done!');
  }).catch(function (error) {
    console.error(error);
  });
});

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
    Jump.updateQ({toSystem: jump.toSystem, fromSystem: jump.fromSystem}, jump, {upsert: true});
  });
  
  sde.each('select * from mapSolarSystems', function(err, row) {
    system = {id: row.solarSystemID, regionID: row.regionID, constellationID: row.constellationID, name: row.solarSystemName,
              security: row.security, security_class: row.securityClass};
    System.updateQ({id: system.id}, system, {upsert: true});
  });
  
  sde.each('select * from mapRegions', function(err, row) {
    region = {id: row.regionID, name: row.regionName};
    Region.updateQ({id: region.id}, region, {upsert: true});
  });
  
  // ship data
  sde.each('SELECT i.typeID id, i.typeName name, g.groupName class, IFNULL(img.metaGroupName, "Tech I") as meta FROM invTypes i INNER JOIN invGroups g ON i.groupID = g.groupID LEFT JOIN invMetaTypes imt ON i.typeID = imt.typeID LEFT JOIN invMetaGroups img ON imt.metaGroupID = img.metaGroupID WHERE g.categoryID = 6 AND i.published = 1 ORDER BY i.typeID ASC', function(err, row) {
    ship = {id: row.id, name: row.name, class: row.class, meta: row.meta};
    Ship.updateQ({id: ship.id}, ship, {upsert: true});
  });
  
  sde.close(function() {
    db.disconnect(done);
  });
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
    System.update({name: row.solarSystemName}, data, { multi: true }, function (err, numberAffected, raw) {
      console.log(raw);
    });
    
  });
  
  // sde.close(function() {
  //   // db.disconnect(done);
  // });
});

gulp.task('db:repair:1', function(done) {
  var mongoose = require('mongoose')
    , _ = require('lodash')
    , System = require('./server/models/system')
    , Region = require('./server/models/region')
    , map_data = require('./public/data/map.json')

  var db = mongoose.connect(process.env.MONGODB_URL);
  mongoose.set('debug', true);

  db.models.System.remove().execQ();
  db.models.Region.remove().execQ();
  _.forEach(map_data.Systems, function(data) {
    var system = new System(data);
    system.save();
  });

  // db.disconnect(done);
});

gulp.task('db:repair:2', function(done) {
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
    System.updateQ({id: system.id}, system, {upsert: true});
  });

  // sde.close(function() {
  //   db.disconnect(done);
  // });
});

gulp.task('db:repair:3', function(done) {
  var mongoose = require('mongoose')
    , _ = require('lodash')
    , System = require('./server/models/system')
    , wormholes = require('./test/fixtures/wormholes.json')

  var db = mongoose.connect(process.env.MONGODB_URL);
  mongoose.set('debug', true);

  _.forEach(wormholes.wormholes, function(wormhole) {
    System.updateQ({name: wormhole.name}, {wormhole_data: {class: wormhole.class}}, {upsert: true});
  });

  // db.disconnect(done);
});
