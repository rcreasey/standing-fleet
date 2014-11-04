var EventHandler = {

  internalEvents: [
    'statusScans',
    'statusHostiles',
    'statusMembers',
    'statusEvents',
    'statusSelf',
    'statusFleet',
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
        if (hostile) event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
            + hostile.characterId + ');">' + hostile.characterName + '</a> has been reported in '
            + '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">'
            + hostile.systemName + '</a>';
      } else {
        event.text = reported.length + ' hostiles have been reported in '
          + '<a href="javascript:CCPEVE.showInfo(5, ' + reported[0].systemId + ');">'
          + reported[0].systemName + '</a>';
      }
      if (reported[0]) event.text += ' by ' + '<a href="javascript:CCPEVE.showInfo(1377, '
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
      if (hostile) event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
          + hostile.characterId + ');">' + hostile.characterName + '</a> has been identified in a '
          + '<a href="javascript:CCPEVE.showInfo(' + hostile.shipTypeId + ');">' + hostile.shipType + '</a> in '
          + '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">' + hostile.systemName + '</a>';
      event.blink = 'hostiles';
      event.alert = true;

    } else if (event.type === 'memberJoined') {
      var member = event.data;
      event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
        + member.characterId + ');">' + member.characterName + '</a> joined the Standing Fleet';
      event.blink = 'members';

    } else if (event.type === 'memberLeft') {
      var member = event.data;
      event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
        + member.characterId + ');">' + member.characterName + '</a> left the Standing Fleet';
      event.blink = 'members';

    } else if (event.type === 'memberTimedOut') {
      var member = event.data;
      event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
        + member.characterId + ');">' + member.characterName + '</a> timed out';
      event.blink = 'members';

    } else if (event.type === 'hostileTimedOut') {
      var hostile = event.data;
      event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
        + hostile.characterId + ');">' + hostile.characterName + '</a> faded in '
        + '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">'
        + hostile.systemName + '</a>';
      event.blink = 'hostiles';
      event.alert = true;

    } else if (event.type === 'scanPosted') {
      var scan = event.data;
      event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
        + scan.reporterId + ');">' + scan.reporterName + '</a> shared scan results from '
        + '<a href="javascript:CCPEVE.showInfo(5, ' + scan.systemId + ');">'
        + scan.systemName + '</a>';
      event.blink = 'scans';
      event.alert = true;

    } else if (event.type === 'fleetCreated') {
      var creator = event.data;
      event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
        + creator.characterId + ');">' + creator.characterName + '</a> created this fleet ';

    } else if (event.type === 'shipLost') {
      var member = event.data;
      event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
        + member.characterId + ');">' + member.characterName + '</a> lost a '
        + '<a href="javascript:CCPEVE.showInfo('
        + member.shipTypeId + ');">' + member.shipTypeName + '</a>';
      event.alert = true;

    } else if (event.type === 'updateSystemMap') {
      var target = event.data;
      event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
        + target.characterId + ');">' + target.characterName + '</a> has moved into '
        + '<a href="javascript:CCPEVE.showInfo(5, ' + target.systemId + ');">'
        + target.systemName + '</a>';

    } else if (event.type === 'sourcedClear') {
      var report = event.data;
      event.text = 'Intel channel reported '
        + '<a href="javascript:CCPEVE.showInfo(5, ' + report.systemId + ');">' + report.systemName + '</a> '
        + 'as clear by '
        + '<a href="javascript:CCPEVE.showInfo(1377, ' + report.reporterId + ');">' + report.reporterName;

    } else if (event.type === 'sourcedHostile') {
      var report = event.data;
      event.text = 'Intel channel reported '
        + '<a href="javascript:CCPEVE.showInfo(5, ' + report.systemId + ');">' + report.systemName + '</a> '
        + 'hostile by '
        + '<a href="javascript:CCPEVE.showInfo(1377, ' + report.reporterId + ');">' + report.reporterName;

    } else if (event.type === 'sourcedClipboard') {
      event.text = 'Parsing clipboard text from client.'
    }
  },

  memberJoined: function (member) {
    MemberList.removeMember(member.characterId);
    MemberList.addMember(member);
    MemberList.sortAndRenderAll();
    SystemMap.refreshSystems();
  },

  memberTimedOut: function (member) {
    MemberList.removeMember(member.characterId);
    MemberList.sortAndRenderAll();
    SystemMap.refreshSystems();
  },

  memberUpdated: function (member) {
    MemberList.addMember(member);
    MemberList.renderSingleMember(member);
    SystemMap.refreshSystems();
  },

  memberLeft: function (member) {
    MemberList.removeMember(member.characterId)
    MemberList.sortAndRenderAll();
    SystemMap.refreshSystems();
  },

  reportHostile: function (hostiles) {
    hostiles.forEach(HostileList.addHostile);
    HostileList.sortAndRenderAll();
    SystemMap.refreshSystems();
  },

  hostileTimedOut: function (hostile) {
    HostileList.removeHostile(hostile.characterId);
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

  sourcedClear: function (report)  {
    submitSourcedStatus({
      text: 'clear',
      systemId: report.systemId,
      systemName: report.systemName,
      reporterId: report.reporterId,
      reporterName: report.reporterName,
      data: [report.reporterName]
    });

  },

  sourcedHostile: function (report) {
    submitSourcedStatus({
      text: 'hostile',
      systemId: report.systemId,
      systemName: report.systemName,
      reporterId: report.reporterId,
      reporterName: report.reporterName,
      data: Object.keys(report.pilots)
    });
  },

  sourcedClipboard: function (report) {
    submitSourcedStatus({
      text: 'validate',
      systemId: Data.state.self.systemId,
      systemName: Data.systems[Data.state.self.systemId].name,
      reporterId: Data.state.self.characterId,
      reporterName: Data.state.self.characterName,
      data: ScanList.parseLocal(report)
    })
  },

  statusSelf: function (self) {
    Data.state.self.characterName = self.characterName;
    Data.state.self.characterId = self.characterId;
    Data.state.self.key = self.key;
    if (self.systemId) this.statusSelfSystem(self);
  },

  statusSelfSystem: function(self) {
    Data.state.self.systemId = self.systemId;
    if (Data.state.self.regionId && Data.state.self.systemId) {
      Data.state.self.regionId = Data.systems[self.systemId].regionID;
    }
  },

  statusFleet: function (fleet) {
    Data.state.fleet.name = fleet.name;
    Data.state.fleet.key = fleet.key;
    Data.state.fleet.password = fleet.password;

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
    if(Data.state.self.characterId == target.characterId) {
      this.statusSelfSystem(target);

      if(Data.state.self.regionId != Data.systems[target.systemId].regionID) {
        SystemMap.redraw();
      }
      else {
        SystemMap.updateCurrent();
        SystemMap.refreshSystems();
      }
    }
  }
};
