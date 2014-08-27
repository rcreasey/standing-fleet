var Util = {

	isShip: function (shipName) {
		return (typeof Data.ships[shipName] !== 'undefined' && Data.ships[shipName].icons !== undefined)
	},

	getShipType: function (shipName) {
		if (Util.isShip(shipName)){
			return Data.ships[shipName].icons[0];
		}
		return 'other';
	},

	getShipIcon: function (shipName) {
		var returnElement 	= $('<div/>');

		if (Util.isShip(shipName)){
			for (var i in Data.ships[shipName].class) {
				returnElement.append($('<img src="/images/ship-icons/ship-icon-' + Data.ships[shipName].icons[i] + '.gif" alt="" />'));
			}
		} else {
			returnElement.append($('<img src="/images/ship-icons/ship-icon-other.gif" alt="Ship type" />'));
		}

		return $('<div/>').append(returnElement).html();
	},

	getTime: function (ts) {
		var date = ts ? new Date(ts) : new Date();
		date = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));

		return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
	},

	escapeHTML: function (string) {
		return string.replace(/</gi,'&lt;').replace(/>/gi,'&gt;');
	},

	deepClone: function (object) {
		return JSON.parse(JSON.stringify(object));
	},

	getUrlKey: function () {
		var url = window.location.href,
			match = url.match(/[A-z0-9]{16}/);

		return match ? match[0] : false;
	},

	redirectToKeyUrl: function (armadaKey) {
		window.location = location.protocol
			+ '//' + location.hostname
			+ (location.port ? ':' + location.port : '')
			+ '/' + armadaKey + '/';
	},

	redirectToBasePath: function () {
		window.location = location.protocol
			+ '//' + location.hostname
			+ (location.port ? ':' + location.port : '')
			+ '/';
	},

	redirectIfNecessary: function (armadaKey, callback) {
		if (!!armadaKey !== !!Util.getUrlKey() || armadaKey !== Util.getUrlKey()) {
			UIPanels.showLoadingPanel('Redirecting to Standing Fleet URL...', function () {
				setTimeout($.proxy(Util.redirectToKeyUrl, null, armadaKey),
					Data.config.pollInterval);
			});
		} else {
			callback();
		}
	}
};

var UI = {

	dim: function(callback) {
		if (!Data.state.dimmed) {
			Data.ui.dim.fadeIn(Data.config.uiSpeed, callback);
		}
	},

	unDim: function(callback) {
		if (!Data.state.dimmed) {
			Data.ui.dim.fadeOut(Data.config.uiSpeed, callback);
		}

		return UI;
	},

	startSpin: function () {
		Data.ui.bottomMenu_spinner
			.fadeIn(Data.config.uiSpeed*4);
	},

	stopSpin: function () {
		Data.ui.bottomMenu_spinner
			.fadeOut(Data.config.uiSpeed*4);
	},

	registerEventHandlers: function () {
		Data.ui.topMenu_hud.on('click', $.proxy(UI.tabClick, null, "hud"));
		Data.ui.topMenu_map.on('click', $.proxy(UI.tabClick, null, "system-map"));
		Data.ui.topMenu_hostiles.on('click', $.proxy(UI.tabClick, null, "hostiles"));
		Data.ui.topMenu_members.on('click', $.proxy(UI.tabClick, null, "members"));
		Data.ui.topMenu_events.on('click', $.proxy(UI.tabClick, null, "events"));
		Data.ui.topMenu_scans.on('click', $.proxy(UI.tabClick, null, "scans"));

		Data.ui.bottomMenu_local.on('click', $.proxy(UIPanels.showStatusPanel, null, false));
		Data.ui.bottomMenu_scan.on('click', $.proxy(UIPanels.showScanPanel, null, false));
		Data.ui.bottomMenu_menu.on('click', $.proxy(UIPanels.showMenuPanel, null, false));

		Data.ui.statusClear.on('click', $.proxy(UI.submitStatusClear, null));
		Data.ui.statusHostile.on('click', $.proxy(UIPanels.showStatusPanel, null, false));

		Data.ui.hostiles_list.slimScroll({
    	height: 'auto',
    	color: '#ffcc2a',
    	alwaysVisible: true
		});
	},

	submitStatusClear: function() {
		submitStatus('clear', Data.state.self.name);
	},

	showAlert: function (event) {
		var alert = $(Data.templates.alert(event));

		alert.on('mouseover',function () {
			alert.stop(true, true);
		}).on('mouseout',function () {
			UI.idleAlert(alert);
		});

		Data.ui.alertContainer.append(alert);

		alert.fadeIn(Data.config.uiSpeed, function () {
			UI.idleAlert(alert);
		});
	},

	idleAlert: function (alert) {
		alert.delay(Data.config.alertStay)
			.fadeOut(Data.config.uiSpeed, function() {
				alert.remove();
			});
	},

	tabClick: function (tab) {
		if ($('#'+tab).hasClass('active')) return;

		$('#content-wrapper').fadeOut('fast',function(){
			$('.main-content.active, .menu-button.active ').removeClass('active');
			$('.menu-button.' + tab + ', #' + tab).addClass('active');
			$('.menu-button.' + tab).removeClass('blink');
			$('#content-wrapper').fadeIn('fast');
		});
	},

	blinkTab: function (tab) {
		if ($('#'+tab).hasClass('active')) return;
		$('.menu-button.' + tab).addClass('blink');
	},

	getLoadingText: function () {
		var msgs = [
			"Hull tanking",
			"EFT warrioring",
			"Smacktalking",
			"Shitpoasting",
			"Lemming'ing",
			"Clicking jump instead of bridge",
			"Overheating guns",
			"Bumping the titan",
			"Fitting a windicator",
			"Burning point",
			"Posting gudfites",
			"Z0r",
			"Whoring on the pod"
		];
		return msgs[Math.floor(Math.random()*msgs.length)] + "...";
	}
}

