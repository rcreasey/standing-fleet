module.exports = function (keyGenerator, storageManager) {

	var pub = {};

	var createMember = function(headerData, armadaKey) {
		return {
			key: keyGenerator.getKey(),
			armadaKey: armadaKey,
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

	pub.addAndGet = function (headerData, armadaKey, callback) {
		var member = createMember(headerData, armadaKey);

		storageManager.addItem('member', member, function (error) {
			if (error) return callback(error);

			callback(null, member);
		});
	};

	pub.getByKey = function (key, callback) {
		storageManager.getByKey('member', key, callback);
	};

	pub.getByArmadaKey = function (armadaKey, callback) {
		storageManager.getByArmadaKey('member', armadaKey, callback);
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