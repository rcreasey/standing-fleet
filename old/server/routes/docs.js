var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , docs = require(__dirname + '/../controllers/docs')

router.route('/')
  .get(docs.index);

module.exports = router;