Handlebars.registerHelper('killboard_link', function(person, id) {
  name = Handlebars.Utils.escapeExpression(person);
  var result = '<a title="Killboard: ' + name + '" target="_blank" href="https://zkillboard.com/character/' + id + '/"><i class="fa fa-crosshairs" title="Killboard"></i></a>';

  return new Handlebars.SafeString(result);
});

var UIPanels = {

	substringMatcher: function(strs) {
	  return function findMatches(q, cb) {
	    var matches, substrRegex;
	    matches = [];
	    substrRegex = new RegExp(q, 'i');

	    $.each(strs, function(i, str) {
	      if (substrRegex.test(str)) matches.push({ value: str });
	    });

	    cb(matches);
	  };
	},

	showMenuPanel: function(callback) {
		var panel = {
			type: 'options',
			image: 'panel-settings.png',
			title: 'Standing Fleet Options',
			closeable: true,
			formitems: [
				{button: {legend: 'Fleet Actions', class: 'reload-armada no-margin', text: 'Reload Standing Fleet', onClick: 'location.reload()'}},
				{button: {class: 'leave-armada', text: 'Leave Standing Fleet', onClick: 'leaveArmada()'}},
				{input:  {legend: 'Fleet Key', label: 'Fleet Key', id: 'info-string-fleet-key', value: Data.state.armada.key, readonly: true}}
			]
		};

		if (Data.state.armada.password) panel.formitems.push( {input:  {legend: 'Fleet Password', label: 'Fleet Password', id: 'info-string-fleet-password',
																																		value: Data.state.armada.password, readonly: true}} );

		UIPanels.showPanel(panel, callback);
	},

	showJoinPanel: function (error, callback) {
		var panel = {
			type: 'start',
			title: '<img id="logo" src="/images/panel-logo.png" alt="Standing Fleet" />',
			formitems: [
				{button: {class: 'submit-create', text: 'Create Fleet', onClick: 'UIPanels.showCreatePanel()'}},
				{input:  {label: 'Fleet Key', id: 'join-fleet-key', class: 'armada-key'}},
				{submit: {class: 'submit-join', text: 'Join Fleet', onClick: 'joinArmadaButtonClick(this)'}},
				{button: {class: 'leave-armada', text: 'Leave Standing Fleet', onClick: 'leaveArmada()'}},
			],
			error: error
		};

		UIPanels.showPanel(panel, callback);
	},

	showCreatePanel: function (error, callback) {
		var panel = {
			type: 'create',
			title: '<img id="logo" src="/images/panel-logo.png" alt="Standing Fleet" />',
			formitems: [
				{input:  {label: 'Fleet Password', id: 'create-fleet-password', class: 'submit-key'}},
				{button: {class: 'submit-key', text: 'Create Fleet', onClick: 'createArmadaButtonClick(this)'}},
				{submit: {class: 'submit-join', text: '<i class="fa fa-arrow-circle-left"></i> Go Back', onClick: 'UIPanels.showJoinPanel()'}}
			],
	 		error: error
	 	};

	 	UIPanels.showPanel(panel, callback);
	},

	showPasswordPanel: function (error, callback) {
		var panel = {
			type: 'password',
			title: '<img id="logo" src="/images/panel-logo.png" alt="Standing Fleet" />',
			text: 'Authorization required.',
			formitems: [
				{input:  {label: 'Fleet Password', id: 'join-fleet-password', class: 'submit-key'}},
				{button: {class: 'submit-key', text: 'Join Fleet', onClick: 'submitPasswordButtonClick(this)'}},
				{submit: {class: 'submit-join', text: '<i class="fa fa-arrow-circle-left"></i> Cancel', onClick: 'UIPanels.redirectToBasePath()'}}
			],
	 		error: error
	 	};

	 	UIPanels.showPanel(panel, callback);
	},

	updateHostileDetailsPanel: function (hostileId) {
		var hostile = HostileList.findHostile(hostileId);

		var panel = {
			type: 'options',
			image: 'panel-options.png',
			title: hostile.name,
			text: 'Confirm details of hostile pilot:',
			formitems: [
				{input:  {hidden: true, id: 'hostile-key', value: hostile.key}},
				{input:  {hidden: true, id: 'hostile-id', value: hostile.id}},
				{input:  {hidden: true, id: 'hostile-name', value: hostile.name}},
				{input:  {label: 'Ship Type', id: 'hostile-ship-type', value: hostile.shipType} },
				{submit: {text: 'Update Details', onClick: 'submitHostileDetailsClick(this)'}}
			],
			closeable: true
		};

		UIPanels.showPanel(panel);

		$('#hostile-ship-type').typeahead({
		  hint: false,
		  highlight: true,
		  minLength: 1
		},
		{
		  name: 'ships',
		  displayKey: 'value',
		  source: UIPanels.substringMatcher($.map(Data.ships, function(s) { return s.name; }))
		});
	},

	showStatusPanel: function (callback) {
		var panel = {
			type: 'hostiles',
			image: 'panel-scan.png',
			title: Data.ui.currentSystem.text(),
			formitems: [
				{textinput:  {legend: 'Copy and paste pilots out of local below', id: 'status-data', class: 'status-data'}},
				{submit: {text: 'Update Status', onClick: 'submitStatusButtonClick(this)'}}
			],
			closeable: true
		};

		UIPanels.showPanel(panel, callback);
	},

	showScanPanel: function (callback) {
		var panel = {
			type: 'scan',
			image: 'panel-scan.png',
			title: Data.ui.currentSystem.text(),
			formitems: [
				{textinput:  {legend: 'Paste scan results below', id: 'scan-data', class: 'scan-data'}},
				{submit: {text: 'Send Scan', onClick: 'submitScanButtonClick(this)'}}
			],
			closeable: true
		};

		UIPanels.showPanel(panel, callback);
	},

	showPendingPanel: function (callback) {
		var panel = {
			type: 'pending',
			image: 'spinner.gif',
			text: 'Waiting for Standing Fleet to accept...',
			formitems: [
				{button: {text: 'Cancel', class: 'abort-pending', onClick: 'leaveArmadaButtonClick(this)'}}
			],
		};

		UIPanels.showPanel(panel, callback);
	},

	showLoadingPanel: function (text, callback) {
		var panel = {
			type: 'loading',
			title: text || UI.getLoadingText(),
			image: 'spinner.gif'
		};

		UIPanels.showPanel(panel, callback);
	},

	showPanel: function (params, callback) {
		var panelTemplate = Handlebars.compile($('#panelTemplate').html()),
			compiledPanel = $(panelTemplate(params));

		if (Data.ui.dim.children().length) {

			Data.ui.dim.children().remove();
			compiledPanel
				.css('display','none')
				.appendTo(Data.ui.dim)
				.fadeIn(Data.config.uiSpeed, function () {
					$(this).find('.textinput').focus().on('keydown', function (event) {
						if (event.keyCode == 13) {
							$(this).siblings('.submit-join, .submit-scan').click();
							return false;
						}
					});
					if (callback) callback();
				});

		} else {

			compiledPanel.appendTo(Data.ui.dim);
			UI.dim(function () {
				compiledPanel.find('.textinput').focus().on('keydown', function (event) {
					if (event.keyCode == 13) {
						$(this).siblings('.submit-join, .submit-scan').click();
						return false;
					}
				});
				if (callback) callback();
			});
		}
	},

	hidePanel: function (callback) {
		Data.ui.dim.children().remove();
		UI.unDim(callback);
	}

};

