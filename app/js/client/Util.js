var Util = {
  getTime: function (ts) {
    var date = ts ? new Date(ts) : new Date();
    date = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));

    return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
  }
};
