var root = require('path').normalize(__dirname + '/../..')
	, Member = require(root + '/models/member')

module.exports = function (keyGenerator) {

	var pub = {};

	var createMember = function(headerData, fleetKey) {
		return new Member({
      key: keyGenerator.getKey(),
      fleetKey: fleetKey,
      characterId: headerData.id,
      characterName: headerData.name,

      shipType: headerData.shipType,
      shipTypeId: headerData.shipTypeId,
      shipName: headerData.shipName,

      systemName: headerData.systemName,
      systemId: headerData.systemId,
      isDocked: headerData.isDocked
		});
	};

	pub.getNonAttached = function (headerData) {
		return createMember(headerData, 'none');
	};

	pub.addAndGet = function (headerData, fleetKey, callback) {
		var member = createMember(headerData, fleetKey);

		member.save(function(error) {
      if (error) return callback(error);

      callback(null, member);
    });
	};

	pub.getByKey = function (key, callback) {
    Member.findOne({key: key}, callback);
	};

	pub.getByfleetKey = function (fleetKey, callback) {
    Member.find({fleetKey: fleetKey}, callback);
	};

	pub.getAll = function (callback) {
  	Member.find({}, callback);
	};

	pub.removeByKey = function (key, callback) {
  	Member.remove({key: key}, callback);
	};

	pub.update = function (key, member, callback) {
    Member.update({key: key}, member, { upsert: true, multi: true }, callback);
	};

	return pub;
};
