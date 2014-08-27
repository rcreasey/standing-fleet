var express = require('express');
var router = express.Router();


router.get('/create/:armadaPassword', function(req, res) {
  res.send('ok');
});

router.get('/leave', function(req, res) {
  res.send('ok');
});

router.get('/status', function(req, res) {
  res.send('ok');
});

router.get('/join/:armadaKey', function(req, res) {
  res.send('ok');
});

router.get('/join/:armadaKey/:armadaPassword', function(req, res) {
  res.send('ok');
});

router.get('/poll/:lastPollTs', function(req, res) {
  res.send('ok');
});

router.post('/scan', function(req, res) {
  res.send('ok');
});

router.post('/status', function(req, res) {
  res.send('ok');
});

router.post('/details', function(req, res) {
  res.send('ok');
});

module.exports = router;