var Data = {

	members: [],
	hostiles: [],
	events: [],
	scans: [],

	config: {
		apiUrl: '/api',
		alertStay: 6000,
		pollInterval: 7000,
		maxEvents: 20,
		maxScans: 8,
		uiSpeed: 400,
		log: 'console'
	},

	state: {
		armada: {
			password: '',
			name: '',
			key: ''
		},
		self: {
			name: '',
			id: '',
			key: '',
			systemId: ''
		},
		alertCount: 0,
		dimmed: false,
		lastPollTs : Date.now(),
		memberSortOrder: {
			property: 'name',
			order: 'asc'
		},
		hostileSortOrder: {
			property: 'systemName',
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
		bottomMenu_menu: $('#bottom-menu-menu'),

		currentSystem: $('#current-system'),
		statusClear: $('#status-clear'),
		statusHostile: $('#status-hostile'),

		hud: $('#hud'),
		map: $('#system-map'),
		hostiles: $('#hostiles'),
		hostiles_list: $('#hostiles > .list'),
		members: $('#members'),
		events: $('#events'),
		scans: $('#scans')
	},

	templates: {
		hud: Handlebars.compile($('#hudTemplate').html()),
		hostile: Handlebars.compile($('#hostileTemplate').html()),
		member: Handlebars.compile($('#memberTemplate').html()),
		event: Handlebars.compile($('#eventTemplate').html()),
		alert: Handlebars.compile($('#alertTemplate').html()),
		scan: Handlebars.compile($('#scanTemplate').html())
	},

	ships: {},

	preload: function() {
		$.ajax({
			url: '/data/ships.json',
			dataType: 'json',

			success: function( data ) { Data.ships = data; },
			error: function(data, error, errorstring) {	if (error) console.log("Error: " + errorString); }
		});

		$.ajax({
			url: '/data/map.json',
			dataType: 'json',

			success: function( data ) {
				Data.regions = data.Regions;
				Data.systems = data.Systems;
				Data.gates   = data.Gates;
			},
			error: function(data, error, errorstring) {	if (error) console.log("Error: " + errorString); }
		});
	}
};

var Server = {

	ajaxGet: function(endpoint, callback) {
		$.ajax({

			url: Data.config.apiUrl + endpoint,
			dataType: 'json',

			success: function (data) {
				setTimeout(function () {
					if (data.success) {
						callback(null, data);
					} else {
						callback(data.error, null);
					}
				}, 1000);
			},

			error: function (data, error, errorString) {
				if (error) {
					callback({type: 'net', message: errorString}, null);
				}
			},

		});
	},

	ajaxPost: function(endpoint, data, callback) {
		$.ajax({
			type		: 'POST',
			data		: { scanData: data },
			url 		: Data.config.apiUrl + endpoint,
			dataType	: 'json',

			success		: function( data ){
				setTimeout(function () {
					if (data.success) {
						callback(null, data);
					} else {
						callback(data.error, null);
					}
				}, 1000);
			},
			error 		: function(data, error, errorString){
				if (error) {
					callback({type: 'error', message: errorString}, null);
				}
			}
		});
	},

	status: function (callback) {
		Server.ajaxGet('/status', callback);
		Data.state.lastPollTs = Date.now();
	},

	joinArmada: function (armadaKey, callback) {
		Server.ajaxGet('/join/' + armadaKey, callback);
	},

	joinArmadaWithPassword: function (armadaKey, armadaPassword, callback) {
		Server.ajaxGet('/join/' + armadaKey + '/' + armadaPassword, callback);
	},

	eventResponse: function (eventKey, response, callback) {
		Server.ajaxGet('/respond/' + eventKey + '/' + response, callback);
	},

	createArmada: function (armadaPassword, callback) {
		Server.ajaxGet('/create/' + armadaPassword, callback);
	},

	poll: function (callback) {
		Server.ajaxGet('/poll/' + Data.state.lastPollTs, function (error, data) {
			if (error) return callback(error);

			Data.state.lastPollTs = data.ts;
			callback(null, data);
		});
	},

	leaveArmada: function (callback) {
		Server.ajaxGet('/leave', callback);
	},

	postScan: function (scanData, callback) {
		Server.ajaxPost('/scan', scanData, callback);
	},

	postStatus: function(statusData, callback) {
		Server.ajaxPost('/status', statusData, callback);
	},

	postDetails: function(detailsData, callback) {
		Server.ajaxPost('/details', detailsData, callback);
	}
};

var SystemMap = {
  nodes: [],
  links: [],
  systems: [],
  jumps: [],
  _system_nodes: {},
  zoom: null,

  // let's count things
  hostile_count: function(system) {
    if (system == undefined) { return 0; }
    return (system.name !== undefined ) ? $.grep(Data.hostiles, function(h) { return system.name === h.systemName; }).length : 0
  },

  friendly_count: function(system) {
    if (system == undefined) { return 0; }
    return (system.name !== undefined ) ? $.grep(Data.members, function(h) { return system.name === h.systemName; }).length : 0
  },

  // Given a system, return the class that corresponds to whether a system is hostile or not.
  system_color: function(system) {
    if ( SystemMap.hostile_count(system) > 0 ) {
      return "hostile";
    } else if ( SystemMap.friendly_count(system) > 0 ) {
      return "clear";
    }
  },

  // Given a line AB and a point C, finds point D such that CD is perpendicular to AB
  getSpPoint: function(A, B, C) {
    var x1 = A.x, y1 = A.y, x2 = B.x, y2 = B.y, x3 = C.x, y3 = C.y;
    var px = x2 - x1, py = y2 - y1, dAB = px * px + py * py;
    var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    var x = x1 + u * px, y = y1 + u * py;
    return {x: x, y: y}; //this is D
  },

  // A square-root and division free line segment / circle intersection algorithm
  lineCircleIntersection: function(A, B, C, r) {
    var a, b, c, d;
    // Translate everything so that one line end is at [0,0]
    a = B.x - A.x;
    b = B.y - A.y;
    c = C.x - A.x;
    d = C.y - A.y;
    var rr = r * r;
    var cadb = c * a + d * b;
    var dacb = d * a - c * b;
    var a2b2 = a * a + b * b;

    if(dacb * dacb > (rr * a2b2)) {
      return false;
    }
    else if(c * c + d * d <= rr) {
      return true;
    }
    else if((a - c) * (a - c) + (b - d) * (b - d) <= rr) {
      return true;
    }
    return cadb >= 0 && cadb <= a2b2;
  },

  draw: function() {
    // Change this to globally adjust minimum node distance and system [x,y] scale
    const SCALING_FACTOR = 0.75;

    var svg = d3.select("#system-map")
      .attr("width", Data.ui.map.width())
      .attr("height", Data.ui.map.height())
      .append("svg");

    var rect_height = 17;
    var rect_width = 60;
    var link_distance = 25;
    var system;

    var force = d3.layout.force()
      .size([Data.ui.map.width(), Data.ui.map.height()])
      .charge(-250 * SCALING_FACTOR)
      .linkDistance(link_distance * SCALING_FACTOR)
      .on("tick", function() {

        SystemMap.systems.forEach(function(systemNode) {
          SystemMap.jumps.forEach(function(jump) {
            // Push each node away from any lines passing within r=20 units of its center.
            // This is implemented as a weak repulsive force that scales with r but not with
            // the layout's stabilisation factor.
            // This causes the repulsion to only minimally affect the overall map layout,
            // but as the layout stabilises nodes gently slip away from jump lines intersecting
            // their center.
            if(jump.source === systemNode || jump.target === systemNode) {
              return;
            }
            const r = 20;
            if(!SystemMap.lineCircleIntersection(jump.source, jump.target, systemNode, r)) {
              return;
            }
            var dx, dy, dn, k;
            var p = SystemMap.getSpPoint(jump.source, jump.target, systemNode);
            dx = systemNode.x - p.x;
            dy = systemNode.y - p.y;
            dn = Math.max(1000, dx * dx + dy * dy);
            k = -100 / dn;
            systemNode.x -= dx * k * 0.15;
            systemNode.y -= dy * k * 0.15;
          });
        });
      })
      .on("end", function(){

        $('#current-system')
          .data('systemId', system.id)
          .text( system.name );

        SystemMap.updateHud( system.name );

        var link_groups = link.data(SystemMap.jumps)
          .enter().append("g")
          .attr("class", "link")
          .append("line");

        var node_groups = node.data(SystemMap.systems)
          .enter().append("g")
          .attr("id", function(n) { return "system-" + n.system.id })
          .attr("class", function(n) {
            return (n.system.id === +Data.state.self.systemId ) ? "current node" : "node";
          });

        node_groups.append("rect")
          .attr("width", rect_width)
          .attr("height", rect_height)
          .attr("rx", 2).attr("ry", 2)
          .attr("class", function(n) { return 'status-' + SystemMap.system_color(n.system); });

        node_groups.append("text")
          .attr("class", "system-name")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .attr("x", rect_width / 2)
          .attr("y", 10)
          .text(function(d) { return d.system.name; });

        link_groups.attr("x1", function(d) {return d.source.x;})
          .attr("y1", function(d) {return d.source.y;})
          .attr("x2", function(d) {return d.target.x;})
          .attr("y2", function(d) {return d.target.y;});

        node_groups.attr("transform", function(d) {
          return "translate(" + (d.x - rect_width / 2) + "," + (d.y - rect_height / 2) + ")";
        });
      });

    var scale = 1;
    if( SystemMap.zoom ) scale = SystemMap.zoom.scale();

    SystemMap.zoom = d3.behavior.zoom()
      .scaleExtent([0.4, 1])
      .on("zoom", zoomHandler)
      .scale(scale);

    var root = svg.append("g");

    function zoomHandler() {
      root.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    SystemMap.zoom(d3.select("#system-map"));

    var link = root.selectAll(".link"),
      node = root.selectAll(".node");

    // fetch data about our current system
    system = Data.systems[ Data.state.self.systemId ];

    SystemMap.systems = [];
    SystemMap.nodes = [];
    SystemMap.jumps = [];
    SystemMap.links = [];

    var nodes = SystemMap._system_nodes = {};

    // Only draw systems that are in our current region
    SystemMap.systems = $.map(Data.systems, function(s) {
      if (system && (s.regionID === system.regionID)) {
        var node = { system: s, x: s.x, y: s.y };
        nodes[s.id] = node;
        return node;
      }
    });

    Data.gates.forEach(function(gate) {
      var jump, node;
      var from = Data.systems[gate.from];
      var to = Data.systems[gate.to];
      if(from.regionID == system.regionID || to.regionID == system.regionID) {
        if(from.regionID != system.regionID && !nodes.hasOwnProperty(from.id)) {
          node = { system: from, x: from.x, y: from.y };
          nodes[from.id] = node;
          SystemMap.systems.push(node);
        }
        if( to.regionID != system.regionID && !nodes.hasOwnProperty(to.id)) {
          node = { system: to, x: to.x, y: to.y };
          nodes[to.id] = node;
          SystemMap.systems.push(node);
        }
        SystemMap.jumps.push(jump = {source: nodes[from.id], target: nodes[to.id]});
        SystemMap.links.push(jump);
      }
    });

    SystemMap.systems.forEach(function (system) {
      var anchor;
      system.x *= SCALING_FACTOR;
      system.y *= SCALING_FACTOR;
      SystemMap.nodes.push(system);
      SystemMap.nodes.push(anchor = { x: system.x, y: system.y, fixed: true });
      SystemMap.links.push({ source: system, target: anchor });
    });

    force
      .nodes(SystemMap.nodes)
      .links(SystemMap.links)
      .gravity(0)
      .charge(function(d) {return d.fixed ? 0 : -1250 * SCALING_FACTOR;})
      .chargeDistance(200 * SCALING_FACTOR)
      .linkDistance(function(l) {
        if(l.source.fixed || l.target.fixed) {
          return 0;
        }
        var dx = l.source.x - l.target.x, dy = l.source.y - l.target.y;
        return Math.min(50 * SCALING_FACTOR, Math.sqrt(dx * dx + dy * dy));
      })
      .linkStrength(function(l) {
        if(l.source.fixed || l.target.fixed) {
          return 0.1;
        }
        return 0.25;
      });
    force.start();
    while( force.alpha() > 0.01 ) {
      force.tick();
    }
    force.stop();

    SystemMap.zoom.translate([(Data.ui.map.width() / 2 - nodes[system.id].x * scale), (Data.ui.map.height() / 2 - nodes[system.id].y * scale)]);
    SystemMap.zoom.event(root);
  },

  updateHud: function(system_name) {
    var system = {name: system_name}
    system.neighbors = $.map(SystemMap.links, function(n) {
      if (n.target.system && n.target.system.name === system_name) {
        n.source.hostiles = SystemMap.hostile_count(n.source.system);
        return n.source;
      }
      if (n.source.system && n.source.system.name === system_name) {
        n.target.hostiles = SystemMap.hostile_count(n.target.system);
        return n.target;
      }
    });

    system.status = (system.neighbors.filter(function(n) { return n.hostiles > 0 }).length) ? 'warning' : SystemMap.system_color(system);

    Data.ui.hud.html( Data.templates.hud(system) );
  },

  updateCurrent: function() {
    d3.selectAll('g.node')
      .attr("class", function(n) {
        return (n.system.id === +Data.state.self.systemId ) ? "current node" : "node";
      });

    var node = SystemMap._system_nodes[Data.state.self.systemId];
    var scale = SystemMap.zoom.scale();

    SystemMap.zoom.translate([(Data.ui.map.width() / 2 - node.x * scale), (Data.ui.map.height() / 2 - node.y * scale)]);
    SystemMap.zoom.event(d3.select('#system-map'));

    Data.ui.currentSystem
      .data('system-id', Data.state.self.systemId)
      .text( $('.current text').text() );

    SystemMap.updateHud( $('#current-system').text() );
  },

  refreshSystems: function() {
    d3.selectAll('g.node rect')
      .attr("class", function(n) { return 'status-' + SystemMap.system_color(n.system); });

    SystemMap.updateHud( $('#current-system').text() );
  },

  redraw: function() {
    log("Redrawing System Map...");
    $("#system-map > svg").remove();
    SystemMap.draw();
    SystemMap.updateHud( $('#current-system').text() );
  },

  init: function() {
    log("Initializing System Map...");
    SystemMap.draw();
    SystemMap.updateCurrent();
  }

};

var MemberList = {

	clear: function () {
		log('Clearing member list...');
		Data.members = [];
		Data.ui.members.empty();
	},

	addMember: function (memberToAdd) {
		log('Adding member: ' + memberToAdd.name + '...');
		MemberList.removeMember(memberToAdd.id);
		Data.members.push(memberToAdd);
	},

	removeMember: function (memberToRemoveId) {
		var memberToRemove = MemberList.findMember(memberToRemoveId);
		if (memberToRemove) {
			log('Removing member: ' + memberToRemove.name + '...');
			Data.members.splice(Data.members.indexOf(memberToRemove), 1);
		}
	},

	findMember: function (memberId) {
		for (var index in Data.members) {
			if (Data.members[index].id === memberId) return Data.members[index];
		}
		return false;
	},

	findMemberElement: function (memberId) {
		var foundMemberElement = Data.ui.members.find('.member-' + memberId);
		return foundMemberElement || false;
	},

	renderSingleMember: function (member) {
		log('Rendering member: ' + member.name + ' (single)...');
		MemberList.addUiProperties(member);
		var existingMemberElement = Data.ui.members.find('#member-' + member.id);
		if (existingMemberElement.length) {
			existingMemberElement.after($(member.html)).remove();
		} else {
			Data.ui.members.append($(member.html));
		}
	},

	sortAndRenderAll: function () {
		log('Sorting and rendering all members...');

		Data.members.sort(function (member1, member2) {
			if (member1[Data.state.memberSortOrder.property] < member2[Data.state.memberSortOrder.property]) {
				return Data.state.memberSortOrder.order === 'asc' ? -1 : 1;
			} if (member1[Data.state.memberSortOrder.property] > member2[Data.state.memberSortOrder.property]) {
				return Data.state.memberSortOrder.order === 'asc' ? 1 : -1;
			} else {
				return 0;
			}
		});

		Data.ui.members.empty();
		Data.members.forEach(function (member) {
			log('Rendering member: ' + member.name + ' (batch)...');
			MemberList.addUiProperties(member);
			Data.ui.members.append($(member.html));
		});
	},

	addUiProperties: function (member) {
		member.shipIcon = Util.getShipIcon(member.shipType);
		member.html = Data.templates.member(member);
	}
};
var HostileList = {

  clear: function () {
    log('Clearing hostile list...');
    Data.hostiles = [];
    Data.ui.hostiles_list.empty();
  },

  clearBySystem: function (systemId) {
    log('Clearing system ' + systemId);
    Data.hostiles = $.map(Data.hostiles, function(h) { return h.systemId !== systemId ? h : null; });
    Data.ui.hostiles_list.empty();
  },

  addHostile: function (hostileToAdd) {
    log('Adding hostile: ' + hostileToAdd.name + '...');
    HostileList.removeHostile(hostileToAdd.id);
    Data.hostiles.push(hostileToAdd);
  },

  removeHostile: function (hostileToRemoveId) {
    var hostileToRemove = HostileList.findHostile(hostileToRemoveId);
    if (hostileToRemove) {
      log('Removing hostile: ' + hostileToRemove.name + '...');
      Data.hostiles.splice(Data.hostiles.indexOf(hostileToRemove), 1);
    }
  },

  findHostile: function (hostileId) {
    for (var index in Data.hostiles) {
      if (Data.hostiles[index].id === hostileId) return Data.hostiles[index];
    }
    return false;
  },

  findHostileElement: function (hostileId) {
    var foundHostileElement = Data.ui.hostiles_list.find('.hostile-' + hostileId);
    return foundHostileElement || false;
  },

  renderSingleHostile: function (hostile) {
    log('Rendering hostile: ' + hostile.name + ' (single)...');
    HostileList.addUiProperties(hostile);
    var existingHostileElement = Data.ui.hostiles_list.find('#hostile-' + hostile.id);
    if (existingHostileElement.length) {
      existingHostileElement.after($(hostile.html)).remove();
    } else {
      Data.ui.hostiles_list.append($(hostile.html));
    }
  },

  sortAndRenderAll: function () {
    log('Sorting and rendering all hostiles...');

    Data.hostiles.sort(function (hostile1, hostile2) {
      if (hostile1[Data.state.hostileSortOrder.property] < hostile2[Data.state.hostileSortOrder.property]) {
        return Data.state.hostileSortOrder.order === 'asc' ? -1 : 1;
      } if (hostile1[Data.state.hostileSortOrder.property] > hostile2[Data.state.hostileSortOrder.property]) {
        return Data.state.hostileSortOrder.order === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });

    Data.ui.hostiles_list.empty();
    Data.hostiles.forEach(function (hostile) {
      log('Rendering hostile: ' + hostile.name + ' (batch)...');
      HostileList.addUiProperties(hostile);
      Data.ui.hostiles_list.append($(hostile.html));
    });
  },

  addUiProperties: function (hostile) {
    hostile.reported_at = moment(hostile.ts).utc().format('HH:mm:ss')
    hostile.shipIcon = Util.getShipIcon(hostile.shipType);
    hostile.html = Data.templates.hostile(hostile);
  }
};

var EventList = {

	clear: function () {
		log('Clearing event list...');
		Data.events = [];
		Data.ui.events.empty();
	},

	addEvent: function (event) {
		if (event.alert) UI.showAlert(event);
		if (event.blink) UI.blinkTab(event.blink);

		EventList.preParse(event);
		Data.events.unshift(event);

		if (Data.events.length > Data.config.maxEvents) {
			Data.ui.events.children().last().remove();
			Data.events.pop();
		}

		EventList.renderEvent(event);
	},

	renderEvent: function (event) {
		var eventElement = $(Data.templates.event(event)),
			existingElement = Data.ui.events.find('.' + event.id);

		if (existingElement.length) {
			eventElement.insertAfter(existingElement);
		} else {
			Data.ui.events.prepend(
				$(Data.templates.event(event))
			);
		}
	},

	handleEvent: function (event) {
		if (event.type === 'memberjoined') {
			// foo

		} else if (event.type === 'memberleft') {
			MemberList.sortAndRenderAll();
		}
	},

	disableResponse: function (eventKey) {
		Data.ui.events.children().each(function () {
			if ($(this).data('key') === eventKey) {
				$(this).find('.response').remove();
			}
		});
	},

	preParse: function (event) {
		if (!event.id) event.id = 'internal-' + Math.floor(Math.random() * 10000)
		event.time = Util.getTime();
	},

	sort: function () {
		Data.events.sort(function (event1, event2) {
			if (event1.time > event2.time) return -1;
			if (event1.time < event2.time) return 1;
			return 0;
		});
	},

	eventResponseClick: function (key, response) {
		Server.eventResponse(key, response, function (error, data) {
			if (error) return handleError(error);

			EventList.disableResponse(key);

			UI.showAlert({
				type: 'info',
				text: 'Your response has been registered'
			});
		});
	},

	alertClick: function (type, id) {
		if (type === 'foo') {
			UI.tabClick('events');
		}
	}
};

var ScanList = {

	clear: function () {
		log('Clearing scan list...');
		Data.scans = [];
		Data.ui.scans.empty();
	},

  addStatus: function(reported_status, pilots) {
		var status = {systemId: Data.ui.currentSystem.data('systemId')
					      , systemName: Data.ui.currentSystem.text(), pilots: []
			      		, reporterId: Data.state.self.id
			      		, reporterName: Data.state.self.name
			      		, pilots: ScanList.parseLocal(pilots)};

		if (reported_status) status.text = reported_status;
		return status;
	},

	addScan: function (scan) {
		scan.time = Util.getTime(scan.ts);
		Data.scans.push(scan);

		if (Data.scans.length > Data.config.maxScans) {
			Data.ui.scans.children().last().remove();
			Data.scans.pop();
		}

		ScanList.renderScan(scan);
	},

	renderScan: function (scan) {
		var element = $(Data.templates.scan(scan));
		Data.ui.scans.prepend(element);
	},

	toggleCollapse: function (element) {
		var $element = $(element);

		if ($element.hasClass('active')) {
			$element.siblings('.collapsible').hide();
			$element.removeClass('active');
		} else {
			$element.siblings('.collapsible').show();
			$element.addClass('active');
		}

		return UI;
	},

	parse: function (rawScanData) {
		var inputRows = rawScanData.split(/\r\n|\r|\n/g)
		var parsedScanData = {classes: [], types: []};

		for (var inputRowIndex in inputRows) {
			var inputRowArray = inputRows[inputRowIndex].split(/\t/g);

			var distance = inputRowArray.pop(),
				shipType = inputRowArray.pop(),
				shipName = inputRowArray.join(' ');

			if (!Util.isShip(shipType)) continue;

			var shipTypeContainer  = ScanList.getShipTypeContainer(shipType, parsedScanData);
			var shipClassContainer = ScanList.getShipClassContainer(shipType, parsedScanData);

			shipTypeContainer.count++;
			shipTypeContainer.details.push({ distance: distance, shipClass: shipType, shipName: shipName });

			shipClassContainer.count++;
			shipClassContainer.details.push({ distance: distance, shipClass: shipType, shipName: shipName });
		}

		parsedScanData.types.sort(ScanList.scanDataSorter);
		parsedScanData.classes.sort(ScanList.scanDataSorter);

		return parsedScanData;
	},

	parseLocal: function (local) {
		var parsedLocal = [];

		if (local) {
			local.split("\n").forEach(function (pilot) {
				if (pilot.length > 0) parsedLocal.push(pilot);
			});
		}

		return parsedLocal;
	},

	getShipTypeContainer: function (shipType, parsedScanData) {
		var foundShipTypeContainer = false;

		parsedScanData.types.forEach(function (shipTypeContainer) {
			if (shipTypeContainer.shipType === shipType) {
				foundShipTypeContainer = shipTypeContainer;
			}
		});

		return foundShipTypeContainer || ScanList.addShipTypeContainer(shipType, parsedScanData);
	},

	addShipTypeContainer: function (shipType, parsedScanData) {

		var shipTypeContainer = {
			shipType: shipType,
			count: 0,
			details: []
		};

		parsedScanData.types.push(shipTypeContainer);

		return shipTypeContainer;
	},

	getShipClassContainer: function (shipType, parsedScanData) {
		var foundShipClassContainer = false;

		parsedScanData.classes.forEach(function (shipClassContainer) {
			if (shipClassContainer.shipClass === Data.ships[shipType].class[0]) {
				foundShipClassContainer = shipClassContainer;
			}
		});

		return foundShipClassContainer || ScanList.addShipClassContainer(shipType, parsedScanData);
	},

	addShipClassContainer: function (shipType, parsedScanData) {

		var shipClassContainer = {
			shipClass: Data.ships[shipType].class[0],
			count: 0,
			details: []
		};

		parsedScanData.classes.push(shipClassContainer);

		return shipClassContainer;
	},

	scanDataSorter: function (shipType1, shipType2) {
		if (shipType1.count === shipType2.count) return 10;
		else if (shipType1.count < shipType2.count) return 1;
		else return -1;
	}

}

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
		SystemMap.refreshSystems();
	},

	memberTimedOut: function (member) {
		log('Adding member: ' + member.name + '...');
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
		Data.state.self.regionId = Data.systems[self.systemId].regionID;
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

$(function () {
	UI.registerEventHandlers();
	initialize();
});

function initialize() {
	log('Init...');

	stopPolling();

	MemberList.clear();
	HostileList.clear();
	EventList.clear();
	ScanList.clear();

	Data.preload();

	UIPanels.showLoadingPanel(false, function () {
		Server.status(function(error, data) {
			if (error) {
				handleError(error);
				UIPanels.showJoinPanel(error);

				if (error.type === 'trust') {
					CCPEVE.requestTrust(location.protocol + '//' + location.hostname);
				}

				return;
			}

			EventHandler.dispatchEvents(data.events);

			if (Data.state.armada.key) {
				EventList.addEvent({ type: 'youJoined', text: 'You opened this standing fleet', alert: false });

				Util.redirectIfNecessary(Data.state.armada.key, function () {
					UIPanels.hidePanel(pollLoop);
				});

			} else {
				if (Util.getUrlKey()) {
					joinArmada(Util.getUrlKey());
				} else {
					UIPanels.showJoinPanel();
				}
			}
		});
	})
}

function createArmadaButtonClick(button) {
	var armadaPassword = $('#create-fleet-password').val();
	createArmada(armadaPassword);
}

function createArmada(armadaPassword) {
	UIPanels.showLoadingPanel('Creating new armada...', function () {
		Server.createArmada(armadaPassword, function(error, data) {
			if (error) {
				UIPanels.showCreatePanel(error);
				return;
			}

			initialize();
		});
	});
}

function joinArmadaButtonClick(button) {
	var armadaKey = $('#join-fleet-key').val();
	joinArmada(armadaKey);
}

function joinArmada(armadaKey) {
	UIPanels.showLoadingPanel('Searching for fleet...', function () {
		Server.joinArmada(armadaKey, function(error, data) {
			Data.state.armada.key = armadaKey;
			if (error) {
				if (error.type === 'password') UIPanels.showPasswordPanel();
				else UIPanels.showJoinPanel(error);
				return;
			}

			initialize();
		});
	});
}

function submitPasswordButtonClick(button) {
	var armadaPassword = $('#join-fleet-password').val();
	submitPassword(armadaPassword);
}

function submitPassword(armadaPassword) {
	var armadaKey = Util.getUrlKey();
	if (!armadaKey) armadaKey = Data.state.armada.key;

	UIPanels.showLoadingPanel('Authenticating...', function () {
		Server.joinArmadaWithPassword(armadaKey, armadaPassword, function (error, data) {
			if (error) {
				if (error.type === 'password') UIPanels.showPasswordPanel(error);
				else UIPanels.showJoinPanel(error);
				return;
			}

			initialize();
		});
	});
}

function submitScanButtonClick(button) {
	var scanData = $('#scan-data').val();
	submitScan(scanData);
}

function submitScan(scanData) {
	UIPanels.showLoadingPanel('Uploading scan...', function () {
		var parsedScanData = ScanList.parse(scanData);

		Server.postScan(parsedScanData, function(error, data) {
			UIPanels.hidePanel(function () {
				if (error) {
					handleError(error);
					return;
				}

				EventList.addEvent({ type: 'info', text: 'Scan was uploaded...', alert: true });
			});
		});
	});
}

function scanFilter(button, filter) {
	var results = $(button).closest('.scan').find('.type-classes .result')
	$(button).closest('ul').find('.btn').removeClass('active');
	results.removeClass('selected');

	$(button).addClass('active');
	$.each(results, function(i, result) {
		if ($(result).find('.details-container .distance:contains("-")').length) {
			if (filter === 'offgrid') $(result).addClass('selected');
		} else {
			if (filter === 'grid') $(result).addClass('selected');
		}
	})
}

function submitStatusButtonClick(button) {
	var scanData = $('#status-data').val();
	submitStatus("validate", scanData);
}

function submitStatus(reported_status, pilots) {
	UIPanels.showLoadingPanel('Uploading status...', function () {
		var status = ScanList.addStatus(reported_status, pilots);

		Server.postStatus(status, function(error, data) {
			UIPanels.hidePanel(function () {
				if (error) {
					handleError(error);
					return;
				}

				EventList.addEvent({ type: 'info', class: status.text,
														 text: 'Status was reported on <strong>' +
        													 '<a href="javascript:CCPEVE.showInfo(5, ' + status.systemId + ')">' +
																	 status.systemName + '</a> by you.' });
			});
		});
	});
}

function submitHostileDetailsClick(button) {
	var key = $('#hostile-key').val();
	var id = $('#hostile-id').val();
	var name = $('#hostile-name').val();
	var shipType = $('#hostile-ship-type').val();
	var shipName = $('#hostile-ship-name').val();

	submitHostileDetails(key, id, name, shipType, shipName);
}

function submitHostileDetails(key, id, name, shipType, shipName) {
	UIPanels.showLoadingPanel('Uploading status...', function () {
		var details = {type: 'hostile', key: key, id: id, name: name, shipType: shipType, shipName: shipName};

		Server.postDetails(details, function(error, data) {
			UIPanels.hidePanel(function () {
				if (error) {
					handleError(error);
					return;
				}

				EventList.addEvent({ type: 'info', class: status.text,
														text: 'Details were reported on <strong>' +
																	'<a href="javascript:CCPEVE.showInfo(1377, ' + details.id + ')">' +
																	details.name + '</a> by you.' });
			});
		});
	});
}

function leaveArmada() {
	UIPanels.showLoadingPanel('Leaving Standing Fleet...', function () {
		Server.leaveArmada(function(error, data) {
			if (error) {
				handleError(error);
				UIPanels.hidePanel();
				return;
			}

			Util.redirectToBasePath();
		});
	});
}

function pollLoop() {
	UI.startSpin();
	Data.state.pollLoop = setTimeout(function() {
		Server.poll(function (error, data) {
			if (error) return handleError(error);

			EventHandler.dispatchEvents(data.events);
			UI.stopSpin();
		});

		pollLoop();
	}, Data.config.pollInterval);
}

function stopPolling() {
	clearTimeout(Data.state.pollLoop);
}

function handleError (error) {
	log(error.message);
	if (error.stopPoll) Data.poll = false;
	if (error.message) UI.showAlert({
		type: 'error',
		text: error.message
	});
}

function log(message) {
	if (!Data.config.log) return;

	if (Data.config.log === 'events') {
		EventList.addEvent({
			type: 'info',
			text: message
		});

	} else if (Data.config.log === 'console') {
		console.log('[' + Date.now() + '] - ' + message)
	}
}
