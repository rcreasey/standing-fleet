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
  , passportStub = require('passport-stub')

var Fleet = require('../server/models/fleet')
  , Member = require('../server/models/member')
  , Event = require('../server/models/event')
  , Hostile = require('../server/models/hostile')

describe('Application: Link', function() {
  var url = 'http://0.0.0.0:5000';
  var igb_headers = require('./fixtures/tarei-ju-.json');
  var updated_igb_headers = require('./fixtures/tarei-s-d.json');

  it('should redirect to /login for unlinked non-igb requests to /', function(done) {
    request(url)
      .get('/')
      .expect(302)
      .end(function(err, res) {
        if (err) return done(err);
        res.headers.location.should.match(/\/login/);
        done();
      });
  });

  it('should redirect to /login for non-authenticated requests to /link', function(done) {
    request(url)
      .get('/link')
      .expect(302)
      .end(function(err, res) {
        if (err) return done(err);
        res.headers.location.should.match(/\/login/);
        done();
      });
  });

  it('should display /link for authenticated users', function(done) {
    passportStub.install(server.app)
    passportStub.login({username: 'tarei'});

    request(server.app)
      .get('/link')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        res.text.should.match(/Link Session To Pilot/)
        res.text.should.match(/Hello, tarei/)

        done();
      });

  });

  describe('should successfully link a pilot', function(done) {
      before(function(done) {
        this.sess_a = new session();
        this.sess_b = new session();
        passportStub.install(server.app)

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

      var pilot_key;

      it('when creating a fleet', function(done) {
        this.sess_a
          .post('/api/fleet/create')
          .set(igb_headers)
          .expect(200, done)
      });

      it('when checking status of a fleet', function(done) {
        this.sess_a
          .get('/api/fleet/status')
          .set(igb_headers)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.success.should.be.ok;
            pilot_key = res.body.events[0].data.key;

            done();
          });
      });

      it('when logging in to link a pilot', function(done) {
        passportStub.login({username: 'tarei'});

        this.sess_b
          .get('/link')
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.text.should.match(/Link Session To Pilot/)
            res.text.should.match(/Hello, tarei/)

            done();
          });

      });

      it('when linking to a pilot', function(done) {
        this.sess_b
          .post('/link')
          .send({key: pilot_key})
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.text.should.match(/Link Session To Pilot/);
            res.text.should.match(/Hello, tarei/);
            res.text.should.match(pilot_key);

            done();
          });

      });

      it('when one session is polling a fleet', function(done) {
        this.sess_a
          .get('/api/fleet/poll/' + moment().unix())
          .set(igb_headers)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.success.should.be.ok;
            done();
          });
      });

      it('when the other session is polling a fleet', function(done) {
        this.sess_b
          .get('/api/fleet/poll/' + moment().unix())
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.success.should.be.ok;
            done();
          });
      });

      it('when original session moves systems and is polling a fleet', function(done) {
        this.sess_a
          .get('/api/fleet/poll/' + moment().unix())
          .set(updated_igb_headers)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.success.should.be.ok;
            res.body.should.have.property('events').with.lengthOf(2);
            // res.body.events[0].should.have.property('type', 'memberUpdated');
            // res.body.events[1].should.have.property('type', 'updateSystemMap');

            done();
          });
      });

      it('when the linked session is polling a fleet and gets memberUpdated', function(done) {
        this.sess_b
          .get('/api/fleet/poll/' + moment().unix())
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.success.should.be.ok;
            res.body.should.have.property('events').with.lengthOf(2);
            // res.body.events[0].should.have.property('type', 'memberUpdated');
            // res.body.events[1].should.have.property('type', 'updateSystemMap');

            done();
          });
      });

  });

  describe('should successfully unlink a pilot', function(done) {
      before(function(done) {
        this.sess_a = new session();
        this.sess_b = new session();
        passportStub.install(server.app)

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

      var pilot_key;

      it('when creating a fleet', function(done) {
        this.sess_a
          .post('/api/fleet/create')
          .set(igb_headers)
          .expect(200, done)
      });

      it('when checking status of a fleet', function(done) {
        this.sess_a
          .get('/api/fleet/status')
          .set(igb_headers)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.success.should.be.ok;
            pilot_key = res.body.events[0].data.key;

            done();
          });
      });

      it('when logging in to link a pilot', function(done) {
        passportStub.login({username: 'tarei'});

        this.sess_b
          .get('/link')
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.text.should.match(/Link Session To Pilot/)
            res.text.should.match(/Hello, tarei/)

            done();
          });

      });

      it('when linking to a pilot', function(done) {
        this.sess_b
          .post('/link')
          .send({key: pilot_key})
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.text.should.match(/Link Session To Pilot/);
            res.text.should.match(/Hello, tarei/);
            res.text.should.match(pilot_key);

            done();
          });

      });

      it('when unlinking to a pilot', function(done) {
        this.sess_b
          .get('/unlink')
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.text.should.match(/Link Session To Pilot/)
            res.text.should.match(/Hello, tarei/)
            res.text.should.not.match(pilot_key);

            done();
          });
      })

  });

});
