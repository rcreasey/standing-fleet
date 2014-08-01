var Util = {

	isShip: function (shipName) {
		return (typeof Data.ships[shipName] !== 'undefined')
	},

	getShipType: function (shipName) {
		if (Util.isShip(shipName)){
			return Data.ships[shipName].icons[0];
		}
		return 'other';
	},

	getShipIcon: function (shipName) {
		var returnElement 	= $('<div/>');

		if (Util.isShip(shipName)){
			for (var i in Data.ships[shipName].class) {
				returnElement.append($('<img src="/images/ship-icons/ship-icon-' + Data.ships[shipName].icons[i] + '.gif" alt="" />'));
			}
		} else {
			returnElement.append($('<img src="/images/ship-icons/ship-icon-other.gif" alt="Ship type" />'));
		}

		return $('<div/>').append(returnElement).html();
	},

	getTime: function (ts) {
		var date = ts ? new Date(ts) : new Date();
		date = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));

		return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
	},

	escapeHTML: function (string) {
		return string.replace(/</gi,'&lt;').replace(/>/gi,'&gt;');
	},

	deepClone: function (object) {
		return JSON.parse(JSON.stringify(object));
	},

	getUrlKey: function () {
		var url = window.location.href,
			match = url.match(/[A-z0-9]{16}/);

		return match ? match[0] : false;
	},

	redirectToKeyUrl: function (armadaKey) {
		window.location = location.protocol
			+ '//' + location.hostname
			+ (location.port ? ':' + location.port : '')
			+ '/' + armadaKey + '/';
	},

	redirectToBasePath: function () {
		window.location = location.protocol
			+ '//' + location.hostname
			+ (location.port ? ':' + location.port : '')
			+ '/';
	},

	redirectIfNecessary: function (armadaKey, callback) {
		if (!!armadaKey !== !!Util.getUrlKey() || armadaKey !== Util.getUrlKey()) {
			UIPanels.showLoadingPanel('Redirecting to Standing Fleet URL...', function () {
				setTimeout($.proxy(Util.redirectToKeyUrl, null, armadaKey),
					Data.config.pollInterval);
			});
		} else {
			callback();
		}
	}
};
