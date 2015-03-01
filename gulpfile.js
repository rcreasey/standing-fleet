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
  , rimraf = require('gulp-rimraf')
  , sequence = require('run-sequence')

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
      'js/AdvisoryList.js',
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
      'js/client/Parser.js',
      'js/client/Clipboard.js',
      'js/client/Logs.js',
      'js/client/Main.js'
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
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
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

gulp.task('default', function() {
  gutil.env.type = process.env.NODE_ENV;
  gulp.start('prepare');
});

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
  return gulp.src('./sde/*', { read: false }).pipe(rimraf());
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
      console.log(raw)
    });
    
  });
  
  // sde.close(function() {
  //   // db.disconnect(done);
  // });
});
