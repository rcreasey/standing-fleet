module.exports = function() {

	var pub = {};

	pub.respond = function(res, type, message) {

		var response = {
			ts: Date.now(),
			success: false,
			error: {
				type: type,
				message: message
			}
		};

		res.send(response);
	};

	return pub;
}