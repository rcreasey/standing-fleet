var Data = {
  config: {
    domain: 'https://standing-fleet.herokuapp.com/',
    apiUrl: '/api',
    alertStay: 5000,
    maxEvents: 20,
    uiSpeed: 400,
    log: 'console'
  },

  state: {
    alertCount: 0,
    dimmed: false,
    pollLoop: 0
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
      panel: Templates.panel,
    }
  },
};
