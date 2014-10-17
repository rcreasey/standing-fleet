var server = require('../server')
  , should = require('should')
  , assert = require('assert')
  , request = require('supertest')
  , mongoose = require('mongoose-q')()
  , winston = require('winston')
  , sinon = require('sinon')
  , Q = require('q')
  , db = mongoose.connection
  , session = require('supertest-session')({app: server.app})
  , moment = require('moment')
  , _ = require('lodash')

var Fleet = require('../lib/models/fleet')
  , Member = require('../lib/models/member')
  , Event = require('../lib/models/event')

describe('Fleet API: Leave', function() {
  var url = 'http://0.0.0.0:5000/api';
  var igb_headers = require('./fixtures/tarei-ju-.json');

  it('should catch invalid headers', function(done) {
    request(url)
      .get('/fleet/leave')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.success.should.not.be.ok;
        res.body.error.message.should.match(/You do not seem to be running the IGB, or your request was corrupted/);
        done();
      });
  });

  describe('should get memberLeft events', function() {
    before(function(done) {
      this.sess_a = new session();
      this.sess_b = new session();

      Q.all([
        db.models.Fleet.remove().execQ(),
        db.models.Member.remove().execQ(),
        db.models.Event.remove().execQ(),
        db.models.Session.remove().execQ()
      ])
        .fin(done);

    });
    after(function() {
      this.sess_a.destroy();
      this.sess_b.destroy();
    });

    var fleet_key = null;
    var igb_headers_a = _.clone(igb_headers);
    var igb_headers_b = require('./fixtures/jbethusela-ju-.json');
    var time = moment().unix();

    it('when creating a fleet', function(done) {
      this.sess_a
        .post('/api/fleet/create')
        .set(igb_headers_a)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.events.should.not.be.an.Array;
          res.body.events.should.have.property('type', 'fleetCreated');

          fleet_key = res.body.events.data.key;
          done();
        });
    });

    it('when joining a fleet', function(done) {
      this.sess_b
        .get('/api/fleet/join/' + fleet_key)
        .set(igb_headers_b)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.events.should.not.be.an.Array;
          res.body.events.should.have.property('type', 'memberJoined');

          done();
        });
    });

    it('when leaving a fleet', function(done) {
      this.sess_b
        .get('/api/fleet/leave')
        .set(igb_headers_b)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.should.have.property('events').with.lengthOf(0);

          done();
        })
    });

    it('when polling a fleet', function(done) {
      this.sess_a
        .get('/api/fleet/poll/' + time)
        .set(igb_headers_a)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          res.body.success.should.be.ok;
          res.body.should.have.property('events').with.lengthOf(3);
          // TODO
          // res.body.events.should.containDeep('fleetCreated');
          // res.body.events.should.containDeep('memberJoined');
          // res.body.events.should.containDeep('memberLeft');

          done();
        });

    });

  });

});
