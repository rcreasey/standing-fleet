var config = require('./config')
  , winston = require('winston')
  , mongoose = require('mongoose')
  , server = require('../server')
  , Q = require('q')
  
server.start();

var db;
before(function(done) {
  if (mongoose.connection.db) {
    db = mongoose.connection;
    return done();
  }
  db = mongoose.connect(config.db.mongodb_url), done;
});

beforeEach(function(done) {
  Q.all([
    db.models.Fleet.remove().execQ(),
    db.models.Member.remove().execQ(),
    db.models.Event.remove().execQ(),
    db.models.Session.remove().execQ()
  ])
    .fin(done);
});
