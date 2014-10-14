var should = require('should')
  , assert = require('assert')
  , request = require('supertest')
  , mongoose = require('mongoose-q')()
  , winston = require('winston')
  , db = mongoose.connection
  , superagent = require('superagent')
  , agent = superagent.agent()

var Fleet = require('../lib/models/fleet')
  , Member = require('../lib/models/member')
  , Event = require('../lib/models/event')

describe('Fleet API: Status', function() {
  var url = 'http://0.0.0.0:5000/api';
  var igb_headers = require('./fixtures/tarei-ju-.json');

  describe('Invalid', function() {

    afterEach(function(done) {
      Fleet.find(function(err, fleets) {
        fleets.should.be.empty;
        done();
      });
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

  describe('Valid', function() {
    afterEach(function(done) {
      done();
    });

  //   it('should send events for a valid fleet', function(done) {
  //     request(url)
  //       .post('/fleet/create')
  //       .set(igb_headers)
  //       .expect(200)
  //       .end(function(err,res) {
  //         if (err) return done(err);
  //         res.body.success.should.be.ok;
  //
  //         agent.saveCookies(res);
  //         var req = request(url)
  //                     .post('/fleet/status')
  //                     .set(igb_headers);
  //
  //         agent.attachCookies(req);
  //
  //         req.expect(200)
  //           .end(function(err, res) {
  //             if (err) return done(err);
  //             console.log(res.body);
  //             res.body.success.should.not.be.ok;
  //
  //             done();
  //           });
  //
  //         done();
  //       });
  //   });

  });

});
