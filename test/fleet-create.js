var server = require('../server')
  , should = require('should')
  , assert = require('assert')
  , request = require('supertest')
  , mongoose = require('mongoose-q')()
  , winston = require('winston')
  , db = mongoose.connection
  , Q = require('q')
  , session = require('supertest-session')({app: server.app})

var Fleet = require('../lib/models/fleet')

describe('Fleet API: Create', function() {
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

    it('should catch invalid sessions', function(done) {
      request(url)
        .post('/fleet/create')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.success.should.not.be.ok;
          res.body.error.message.should.match(/You do not seem to be running the IGB, or your request was corrupted/);
          done();
        });
    });

    it('should not create a fleet a short password', function(done) {
      request(url)
        .post('/fleet/create')
        .set(igb_headers)
        .send({fleetPassword: 'oi'})
        .expect(200)
        .end(function(err,res) {
          if (err) return done(err);
          res.body.success.should.not.be.ok;
          res.body.error.message.should.match(/Invalid password/);

          done();
        });
    });

    it('should not create a fleet a long password', function(done) {
      request(url)
        .post('/fleet/create')
        .set(igb_headers)
        .send({fleetPassword: '7d6fec0cdf6d154618c40c9013f1732393548d9b'})
        .expect(200)
        .end(function(err,res) {
          if (err) return done(err);
          res.body.success.should.not.be.ok;
          res.body.error.message.should.match(/Invalid password/);

          done();
        });
    });

  });

  describe('Valid', function() {

    beforeEach(function(done) {
      Q.all([
        db.models.Fleet.remove().execQ(),
        db.models.Member.remove().execQ(),
        db.models.Event.remove().execQ(),
        db.models.Session.remove().execQ()
      ])
        .fin(done);
    });

    afterEach(function(done) {
      Fleet.find(function(err, fleets) {
        fleets.length.should.eql(1, 'should only create one fleet');
        done();
      })
    });

    it('should create a fleet without a password', function(done) {
      request(url)
        .post('/fleet/create')
        .set(igb_headers)
        .expect(200)
        .end(function(err,res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.events.should.have.property('type', 'fleetCreated');
          res.body.events.data.should.have.property('key');
          res.body.events.data.should.have.property('password', false);

          done();
        });
    });

    it('should create a fleet with a password', function(done) {
      request(url)
        .post('/fleet/create')
        .set(igb_headers)
        .send({fleetPassword: 'dongues'})
        .expect(200)
        .end(function(err,res) {
          if (err) return done(err);
          res.body.success.should.be.ok;
          res.body.events.should.have.property('type', 'fleetCreated');
          res.body.events.data.should.have.property('key');
          res.body.events.data.should.have.property('password', 'dongues');

          done();
        });

    describe('should not create a fleet if one already exists', function() {
      before(function() { this.sess = new session(); });
      after(function() { this.sess.destroy(); });

      it('creating a fleet should succeed', function(done) {
        this.sess
          .post('/api/fleet/create')
          .set(igb_headers)
          .expect(200)
          .end(function(err,res) {
            if (err) return done(err);
            res.body.success.should.be.ok;
            done();
          });
      });

      it('creating another fleet should error', function(done) {
        this.sess
          .post('/api/fleet/create')
          .set(igb_headers)
          .expect(200)
          .end(function(err,res) {
            if (err) return done(err);
            res.body.success.should.not.be.ok;
            res.body.error.message.should.match(/Please leave your current fleet before creating a new one/);
            done();
          });
        });
        
      });

    });

  });

});
