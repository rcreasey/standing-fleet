var server = require('../server')
  , should = require('should')
  , assert = require('assert')
  , request = require('supertest')
  , mongoose = require('mongoose-q')()
  , winston = require('winston')
  , Q = require('q')
  , db = mongoose.connection
  , session = require('supertest-session')({app: server.app})

var Fleet = require('../lib/models/fleet')
  , Member = require('../lib/models/member')
  , Event = require('../lib/models/event')

describe('Fleet API: Status', function() {
  var url = 'http://0.0.0.0:5000/api';
  var igb_headers = require('./fixtures/tarei-ju-.json');

  describe('Invalid', function() {

    beforeEach(function(done) {
      Q.all([
        db.models.Fleet.remove().execQ(),
        db.models.Member.remove().execQ(),
        db.models.Event.remove().execQ(),
        db.models.Session.remove().execQ()
      ])
        .fin(done);
    });

    it('should catch invalid headers', function(done) {
      request(url)
        .get('/fleet/status')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.not.be.ok;
          res.body.error.message.should.match(/You do not seem to be running the IGB, or your request was corrupted/);
          done();
        });
    });

    it('should catch invalid sessions', function(done) {
      request(url)
        .get('/fleet/status')
        .set(igb_headers)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.should.have.property('events').with.lengthOf(1);
          res.body.events[0].should.have.property('type', 'statusSelf');
          done();
        });
    });

  });

  describe('should send status updates by', function() {
    before(function() { this.sess = new session(); });
    after(function() { this.sess.destroy(); });

    it('creating a fleet', function(done) {
      this.sess
        .post('/api/fleet/create')
        .set(igb_headers)
        .expect(200, done)
    });

    it('and then checking it\'s status', function(done) {
      this.sess
        .get('/api/fleet/status')
        .set(igb_headers)
        .expect(200)
        .end(function(err,res) {
          if (err) return done(err);

          res.body.success.should.be.ok;
          res.body.should.have.property('events').with.lengthOf(6);
          res.body.events[0].should.have.property('type', 'statusSelf');
          res.body.events[1].should.have.property('type', 'statusFleet');
          res.body.events[2].should.have.property('type', 'statusEvents');
          res.body.events[3].should.have.property('type', 'statusMembers');
          res.body.events[4].should.have.property('type', 'statusHostiles');
          res.body.events[5].should.have.property('type', 'statusScans');

          done();
        });
    });

  });

});
