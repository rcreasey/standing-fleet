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
