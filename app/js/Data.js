var Data = {

  members: [],
  hostiles: [],
  events: [],
  scans: [],

  config: {
    data_client: 'http://127.0.0.1:44444/',
    domain: 'https://standing-fleet.apps.goonswarm.org/',
    apiUrl: '/api/fleet',
    alertStay: 5000,
    pollInterval: 7000,
    maxEvents: 50,
    maxScans: 8,
    uiSpeed: 400,
    log: 'console'
  },

  state: {
    fleet: {
      password: '',
      name: '',
      key: ''
    },
    self: {
      characterName: '',
      characterId: '',
      key: '',
      systemId: ''
    },
    alertCount: 0,
    data_client: null,
    dimmed: false,
    lastPollTs : moment().unix(),
    memberSortOrder: {
      property: 'characterName',
      order: 'asc'
    },
    hostileSortOrder: {
      property: 'characterName',
      order: 'asc'
    },
    pollLoop: 0
  },

  ui: {
    logo: $('#top-logo'),
    alertContainer: $('#alert-container'),
    contentWrapper: $('#content-wrapper'),
    dim: $('#dim'),

    topMenu: $('#top-menu'),
    topMenu_hud: $('#top-menu-hud'),
    topMenu_map: $('#top-menu-system-map'),
    topMenu_hostiles: $('#top-menu-hostiles'),
    topMenu_members: $('#top-menu-members'),
    topMenu_events: $('#top-menu-events'),
    topMenu_scans: $('#top-menu-scans'),

    bottomMenu: $('#bottom-menu'),
    bottomMenu_spinner: $('#bottom-menu-spinner'),
    bottomMenu_local: $('#bottom-menu-local'),
    bottomMenu_scan: $('#bottom-menu-scan'),
    bottomMenu_unlink: $('#bottom-menu-unlink'),
    bottomMenu_menu: $('#bottom-menu-menu'),

    mapLegend_contents: $('#system-map .legend .contents'),
    mapLegend_systems: $('#system-map .legend span'),
    currentSystem: $('#current .system'),
    currentRegion: $('#current .region'),
    statusClear: $('#status-clear'),
    statusHostile: $('#status-hostile'),

    fleet_list: $('#fleet-list'),
    hud: $('#hud'),
    map: $('#system-map'),
    hostiles: $('#hostiles'),
    hostiles_list: $('#hostiles > .list'),
    members: $('#members'),
    members_list: $('#members > .list'),
    events: $('#events'),
    events_list: $('#events > .list'),
    scans: $('#scans'),
    scans_list: $('#scans > .list')
  },

  templates: {
    alert: Templates.alert,
    event: Templates.event,
    hostile: Templates.hostile,
    hud: Templates.hud,
    legend: Templates.legend,
    member: Templates.member,
    panel: Templates.panel,
    scan: Templates.scan,
    start: Templates.start
  },

  ships: {},

  preload: function() {
    $.ajax({
      url: '/data/ships.json',
      dataType: 'json',

      success: function( data ) { Data.ships = data; },
      error: function(data, error, errorstring) {  if (error) console.log("Error: " + errorString); }
    });

    $.ajax({
      url: '/data/map.json',
      dataType: 'json',

      success: function( data ) {
        Data.regions = data.Regions;
        Data.systems = data.Systems;
        Data.gates   = data.Gates;
      },
      error: function(data, error, errorstring) {  if (error) console.log("Error: " + errorString); }
    });
  }
};
