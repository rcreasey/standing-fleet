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

describe('WIP Application: Link', function() {
  var url = 'http://0.0.0.0:5000';
  var igb_headers = require('./fixtures/tarei-ju-.json');

  it('should redirect to /login for unlinked non-igb requests to /', function(done) {
    request(url)
      .get('/')
      .expect(302)
      .end(function(err, res) {
        if (err) return done(err);

        console.log(res.body);
        res.text.match(/Goonfleet ESA Login/)
        done();
      });
  });

  // describe('should get reportHostile events', function() {
  //   before(function() { this.sess = new session(); });
  //   after(function() { this.sess.destroy(); });
  //
  //   var fleet_key;
  //
  //   it('when creating a fleet', function(done) {
  //     this.sess
  //       .post('/api/fleet/create')
  //       .set(igb_headers)
  //       .expect(200, done)
  //   });
  //
  //   it('when checking status of a fleet', function(done) {
  //     this.sess
  //       .get('/api/fleet/status')
  //       .set(igb_headers)
  //       .expect(200)
  //       .end(function(err, res) {
  //         if (err) return done(err);
  //         res.body.success.should.be.ok;
  //         fleet_key = res.body.fleetKey;
  //         done();
  //       });
  //   });
  //
  //   it('when submitting a report', function(done) {
  //     this.sess
  //       .post('/api/fleet/status')
  //       .set(igb_headers)
  //       .send({
  //         scanData: {
  //           systemId: igb_headers.EVE_SOLARSYSTEMID,
  //           systemName: igb_headers.EVE_SOLARSYSTEMNAME,
  //           reporterId: igb_headers.EVE_CHARID,
  //           reporterName: igb_headers.EVE_CHARNAME,
  //           text: 'validate',
  //           data: ['SirMolle', igb_headers.EVE_CHARNAME]
  //         }
  //       })
  //       .expect(200)
  //       .end(function(err, res) {
  //         if (err) return done(err);
  //         res.body.success.should.be.ok;
  //         done();
  //       });
  //
  //   });
  //
  //   it('when checking fleet status', function(done) {
  //     this.sess
  //       .get('/api/fleet/status')
  //       .set(igb_headers)
  //       .expect(200)
  //       .end(function(err,res) {
  //         if (err) return done(err);
  //
  //         res.body.success.should.be.ok;
  //         res.body.should.have.property('events').with.lengthOf(6);
  //         res.body.events[0].should.have.property('type', 'statusSelf');
  //         res.body.events[1].should.have.property('type', 'statusFleet');
  //         res.body.events[2].should.have.property('type', 'statusEvents');
  //         res.body.events[3].should.have.property('type', 'statusMembers');
  //         res.body.events[4].should.have.property('type', 'statusHostiles');
  //         res.body.events[5].should.have.property('type', 'statusScans');
  //
  //         res.body.events[4].should.have.property('data').with.lengthOf(1)
  //
  //         done();
  //       });
  //   });
  //
  //   it('when polling a fleet', function(done) {
  //     this.sess
  //       .get('/api/fleet/poll/' + moment().unix())
  //       .set(igb_headers)
  //       .expect(200)
  //       .end(function(err, res) {
  //         if (err) return done(err);
  //         res.body.success.should.be.ok;
  //
  //         res.body.should.have.property('events').with.lengthOf(1)
  //         res.body.events[0].should.have.property('type', 'reportHostile');
  //         res.body.events[0].data[0].should.have.property('systemName', igb_headers.EVE_SOLARSYSTEMNAME);
  //         res.body.events[0].data[0].should.have.property('systemId', igb_headers.EVE_SOLARSYSTEMID);
  //
  //         done();
  //       });
  //
  //   });
  //
  // });

});
