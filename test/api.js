var should = require('should')
  , assert = require('assert')
  , request = require('supertest')
  , mongoose = require('mongoose-q')()
  , winston = require('winston')
  , config = require('./config')
  , superagent = require('superagent')
  , agent = superagent.agent()

var Fleet = require('../lib/models/fleet')

var db;
before(function(done) {
  if (mongoose.connection.db) {
    db = mongoose.connection;
    return done();
  }
  db = mongoose.connect(config.db.mongodb_url), done;
});

describe('API', function() {
  var url = 'http://0.0.0.0:5000/api';
  var igb_headers = require('./fixtures/tarei-ju-.json');

  describe('Fleet', function() {
    beforeEach(function(done) {
      Fleet.collection.remove(done);
    });

    describe('Create', function() {
      describe('Invalid', function() {

        afterEach(function(done) {
          Fleet.find(function(err, fleets) {
            fleets.should.be.empty;
            done();
          });
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
        });

        // it('should not create a fleet if one is already joined', function(done) {
        //   request(url)
        //     .post('/fleet/create')
        //     .set(igb_headers)
        //     .expect(200)
        //     .end(function(err, res) {
        //       if (err) return done(err);
        //       res.body.success.should.be.ok;
        //       agent.saveCookies(res);
        //
        //       var req = request(url)
        //                   .post('/fleet/create')
        //                   .set(igb_headers);
        //
        //       agent.attachCookies(req);
        //
        //       req.expect(200)
        //         .end(function(err, res) {
        //           if (err) return done(err);
        //           debugger;
        //           res.body.success.should.not.be.ok;
        //           res.body.error.message.should.match(/Please leave your current fleet before creating a new one/);
        //           done();
        //         });
        //     });
        // });

      });

    });

  });

});
