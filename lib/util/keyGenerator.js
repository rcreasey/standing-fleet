module.exports = function () {

	var chars = "abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ0123456789",
		pub = {};

	pub.getKey = function () {
		var key = '',
			length = 16;

		for (var i = 0; i<length; i++) {
			key += chars[Math.floor(Math.random() * chars.length)];
		}

		return key;
	};

	return pub;
}