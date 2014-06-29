var EventHandler = {

	internalEvents: [
		'statusScans',
		'statusMembers',
		'statusEvents',
		'statusSelf',
		'statusArmada',
		'memberAccepted',
		'memberUpdated'
	],

	dispatchEvents: function (events, silent) {
		events.forEach(function (event) {
			EventHandler.preParse(event);

			if (typeof EventHandler[event.type] === 'function' && !silent) {
				EventHandler[event.type](event.data);
			}

			if (event.internal) return;

			if (silent) {
				delete event.alert;
				delete event.blink;
			}

			EventList.addEvent(event);
		});
	},

	preParse: function (event) {
		if (EventHandler.internalEvents.indexOf(event.type) > -1) {
			event.internal = true;

		} else if (event.type === 'memberJoined') {
			var member = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ member.id + ');">' + member.name + '</a> joined the Standing Fleet';
			event.blink = 'members';
			event.alert = true;

		} else if (event.type === 'memberLeft') {
			var member = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ member.id + ');">' + member.name + '</a> left the Standing FLeet';
			event.blink = 'members';
			event.alert = true;

		} else if (event.type === 'memberTimedOut') {
			var member = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ member.id + ');">' + member.name + '</a> timed out';
			event.blink = 'members';
			event.alert = true;

		} else if (event.type === 'scanPosted') {
			var scan = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ scan.reporterId + ');">' + scan.reporter + '</a> shared scan results from '
				+ '<a href="javascript:CCPEVE.showInfo(5, ' + scan.systemId + ');">'
				+ scan.systemName + '</a>';
			event.blink = 'scans';
			event.alert = true;

		} else if (event.type === 'armadaCreated') {
			var creator = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ creator.id + ');">' + creator.name + '</a> created this fleet ';
			event.alert = true;

		} else if (event.type === 'shipLost') {
			var member = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ member.id + ');">' + member.name + '</a> lost a '
				+ '<a href="javascript:CCPEVE.showInfo('
				+ member.shipTypeId + ');">' + member.shipTypeName + '</a>';
			event.alert = true;

		} else if (event.type === 'updateSystemMap' ) {
			var target = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ target.id + ');">' + target.name + '</a> has moved into '
				+ '<a href="javascript:CCPEVE.showInfo(5, ' + target.systemId + ');">'
				+ target.systemName + '</a>';
			event.alert = true;
		}
	},

	memberJoined: function (member) {
		log('Adding member: ' + member.name + '...');
		MemberList.removeMember(member.id);
		MemberList.addMember(member);
		MemberList.sortAndRenderAll();
		// SystemMap.update(member);
	},

	memberTimedOut: function (member) {
		log('Adding member: ' + member.name + '...');
		MemberList.removeMember(member.id);
		MemberList.sortAndRenderAll();
	},

	memberUpdated: function (member) {
		MemberList.addMember(member);
		MemberList.renderSingleMember(member);
	},

	memberLeft: function (member) {
		MemberList.removeMember(member.id)
		MemberList.sortAndRenderAll();
	},

	statusSelf: function (self) {
		Data.state.self.name = self.name;
		Data.state.self.id = self.id;
		Data.state.self.key = self.key;
		this.statusSelfSystem(self);
	},

	statusSelfSystem: function(self) {
		Data.state.self.systemId = self.systemId;
	},

	statusArmada: function (armada) {
		Data.state.armada.name = armada.name;
		Data.state.armada.key = armada.key;
		UI.setString('armadaKey', armada.key);
		if (armada.password) UI.setString('armadaPassword', '/ ' + armada.password);
		SystemMap.init();
	},

	statusEvents: function (events) {
		EventHandler.dispatchEvents(events, true);
	},

	statusScans: function (scans) {
		scans.forEach(ScanList.addScan);
	},

	statusMembers: function (members) {
		members.forEach(MemberList.addMember);
		MemberList.sortAndRenderAll();
	},

	scanPosted: function (scan) {
		ScanList.addScan(scan);
	},

	updateSystemMap: function (target) {
		this.statusSelfSystem(target);
		SystemMap.updateCurrent(target);
	}
};
