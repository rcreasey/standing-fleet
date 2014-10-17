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
			data		: data,
			url 		: Data.config.apiUrl + endpoint,
			dataType	: 'json',

			success: function( data ){
				setTimeout(function () {
					if (data.success) {
						callback(null, data);
					} else {
						callback(data.error, null);
					}
				}, 1000);
			},
			error: function(data, error, errorString){
				if (error) {
					callback({type: 'error', message: errorString}, null);
				}
			}
		});
	},

	status: function (callback) {
		Server.ajaxGet('/status', callback);
		Data.state.lastPollTs = moment().unix();
	},

	joinFleet: function (fleetKey, callback) {
		Server.ajaxGet('/join/' + fleetKey, callback);
	},

	joinFleetWithPassword: function (fleetKey, fleetPassword, callback) {
		Server.ajaxGet('/join/' + fleetKey + '/' + fleetPassword, callback);
	},

	eventResponse: function (eventKey, response, callback) {
		Server.ajaxGet('/respond/' + eventKey + '/' + response, callback);
	},

	poll: function (callback) {
		Server.ajaxGet('/poll/' + Data.state.lastPollTs, function (error, data) {
			if (error) return callback(error);

			Data.state.lastPollTs = data.ts;
			callback(null, data);
		});
	},

	createFleet: function (fleetPassword, callback) {
		Server.ajaxPost('/create', { fleetPassword: fleetPassword }, callback);
	},

	leaveFleet: function (callback) {
		Server.ajaxGet('/leave', callback);
	},

	postScan: function (scanData, callback) {
		Server.ajaxPost('/scan', { scanData: scanData }, callback);
	},

	postStatus: function(statusData, callback) {
		Server.ajaxPost('/status', { scanData: statusData }, callback);
	},

	postDetails: function(detailsData, callback) {
		Server.ajaxPost('/details', { scanData: detailsData }, callback);
	}
};
