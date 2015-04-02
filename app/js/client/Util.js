var moment = require('moment')

var Util = {
  getTime: function () {
    return moment().utc().format('HH:mm:ss');
  }
};

function log(message) {
  console.log('[' + moment().unix() + '] - ' + message);
}
