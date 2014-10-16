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

var Fleet = require('../lib/models/fleet')
  , Member = require('../lib/models/member')
  , Event = require('../lib/models/event')

describe('Fleet API: Poll', function() {
  var url = 'http://0.0.0.0:5000/api';
  var igb_headers = require('./fixtures/tarei-ju-.json');

  // describe('Invalid', function() {

    before(function(done) {
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
        .get('/fleet/poll/' +  moment().valueOf())
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
        .get('/fleet/poll/' +  moment().valueOf())
        .set(igb_headers)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.not.be.ok;
          res.body.error.message.should.match(/Error fetching fleet poll/);
          done();
        });
    });

    describe('should catch invalid polling', function() {
      var time = moment().valueOf();

      before(function() { this.sess = new session(); });
      after(function() { this.sess.destroy(); });

      it('when creating a fleet', function(done) {
        this.sess
          .post('/api/fleet/create')
          .set(igb_headers)
          .expect(200, done)
      });

      it('when polling a fleet', function(done) {
        this.sess
          .get('/api/fleet/poll/' + time)
          .set(igb_headers)
          .expect(200, done)

      });

      it('when polling a fleet again', function(done) {
        this.sess
          .get('/api/fleet/poll/' + (+time + 7))
          .set(igb_headers)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            // res.body.success.should.not.be.ok;
            // res.body.error.message.should.match(/You are polling too quickly/);
            done();
          });
      });

    });

  describe('should get memberUpdated and updateSystemMap events', function() {
    before(function() { this.sess = new session(); });
    after(function() { this.sess.destroy(); });

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
          res.body.should.have.property('events');
          res.body.events.should.be.an.Array;
          res.body.events[0].should.have.property('type', 'statusSelf');
          res.body.events[0].data.should.have.property('systemName', 'JU-OWQ');
          res.body.events[0].data.should.have.property('systemId', '30002911');

          done();
        })
    });

    it('when polling a fleet', function(done) {
      var updated_igb_headers = require('./fixtures/tarei-s-d.json');

      this.sess
        .get('/api/fleet/poll/' + moment().valueOf())
        .set(updated_igb_headers)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.should.have.property('events').with.lengthOf(2);
          res.body.events[0].should.have.property('type', 'memberUpdated');
          res.body.events[0].data.should.have.property('systemName', 'S-DN5M');
          res.body.events[0].data.should.have.property('systemId', '30002912');
          res.body.events[1].should.have.property('type', 'updateSystemMap');
          res.body.events[1].data.should.have.property('systemName', 'S-DN5M');
          res.body.events[1].data.should.have.property('systemId', '30002912');

          done();
        });

    });

  });

  describe('should get shipLost events', function() {
    before(function() { this.sess = new session(); });
    after(function() { this.sess.destroy(); });

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
          res.body.should.have.property('events');
          res.body.events.should.be.an.Array;
          res.body.events[0].should.have.property('type', 'statusSelf');
          res.body.events[0].data.should.have.property('shipType', 'Stratios');
          res.body.events[0].data.should.have.property('shipTypeId', '33470');

          done();
        })
    });

    it('when polling a fleet', function(done) {
      var updated_igb_headers = _.clone(igb_headers)
      updated_igb_headers.EVE_SHIPTYPENAME = 'Capsule';
      updated_igb_headers.EVE_SHIPTYPEID = '670';

      this.sess
        .get('/api/fleet/poll/' + moment().valueOf())
        .set(updated_igb_headers)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.should.have.property('events').with.lengthOf(2);
          res.body.events[0].should.have.property('type', 'memberUpdated');
          res.body.events[1].should.have.property('type', 'shipLost');
          res.body.events[1].data.should.have.property('shipTypeName', 'Stratios');
          res.body.events[1].data.should.have.property('shipTypeId', '33470');

          done();
        });

    });

  });


});
