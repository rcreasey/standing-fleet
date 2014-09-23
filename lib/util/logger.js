module.exports = function (settings) {

	var pub = {},
		loggers = {

		console: function (dateObject, message, depth) {
			var dateObject = new Date(),
				hours = ('0' + dateObject.getHours()).slice(-2),
				minutes = ('0' + dateObject.getMinutes()).slice(-2),
				seconds = ('0' + dateObject.getSeconds()).slice(-2),
				timestamp = '[' + hours + ':' + minutes + ':' + seconds + '] ';

			var indent = '';
			for (var i = 0; i < depth; i++) {
				indent += '  ';
			}

			console.log(timestamp + indent + message);
		}
	}

	pub.log = function(message, depth) {
		var dateObject = new Date();

		if (loggers[settings.log]) {
			loggers[settings.log](dateObject, message, depth);
		} else {
			loggers.console(dateObject, message, depth);
		}
	};

	pub.processing = function(req) {
		var dateObject = new Date();
		loggers[settings.log](dateObject, [req.method, req.url, req.ip].join(' '), 0);
	};

	return pub;
};
