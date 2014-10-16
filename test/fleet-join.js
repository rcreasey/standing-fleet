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

describe('Fleet API: Join', function() {
  var url = 'http://0.0.0.0:5000/api';
  var igb_headers = require('./fixtures/tarei-ju-.json');

  it('should catch invalid headers', function(done) {
    request(url)
      .get('/fleet/join/abcdef12345')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.success.should.not.be.ok;
        res.body.error.message.should.match(/You do not seem to be running the IGB, or your request was corrupted/);
        done();
      });
  });

  describe('should get memberJoined events', function() {
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
    var time = moment().valueOf();

    it('create a fleet', function(done) {
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

    it('poll a fleet', function(done) {
      this.sess_a
        .get('/api/fleet/poll/' + time)
        .set(igb_headers_a)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          done();
        });

    });

    it('join a fleet', function(done) {
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

    it('check status of a fleet', function(done) {

      this.sess_b
        .get('/api/fleet/status')
        .set(igb_headers_b)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.should.have.property('events').with.lengthOf(6);
          res.body.events[0].should.have.property('type', 'statusSelf');
          res.body.events[1].should.have.property('type', 'statusFleet');
          res.body.events[2].should.have.property('type', 'statusEvents');
          res.body.events[3].should.have.property('type', 'statusMembers');
          res.body.events[4].should.have.property('type', 'statusHostiles');
          res.body.events[5].should.have.property('type', 'statusScans');

          res.body.events[1].should.have.property('fleetKey', fleet_key);
          res.body.events[3].should.have.property('data').with.lengthOf(2);

          done();
        })
    });

    it('poll a fleet', function(done) {
      this.sess_a
        .get('/api/fleet/poll/' + time)
        .set(igb_headers_a)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);

          res.body.success.should.be.ok;
          res.body.should.have.property('events');
          res.body.events[0].should.have.property('type', 'fleetCreated');
          res.body.events[1].should.have.property('type', 'memberJoined');
          done();
        });

    });

  });

});
