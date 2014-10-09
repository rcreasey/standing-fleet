var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config = require('./config');

describe('Requests', function() {
  var url = 'http://0.0.0.0:5000';

  before(function(done) {
    // mongoose.connect(config.db.mongodb);
    done();
  });

  describe('IGB Headers', function() {
    it('should redirect to /login/ if IGB header values are not set', function(done) {
      request(url)
	      .get('/')
	      .end(function(err, res) {
          if (err) {
            throw err;
          }

          console.log(res)
          res.should.have.status(302);
          done();
        });
    });
  });
});
