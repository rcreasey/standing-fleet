var Server = {

	ajaxGet: function(endpoint, callback) {
		$.ajax({

			url: Data.config.apiUrl + endpoint,
			dataType: 'json',

			success: function (data) {
				setTimeout(function () {
					if (data.success) {
						callback(null, data);
					} else {
						callback(data.error, null);
					}
				}, 1000);
			},

			error: function (data, error, errorString) {
				if (error) {
					callback({type: 'net', message: errorString}, null);
				}
			},

		});
	},

	ajaxPost: function(endpoint, data, callback) {
		$.ajax({
			type		: 'POST',
			data		: { scanData: data },
			url 		: Data.config.apiUrl + endpoint,
			dataType	: 'json',

			success		: function( data ){
				setTimeout(function () {
					if (data.success) {
						callback(null, data);
					} else {
						callback(data.error, null);
					}
				}, 1000);
			},
			error 		: function(data, error, errorString){
				if (error) {
					callback({type: 'error', message: errorString}, null);
				}
			}
		});
	},

	status: function (callback) {
		Server.ajaxGet('/status', callback);
		Data.state.lastPollTs = Date.now();
	},

	joinArmada: function (armadaKey, callback) {
		Server.ajaxGet('/join/' + armadaKey, callback);
	},

	joinArmadaWithPassword: function (armadaKey, armadaPassword, callback) {
		Server.ajaxGet('/join/' + armadaKey + '/' + armadaPassword, callback);
	},

	eventResponse: function (eventKey, response, callback) {
		Server.ajaxGet('/respond/' + eventKey + '/' + response, callback);
	},

	createArmada: function (armadaPassword, callback) {
		Server.ajaxGet('/create/' + armadaPassword, callback);
	},

	poll: function (callback) {
		Server.ajaxGet('/poll/' + Data.state.lastPollTs, function (error, data) {
			if (error) return callback(error);

			Data.state.lastPollTs = data.ts;
			callback(null, data);
		});
	},

	leaveArmada: function (callback) {
		Server.ajaxGet('/leave', callback);
	},

	postScan: function (scanData, callback) {
		Server.ajaxPost('/scan', scanData, callback);
	},

	postStatus: function(statusData, callback) {
		Server.ajaxPost('/status', statusData, callback);
	},

	postDetails: function(detailsData, callback) {
		Server.ajaxPost('/details', detailsData, callback);
	}
};
