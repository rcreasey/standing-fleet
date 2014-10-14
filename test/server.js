var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config = require('./config');
var _ = require('lodash');

describe('Server', function() {
  var url = 'http://0.0.0.0:5000';

  describe('Assets', function() {
    it('should serve images', function(done) {
      request(url)
        .get('/images/panel-logo.png')
        .expect(200, done);
    });

    it('should serve compiled css', function(done) {
      request(url)
        .get('/css/style.css')
        .expect(200, done);
    });

    it('should serve compiled client javascript', function(done) {
      request(url)
        .get('/js/app.js')
        .expect(200, done);
    });

    it('should serve compiled vendor javascript', function(done) {
      request(url)
        .get('/js/lib.js')
        .expect(200, done);
    });
  });

  describe('Views', function() {
    it('should handle static root view', function(done) {
      request(url)
        .get('/')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.text.match(/<title>Standing Fleet<\/title>/)
          done();
        });
    });

    it('should handle static login view', function(done) {
      request(url)
        .get('/login')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.text.match(/Goonfleet ESA Login/)
          done();
        });
    });
  });

  describe('Middleware', function() {
    describe('IGB Headers', function() {
      var igb_headers = require('./fixtures/tarei-ju-.json');

      it('should error if not present', function(done) {
        request(url)
          .get('/api/fleet/status')
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.success.should.not.be.ok;
            res.body.error.should.have.property('type', 'request');
            done();
          });
      });

      it('should error if the domain isn\'t trusted by IGB.', function(done) {
        var untrusted_igb_headers = _.clone(igb_headers);
        untrusted_igb_headers.EVE_TRUSTED = 'no';
        request(url)
          .get('/api/fleet/status')
          .set(untrusted_igb_headers)
          .expect(200)
          .end(function(err,res) {
            if (err) return done(err);
            res.body.success.should.not.be.ok;
            res.body.error.should.have.property('type', 'trust');
            res.body.error.message.should.match(/you need to enable trust for this domain/);
            done();
          });
      });

      it('should parse values appropriately', function(done) {
        request(url)
          .get('/api/fleet/status')
          .set(igb_headers)
          .expect(200)
          .end(function(err,res) {
            if (err) return done(err);
            res.body.success.should.be.ok;
            done();
          });
      });
    });

    describe('Check Authentication', function() {
      it('should redirect to login for non-authenticated requests', function(done) {
        request(url)
          .get('/link')
          .expect(302)
          .end(function(err, res) {
            if (err) return done(err);
            res.headers.location.should.match(/\/login/);
            done();
          });

      });
    });
  });

});
