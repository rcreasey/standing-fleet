var path = require('path')

var Data = {
  config: {
    domain: 'https://standing-fleet.herokuapp.com/',
    apiUrl: '/api/fleet',
    alertStay: 5000,
    maxEvents: 20,
    uiSpeed: 400,
    local_dataport: 44444,
    log: 'console'
  },

  state: {
    alertCount: 0,
    dimmed: false,
    poll: {
      loop: 15000,
      clipboard: false,
      logs: false
    },
    datasources: {
      local: null,
      logs: {
        handles: [],
        path: { 
          win: path.join(process.env['USERPROFILE'] || '','Documents','EVE','logs','Chatlogs'),
          darwin: path.join(process.env['HOME'] || '','Library','Application Support','EVE Online','p_drive','User','My Documents','EVE','logs','Chatlogs')

        },
        channels: {
          "DEK.CFC": true,
          "BRN.CFC": false,
          "CR.CFC": false,
          "CRS.CFC": false,
          "DET.CFC": false,
          "DPB.CFC": false,
          "FTN.CFC": false,
          "GEM.CFC": false,
          "IMM.CFC": false,
          "KAL.CFC": false,
          "PBF.CFC": true,
          "QUE.CFC": false,
          "SYND.CFC": false,
          "tenal_int": false,
          "TRIB.CFC": false,
          "VALE.CFC": false,
          "VNL.CFC": false,
          "EC_Gate.CFC": false,
          "MO_Gate.CFC": false,
          "P3_Gate.CFC": false
        }
      }
    }
  },

  build_ui: function() {
    return {
      logo: $('#top-logo'),
      alertContainer: $('#alert-container'),
      contentWrapper: $('#content-wrapper'),
      dim: $('#dim'),

      topMenu: $('#top-menu'),
      topMenu_clipboard: $('#top-menu-clipboard'),
      topMenu_logs: $('#top-menu-logs'),

      bottomMenu: $('#bottom-menu'),
      bottomMenu_spinner: $('#bottom-menu-spinner'),
      bottomMenu_menu: $('#bottom-menu-menu'),

      clipboard: $('#clipboard'),
      clipboard_list: $('#clipboard > .list'),
      logs: $('#logs'),
      logs_list: $('#logs > .list')
    }
  },

  build_templates: function() {
    return {
      alert: Templates.alert,
      event: Templates.event,
      panel: Templates.panel
    }
  },
};
