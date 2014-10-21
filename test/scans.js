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

describe('Scans', function() {
  var igb_headers = require('./fixtures/tarei-ju-.json');
  var scan_data = require('./fixtures/scan-data.json');

  describe('should make scans publically visible by id', function() {
    before(function() { this.sess = new session(); });
    after(function() { this.sess = new session(); });

    var scan_id;

    it('should create a fleet', function(done) {
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

          done();
        });
    });

    it('when submitting a scan', function(done) {
      this.sess
        .post('/api/fleet/scan')
        .set(igb_headers)
        .send(scan_data)
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

          res.body.events[5].should.have.property('data').with.lengthOf(1)
          scan_id = res.body.events[5].data[0]._id;

          done();
        });
    });

    it('when checking the scan publically', function(done) {
      request(server.app)
        .get('/scans/' + scan_id)
        .expect(200)
        .end(function(err,res) {
          if (err) return done(err);
          var ship_class = new RegExp(scan_data.scanData.classes[0].details[0].shipClass, 'g');
          res.text.should.match(ship_class);

          done();
        });
    });

    it('when checking the wrong scan publically', function(done) {
      request(server.app)
        .get('/scans/12345abcdef')
        .expect(200)
        .end(function(err,res) {
          if (err) return done(err);
          res.text.should.match(/Invalid Scan ID/);

          done();
        });
    })

  });
});
