var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , scans = require(__dirname + '/../controllers/scans')

router.route('/:id')
  .get(scans.show);

module.exports = router;
