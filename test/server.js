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

  describe('Static Assets', function() {
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

    it('should serve compiled javascript', function(done) {
      request(url)
        .get('/js/app.js')
        .expect(200, done);
      request(url)
        .get('/js/lib.js')
        .expect(200, done);
      request(url)
        .get('/js/templates.js')
        .expect(200, done);
    });
  })

});
