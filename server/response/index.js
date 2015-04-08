var moment = require('moment')
  , _ = require('lodash')
  , header_parser = require(__dirname + '/../middleware/header-parser')

exports.success = function(res, events) {
  var response = {
    ts: moment().unix(),
    success: true,
  };

  if (events) response.events = events;

  res.send(response);
};

exports.error = function(res, type, message) {
  var response = {
    ts: moment().unix(),
    success: false,
    error: {
      type: type,
      message: message
    }
  };

  if (message.text !== null) { response.error.message = message.text; }
  if (_.contains(['session', 'igb-headers', 'trust'], type)) response.error.stopPoll = true;

  res.send(response);
};
