var EventHandler = {

  internalEvents: [
    'statusScans',
    'statusHostiles',
    'statusMembers',
    'statusEvents',
    'statusSelf',
    'statusFleet',
    'memberAccepted',
    'memberJoined',
    'memberLeft',
    'memberTimedOut',
    'memberUpdated',
    'updateSystemMap'
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

      if (Util.dedupe(Data.events, event, 'text')) event.suppress = true;
      if (event.suppress !== true) EventList.addEvent(event);
    });
  },

  preParse: function (event) {
    try {

      if (EventHandler.internalEvents.indexOf(event.type) > -1) {
        event.internal = true;

      } else if (event.type === 'reportHostile') {
        var reported = event.data;
        if (reported.length === 0) return;

        if (reported.length === 1) {
          var hostile = reported[0];
          if (!Util.compareRegion(hostile)) event.suppress = true;

          if (hostile) event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
              + hostile.characterId + ');">' + hostile.characterName + '</a> has been reported in '
              + '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">'
              + hostile.systemName + '</a>';
        } else {
          if (!Util.compareRegion(reported[0])) event.suppress = true;

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
        event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
            + hostile.characterId + ');">' + hostile.characterName + '</a> has been identified ';

        if (hostile.is_docked) {
          event.text += 'as being Docked in ';
        } else {
          event.text += 'in a <a href="javascript:CCPEVE.showInfo(' + hostile.shipTypeId + ');">' + hostile.shipType + '</a> in '
        }

        event.text += '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">' + hostile.systemName + '</a>';
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

      } else if (event.type === 'hostileFaded') {
        var hostile = event.data;
        event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
          + hostile.characterId + ');">' + hostile.characterName + '</a> faded in '
          + '<a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');">'
          + hostile.systemName + '</a>';
        event.blink = 'hostiles';
        event.alert = true;

      } else if (event.type === 'hostileTimedOut') {
        var hostile = event.data;
        event.text = '<a href="javascript:CCPEVE.showInfo(1377, '
          + hostile.characterId + ');">' + hostile.characterName + '</a> '
          + ' contact lost '
        if (hostile.systemId !== null ) {
          event.text += 'in <a href="javascript:CCPEVE.showInfo(5, ' + hostile.systemId + ');"> '
                     + hostile.systemName + '</a>';
        }
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

      } else if (event.type === 'addAdvisory') {
        var advisory = event.data;
        event.text = 'Advisory issued for '
          + '<a href="javascript:CCPEVE.showInfo(5, ' + advisory.systemId + ');">'
          + Data.systems[advisory.systemId].name + '</a>: '
          + advisory.type;
        event.alert = true;

      } else if (event.type === 'clearAdvisory') {
        var advisory = event.data;
        event.text = 'Advisory cleared for '
          + '<a href="javascript:CCPEVE.showInfo(5, ' + advisory.systemId + ');">'
          + Data.systems[advisory.systemId].name + '</a>: '
          + advisory.type;
        event.alert = true;

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
    } catch(error) {
      if (event.data.systemId && !Util.compareRegion({systemID: event.data.systemId})) {
        log('Filtering event for remote region.');
      } else {
        log('Error parsing event: ' + error);
        console.log(event);        
      }
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

  hostileFaded: function(hostile) {
    HostileList.fadeHostile(hostile.characterId);
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

  addAdvisory: function(advisory) {
    AdvisoryList.addAdvisory(advisory);
    SystemMap.refreshSystems();
    SystemMap.updateInfo(Data.systems[advisory.systemId].name);
  },

  clearAdvisory: function(advisory) {
    AdvisoryList.clearAdvisory(advisory);
    SystemMap.refreshSystems();
    SystemMap.updateInfo(Data.systems[advisory.systemId].name);
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
      systemId: Data.state.vicinity.systemId,
      systemName: Data.state.vicinity.systemName,
      reporterId: Data.state.self.characterId,
      reporterName: Data.state.self.characterName,
      data: ScanList.parseLocal(report)
    })
  },

  statusSelf: function (self) {
    Data.state.self.characterName = self.characterName;
    Data.state.self.characterId = self.characterId;
    Data.state.self.key = self.key;
    Data.ui.bottomMenu_pilotKey.html('<i class="fa fa-key"></i>  ' + Data.state.self.key);
  },

  statusFleet: function (fleet) {
    Data.state.fleet.name = fleet.name;
    Data.state.fleet.key = fleet.key;
    Data.state.fleet.password = fleet.password;

    Data.ui.fleetName.text( fleet.name );
  },

  statusAdvisories: function (advisories) {
    advisories.forEach(AdvisoryList.addAdvisory);
    SystemMap.refreshSystems();
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

  updateSystemMap: function (pilot) {
    if(Util.isMe(pilot) && !Util.compareRegion(pilot)) {
      SystemMap.redraw();
    }
      
    SystemMap.refreshSystems();
    
  }
};
