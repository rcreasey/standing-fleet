var Data = {

  advisories: [],
  members: [],
  hostiles: [],
  events: [],
  scans: [],

  config: {
    data_client: {
      url: 'http://127.0.0.1:44444/',
      connected: false
    },
    domain: 'https://standing-fleet.apps.goonswarm.org/',
    apiUrl: '/api',
    alertStay: 5000,
    pollInterval: 7000,
    maxEvents: 20,
    maxScans: 20,
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
      key: ''
    },
    vicinity: {
      systemId: '',
      systemName: '',
      regionId: '',
      regionName: ''
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
    bottomMenu_pilotKey: $('#bottom-menu-pilot-key input'),
    bottomMenu_spinner: $('#bottom-menu-spinner'),
    bottomMenu_dataClient: $('#bottom-menu-data-client'),
    bottomMenu_dataClient_icon: $('#bottom-menu-data-client i'),
    bottomMenu_local: $('#bottom-menu-local'),
    bottomMenu_scan: $('#bottom-menu-scan'),
    bottomMenu_unlink: $('#bottom-menu-unlink'),
    bottomMenu_help: $('#bottom-menu-help'),
    bottomMenu_menu: $('#bottom-menu-menu'),

    mapInfo: $('#system-info'),
    mapLegend: $('#system-map #legend'),
    mapLegend_systems: $('#system-map .legend span'),
    currentSystem: $('#current .system'),
    currentRegion: $('#current .region'),
    fleetName: $('#current .fleet-name'),
    statusClear: $('#status-clear'),
    statusHostile: $('#status-hostile'),

    fleet_list: $('#fleet-list'),
    hud: $('#hud'),
    map: $('#system-map'),
    hostiles: $('#hostiles'),
    hostiles_list: $('#hostiles tbody:last'),
    members: $('#members'),
    members_list: $('#members tbody:last'),
    events: $('#events'),
    events_list: $('#events > .list'),
    scans: $('#scans'),
    scans_list: $('#scans > .list'),

    hud_scanline: $('#hud .screen .scanline'),
    scanline: {
      line_speed: 3000,
      line_start: $('#hud .scanline').css('top'),
      line_position: $(window).height(),
      dot_position: $(window).width() - 20
    }
  },

  templates: {
    alert: Templates.alert,
    event: Templates.event,
    hostile: Templates.hostile,
    hud: Templates.hud,
    jumpbridge_link_info: Templates.jumpbridge_link_info,
    map_legend: Templates.map_legend,
    member: Templates.member,
    panel: Templates.panel,
    scan: Templates.scan,
    start: Templates.start,
    system_info: Templates.system_info,
    wormhole_link_info: Templates.wormhole_link_info,
    wormhole_update_panel: Templates.wormhole_update_panel
  },

  ships: {},
  
  load_wormhole_types: function(callback) {
    $.ajax({
      url: '/data/wormhole_types.json',
      dataType: 'json',

      success: function( data ) { Data.wormhole_types = data.wormhole_types; },
      error: function(data, error, errorstring) {  if (error) console.log("Error: " + errorString); }
    });
  },
  
  load_ships: function(callback) {
    log('Populating Ship Types...');
    Server.ships(function(error, data) {
      Data.ships = data.ships;
    });  
  },
  
  populate: function(callback) {
    log('Populating Region Data...');
    Server.vicinity(function(error, data) {
      Data.state.vicinity = data.current;
      Data.regions = data.regions;
      Data.systems = data.systems;
      Data.jumps   = data.jumps;

      callback(data);
    });

  }
};
