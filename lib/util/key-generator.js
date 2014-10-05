var crypto = require('crypto')
  , moment = require('moment')

module.exports = function () {

  pub.getKey = function () {
    var key = ''
      , length = 18
      , current_date = moment().valueOf().toString()
      , random = Math.random().toString()

    key = crypto.createHash('sha1').update(current_date + random).digest('hex');


    return key.slice(1, length);
  };

  return pub;
}();
