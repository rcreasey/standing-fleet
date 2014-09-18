var EventHandler = {

	internalEvents: [
		'statusScans',
		'statusHostiles',
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

		} else if (event.type === 'reportHostile') {
			var reported = event.data;
			if ( reported.length === 1 ) {
				var hostile = reported[0];
				event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
					+ hostile.id + ');">' + hostile.name + '</a> has been reported in '
					+ '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">'
					+ hostile.systemName + '</a>';
			} else {
				event.text = reported.length + ' hostiles have been reported in '
					+ '<a href="javascript:CCPEVE.showInfo(5, ' + reported[0].systemId + ');">'
					+ reported[0].systemName + '</a>';
			}
			event.text += ' by ' + '<a href="javascript:CCPEVE.showInfo(1377, '
								 + reported[0].reporterId + ');">' + reported[0].reporterName + '</a>';
			event.blink = 'hostiles';
			event.alert = true;

		} else if (event.type === 'reportClear') {
			var reported = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(5, ' + reported.systemId + ');">'
					+ reported.systemName + '</a> was reported clear';
			event.text += ' by ' + '<a href="javascript:CCPEVE.showInfo(1377, '
								+ reported.reporterId + ');">' + reported.reporterName + '</a>';
			event.blink = 'hostiles';
			event.alert = true;

		} else if (event.type === 'updateHostile') {
			var hostile = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ hostile.id + ');">' + hostile.name + '</a> has been identified in a '
				+ '<a href="javascript:CCPEVE.showInfo(' + hostile.shipTypeId + ');">' + hostile.shipType + '</a> in '
				+ '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">' + hostile.systemName + '</a>';
			event.blink = 'hostiles';
			event.alert = true;

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

		} else if (event.type === 'hostileTimedOut') {
			var hostile = event.data;
			event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
				+ hostile.id + ');">' + hostile.name + '</a> faded in '
				+ '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">'
				+ hostile.systemName + '</a>';
			event.blink = 'hostiles';
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
		MemberList.removeMember(member.id);
		MemberList.addMember(member);
		MemberList.sortAndRenderAll();
		SystemMap.refreshSystems();
	},

	memberTimedOut: function (member) {
		MemberList.removeMember(member.id);
		MemberList.sortAndRenderAll();
		SystemMap.refreshSystems();
	},

	memberUpdated: function (member) {
		MemberList.addMember(member);
		MemberList.renderSingleMember(member);
		SystemMap.refreshSystems();
	},

	memberLeft: function (member) {
		MemberList.removeMember(member.id)
		MemberList.sortAndRenderAll();
		SystemMap.refreshSystems();
	},

	reportHostile: function (hostiles) {
		hostiles.forEach(HostileList.addHostile);
		HostileList.sortAndRenderAll();
		SystemMap.refreshSystems();
	},

	hostileTimedOut: function (hostile) {
		HostileList.removeMember(hostile.id);
		HostileList.sortAndRenderAll();
		SystemMap.refreshSystems();
	},

	updateHostile: function (hostile) {
		HostileList.addHostile(hostile);
		HostileList.renderSingleHostile(hostile);
		SystemMap.refreshSystems();
	},

	reportClear: function (system) {
		HostileList.clearBySystem(system.systemId);
		HostileList.sortAndRenderAll();
		SystemMap.refreshSystems();
	},

	statusSelf: function (self) {
		Data.state.self.name = self.name;
		Data.state.self.id = self.id;
		Data.state.self.key = self.key;
		if (self.systemId) this.statusSelfSystem(self);
	},

	statusSelfSystem: function(self) {
		Data.state.self.systemId = self.systemId;
		if (Data.state.self.regionId && Data.state.self.systemId) {
			Data.state.self.regionId = Data.systems[self.systemId].regionID;
		}
	},

	statusArmada: function (armada) {
		Data.state.armada.name = armada.name;
		Data.state.armada.key = armada.key;
		Data.state.armada.password = armada.password;

		SystemMap.init();
	},

	statusEvents: function (events) {
		EventHandler.dispatchEvents(events, true);
	},

	statusScans: function (scans) {
		scans.forEach(ScanList.addScan);
		SystemMap.refreshSystems();
	},

	statusMembers: function (members) {
		members.forEach(MemberList.addMember);
		MemberList.sortAndRenderAll();
	},

	statusHostiles: function (hostiles) {
		hostiles.forEach(HostileList.addHostile);
		HostileList.sortAndRenderAll();
	},

	scanPosted: function (scan) {
		ScanList.addScan(scan);
	},

	updateSystemMap: function (target) {
    if(Data.state.self.id === target.id) {
      if(Data.state.self.regionId !== Data.systems[target.systemId].regionID) {
        this.statusSelfSystem(target);
        SystemMap.redraw();
      }
      else {
        this.statusSelfSystem(target);
        SystemMap.updateCurrent();
        SystemMap.refreshSystems();
      }
    }
  }
};
