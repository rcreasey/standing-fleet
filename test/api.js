var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config = require('./config');

describe('API', function() {
  var url = 'http://0.0.0.0:5000/api';
  var tarei = require('./fixtures/tarei-ju-.json')

  describe('Fleet', function() {
    describe('Create', function() {

      describe('Invalid', function() {
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
            .set(tarei)
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
            .set(tarei)
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
        it('should create a fleet without a password', function(done) {
          request(url)
            .post('/fleet/create')
            .set(tarei)
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
            .set(tarei)
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

      });

    });

  });

});
