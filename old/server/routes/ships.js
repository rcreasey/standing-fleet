var express = require('express')
  , router = express.Router()
  , ships = require(__dirname + '/../controllers/ships')

router.route('/')
  .get(ships.list);

module.exports = router;
