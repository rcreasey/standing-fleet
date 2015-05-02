var server = require('../server')
  , should = require('should')
  , assert = require('assert')
  , request = require('supertest')
  , mongoose = require('mongoose-q')()
  , winston = require('winston')
  , Q = require('q')
  , db = mongoose.connection
  , session = require('supertest-session')({app: server.app})
  , moment = require('moment')
  , _ = require('lodash')

var Fleet = require('../server/models/fleet')
  , Member = require('../server/models/member')
  , Event = require('../server/models/event')
  , Hostile = require('../server/models/hostile')

describe('Fleet API: Report Update', function() {
  var url = 'http://0.0.0.0:5000';
  var igb_headers = require('./fixtures/tarei-ju-.json');

  before(function(done) {
    Q.all([
      db.models.Fleet.remove().execQ(),
      db.models.Member.remove().execQ(),
      db.models.Hostile.remove().execQ(),
      db.models.Event.remove().execQ(),
      db.models.Session.remove().execQ(),
      db.models.Report.remove().execQ()
    ])
      .fin(done);
  });

  it('should catch invalid headers', function(done) {
    request(url)
      .post('/api/fleet/status')
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
      .post('/api/fleet/status')
      .set(igb_headers)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.success.should.not.be.ok;
        res.body.error.message.should.match(/Invalid or no session/);
        done();
      });
  });

  describe('should get updateHostile events', function() {
    before(function() { this.sess = new session(); });
    after(function() { this.sess.destroy(); });

    var fleet_key;
    var hostile;

    it('when creating a fleet', function(done) {
      this.sess
        .post('/api/fleet/create')
        .set(igb_headers)
        .expect(200, done)
    });

    it('when checking status of a fleet', function(done) {
      this.sess
        .get('/api/fleet/status')
        .set(igb_headers)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          fleet_key = res.body.fleetKey;
          done();
        });
    });

    it('when submitting a report', function(done) {
      this.sess
        .post('/api/fleet/status')
        .set(igb_headers)
        .send({
          systemId: igb_headers.EVE_SOLARSYSTEMID,
          systemName: igb_headers.EVE_SOLARSYSTEMNAME,
          reporterId: igb_headers.EVE_CHARID,
          reporterName: igb_headers.EVE_CHARNAME,
          text: 'validate',
          data: ['SirMolle', igb_headers.EVE_CHARNAME]
        })
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          done();
        });

    });

    it('when checking fleet status', function(done) {
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

          res.body.events[4].should.have.property('data').with.lengthOf(1)
          hostile = res.body.events[4].data[0];

          done();
        });
    });

    it('when submitting a report', function(done) {
      this.sess
        .post('/api/fleet/details')
        .set(igb_headers)
        .send({
          type: 'hostile',
          key: hostile.key,
          id: hostile.characterId,
          name: hostile.characterName,
          shipType: 'Archon'
        })
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          done();
        });

    });

    it('when checking fleet status', function(done) {
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

          res.body.events[4].should.have.property('data').with.lengthOf(1)
          res.body.events[4].data[0].should.have.property('shipType', 'Archon');
          res.body.events[4].data[0].should.have.property('shipTypeId', '23757');
          done();
        });
    });

    it('when polling a fleet', function(done) {
      this.sess
        .get('/api/fleet/poll/' + moment().unix())
        .set(igb_headers)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;

          res.body.should.have.property('events').with.lengthOf(2)
          res.body.events[0].should.have.property('type', 'reportHostile');
          res.body.events[0].data.should.not.have.property('shipType');
          res.body.events[0].data.should.not.have.property('shipTypeId');
          res.body.events[1].should.have.property('type', 'updateHostile');
          res.body.events[1].data.should.have.property('shipType', 'Archon');
          res.body.events[1].data.should.have.property('shipTypeId', '23757');

          done();
        });

    });

  });


});
