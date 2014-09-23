var mongodb = require('mongodb')

module.exports = function (_, logger, settings) {

	var pub = {};

	var getDb = function (callback) {
		mongodb.MongoClient.connect(settings.mongoDbURI, function (error, db) {
	    	if (error) return callback(error);
	    	callback(null, db);
	    });
	};

	var trimResult = function (doc) {
		if (doc && doc._id) delete doc._id;
		return doc;
	};

	pub.addItem = function (type, item, callback) {
		// logger.log('Setting ' + type + ' ' + item.key + ' in mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback(error);

			var collection = db.collection(type);
			collection.insert(_.cloneDeep(item), function (error) {
				db.close();
				if (error) return callback(error);

				callback(null, true);
			});
		});
	};

	pub.getByKey = function (type, key, callback) {
		// logger.log('Getting ' + type + ' ' + key + ' from mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback (error);

			var collection = db.collection(type);
			collection.findOne({key: key}, function (error, doc) {
				db.close();
				if (error) return callback(error);

				callback(null, trimResult(doc));
			});
		});
	};

	pub.getById = function (type, id, callback) {
		// logger.log('Getting ' + type + ' ' + id + ' from mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback (error);

			var collection = db.collection(type);
			collection.findOne({id: id}, function (error, doc) {
				db.close();
				if (error) return callback(error);

				callback(null, trimResult(doc));
			});
		});
	};

	pub.getByfleetKey = function (type, fleetKey, callback) {
		// logger.log('Getting all ' + type + 's belonging to ' + fleetKey + ' from mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback (error);

			var collection = db.collection(type);
			collection.find({fleetKey: fleetKey}).toArray(function (error, docs) {
				db.close();
				if (error) return callback(error);

				for (var i in docs) {
					docs[i] = trimResult(docs[i]);
				}

				callback(null, docs);
			});
		});
	};


	pub.removeByKey = function (type, key, callback) {
		// logger.log('Removing ' + type + ' ' + key + ' from mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback (error);

			var collection = db.collection(type);
			collection.remove({key: key}, function (error) {
				db.close();
				if (error) return callback(error);

				callback(null, true);
			});
		});
	};

	pub.removeByfleetKey = function (type, fleetKey, callback) {
		// logger.log('Removing ' + type + 's with armada key ' + fleetKey + ' from mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback (error);

			var collection = db.collection(type);
			collection.remove({fleetKey: fleetKey}, function (error) {
				db.close();
				if (error) return callback(error);

				callback(null, true);
			});
		});
	};

	pub.removeBySystemId = function (type, systemId, callback) {
		// logger.log('Removing ' + type + 's with system id ' + systemId + ' from mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback (error);

			var collection = db.collection(type);
			collection.remove({systemId: systemId}, function (error) {
				db.close();
				if (error) return callback(error);

				callback(null, true);
			});
		});
	};

	pub.getAll = function (type, callback) {
		// logger.log('Getting all ' + type + 's from mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback (error);

			var collection = db.collection(type);
			collection.find().toArray(function (error, docs) {
				db.close();
				if (error) return callback(error);

				for (var i in docs) {
					docs[i] = trimResult(docs[i]);
				}

				callback(null, docs);
			});
		});
	};

	pub.updateItem = function (type, key, item, callback) {
		// logger.log('Updating ' + type + ' ' + key + ' in mongo...', 3);

		getDb(function (error, db) {
			if (error) return callback (error);

			var collection = db.collection(type);
			collection.update({key: item.key}, _.cloneDeep(item), {upsert: true}, function (error, result) {
				db.close();
				if (error) callback(error);

				callback(null, true);
			});
		});
	}

	return pub;
};
