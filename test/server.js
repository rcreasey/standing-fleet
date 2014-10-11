var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config = require('./config');

describe('Server', function() {
  var url = 'http://0.0.0.0:5000';

  before(function(done) {
    done();
  });

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
      it('should error if not present', function(done) {
        request(url)
          .get('/api/fleet/status')
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.success.should.not.be.ok;
            res.body.error.type.should.equal('request');
            done();
          });
      });

      it('should parse values appropriately', function(done) {
        var tarei = require('./fixtures/tarei-ju-.json')
        request(url)
          .get('/api/fleet/status')
          .set(tarei)
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
