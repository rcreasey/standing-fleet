module.exports = function (keyGenerator, storageManager) {

	var pub = {};

	var createMember = function(headerData, fleetKey) {
		return {
			key: keyGenerator.getKey(),
			fleetKey: fleetKey,
			ts: Date.now(),
			id: headerData.id,
			name: headerData.name,

			shipType: headerData.shipType,
			shipTypeId: headerData.shipTypeId,
			shipName: headerData.shipName,

			systemName: headerData.systemName,
			systemId: headerData.systemId,
			isDocked: headerData.isDocked
		}
	};

	pub.getNonAttached = function (headerData) {
		return createMember(headerData, 'none');
	};

	pub.addAndGet = function (headerData, fleetKey, callback) {
		var member = createMember(headerData, fleetKey);

		storageManager.addItem('member', member, function (error) {
			if (error) return callback(error);

			callback(null, member);
		});
	};

	pub.getByKey = function (key, callback) {
		storageManager.getByKey('member', key, callback);
	};

	pub.getByfleetKey = function (fleetKey, callback) {
		storageManager.getByfleetKey('member', fleetKey, callback);
	};

	pub.getAll = function (callback) {
		storageManager.getAll('member', callback);
	};

	pub.removeByKey = function (key, callback) {
		storageManager.removeByKey('member', key, callback);
	};

	pub.update = function (key, member, callback) {
		storageManager.updateItem('member', key, member, callback);
	};

	return pub;
};