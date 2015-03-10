var SystemMap = {
  nodes: [],
  links: [],
  systems: [],
  jumps: [],
  zoom: null,

  // let's count things
  hostile_count: function(system) {
    if (system === null) { return 0; }
    return (system.name !== undefined ) ? $.grep(Data.hostiles, function(h) { return system.name === h.systemName && h.is_faded === false; }).length : 0;
  },

  faded_count: function(system) {
    if (system === null) { return 0; }
    return (system.name !== undefined ) ? $.grep(Data.hostiles, function(h) { return system.name === h.systemName && h.is_faded === true; }).length : 0;
  },

  friendly_count: function(system) {
    if (system === null) { return 0; }
    return (system.name !== undefined ) ? $.grep(Data.members, function(m) { return system.name === m.systemName; }).length : 0;
  },

  advisory_count: function(system) {
    if (system === null) { return 0; }
    return (Data.advisories[system.id] instanceof Array) ? Data.advisories[system.id].length : 0;
  },

  // Given a system, return the class that corresponds to whether a system is hostile or not.
  system_color: function(system) {
    if ( SystemMap.hostile_count(system) > 0 ) {
      return 'hostile';
    } else if ( SystemMap.faded_count(system) > 0 ) {
      return 'warning';
    } else if ( SystemMap.advisory_count(system) > 0 ) {
      return 'warning';
    } else if ( SystemMap.friendly_count(system) > 0 ) {
      return 'clear';
    } else {
      return 'unknown';
    }
  },

  // Determines class list for a system
  system_classes: function(system) {
    var classes = ['system'];
    classes.push('status-' + SystemMap.system_color(system));
    if (system.id === Data.state.vicinity.systemId ) classes.push('current');
    return classes.join(' ');
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

  collide: function(alpha) {
    var quadtree = d3.geom.quadtree(SystemMap.nodes);
    return function(d) {
      var rb = 20,
          nx1 = d.x - rb,
          nx2 = d.x + rb,
          ny1 = d.y - rb,
          ny2 = d.y + rb;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y);
            if (l < rb) {
            l = (l - rb) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  },
  
  draw: function() {
    // Change this to globally adjust minimum node distance and system [x,y] scale
    var SCALING_FACTOR = 0.95;

    // Clear existing map
    d3.select('#system-map svg').remove();

    // Construct current map
    var svg = d3.select('#system-map')
      .attr('width', Data.ui.map.width())
      .attr('height', Data.ui.map.height())
      .append('svg');

    var rect_height = 17;
    var rect_width = 60;
    var link_distance = 25;
    var system;

    var force = d3.layout.force()
      .size([Data.ui.map.width(), Data.ui.map.height()])
      .charge(-250 * SCALING_FACTOR)
      .linkDistance(link_distance * SCALING_FACTOR)
      .on('tick', function() {

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
            var r = 20;
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
        
        SystemMap.nodes.forEach(SystemMap.collide(0.5));
      })
      .on('end', function(){

        Data.ui.currentSystem
          .data('systemId', system.id)
          .text( system.name );

        Data.ui.currentRegion
          .data('regionId', system.regionID)
          .text( Data.regions[ system.regionID ].name );

        SystemMap.updateHud( system );
        
        var path_groups = link.data( $.grep(SystemMap.jumps, function(l) { return l.type == 'jumpbridge'}))
          .enter().append('g')
          .attr('class', function(j) { return 'link ' + j.type; })
          .append('path')
          
        var link_groups = link.data( $.grep(SystemMap.jumps, function(l) { return l.type != 'jumpbridge'}))
          .enter().append('g')
          .attr('class', function(j) { return 'link ' + j.type; })
          .append('line');

        var node_groups = node.data(SystemMap.systems)
          .enter().append('g')
          .attr('id', function(n) { return 'system-' + n.system.id; })
          .attr('class', 'node');

        node_groups.append('rect')
          .attr('class', function(n) {
            return (SystemMap.hostile_count(n.system) > 0) ? 'hostiles present' : 'hostiles vacant';
          })
          .attr('width', function(n) {
            return (SystemMap.hostile_count(n.system) > 9) ? 27 : 20;
          })
          .attr('height', rect_height)
          .attr('rx', 2).attr('ry', 2)
          .attr('y', 16);

        node_groups.append('text')
          .attr('class', 'hostiles')
          .attr('text-anchor', 'center')
          .attr('alignment-baseline', 'center')
          .attr('vector-effect', 'non-scaling-stroke')
          .attr('x', 7).attr('y', 29)
          .text(function(n) {
            var count = SystemMap.hostile_count(n.system);
            return (count > 0) ? count : '';
          });

        node_groups.append('rect')
          .attr('class', function(n) {
            return (n.system.wormhole_class) ? 'wormhole-class class-' + n.system.wormhole_class :
              (n.system.security > 0) ? 'security-class class-' + parseInt(n.system.security * 10) : 'security-class vacant';
          })
          .attr('width', 20)
          .attr('height', rect_height)
          .attr('rx', 2).attr('ry', 2)
          .attr('x', rect_width / 3).attr('y', 16);

        node_groups.append('text')
          .attr('class', function(n) {
            return (n.system.wormhole_class) ? 'wormhole-class class-' + n.system.wormhole_class :
              (n.system.security > 0) ? 'security-class class-' + parseInt(n.system.security * 10) : 'security-class';
          })
          .attr('text-anchor', 'center')
          .attr('alignment-baseline', 'center')
          .attr('vector-effect', 'non-scaling-stroke')
          .attr('x', function(n) {
            if (n.system.wormhole_class && n.system.wormhole_class > 9) {
              return rect_width / 2.85;
            } else {
              return rect_width / 2.5;              
            }
          })
          .attr('y', 29)
          .text(function(n) {
            return (n.system.wormhole_class) ? 'C' + n.system.wormhole_class :
              (n.system.security > 0) ? n.system.security.toFixed(1) : '';
          });

        node_groups.append('rect')
          .attr('class', function(n) {
            return (SystemMap.faded_count(n.system) > 0) ? 'faded present' : 'faded vacant';
          })
          .attr('width', function(n) {
            return (SystemMap.faded_count(n.system) > 9) ? 27 : 20;
          })
          .attr('height', rect_height)
          .attr('rx', 2).attr('ry', 2)
          .attr('x', rect_width - 20).attr('y', 16);

        node_groups.append('text')
          .attr('class', 'faded')
          .attr('text-anchor', 'center')
          .attr('alignment-baseline', 'center')
          .attr('vector-effect', 'non-scaling-stroke')
          .attr('x', 47).attr('y', 29)
          .text(function(n) {
            var count = SystemMap.faded_count(n.system);
            return (count > 0) ? count : '';
          });

        node_groups.append('rect')
          .attr('width', rect_width)
          .attr('height', rect_height)
          .attr('y', rect_height * -1)
          .attr('rx', 2).attr('ry', 2)
          .attr('class', function(n) {
            return (SystemMap.advisory_count(n.system) > 0) ? 'advisories present' : 'advisories vacant ';
          });

        node_groups.append('text')
          .attr('class', 'advisories')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('x', rect_width / 2).attr('y', rect_height * -0.5)
          .text(function(n) {
            return UI.mapUnicode(n.system.id, Data.advisories[n.system.id] );
          });

        node_groups.append('rect')
          .attr('width', rect_width)
          .attr('height', rect_height)
          .attr('rx', 2).attr('ry', 2)
          .attr('class', function(n) { return SystemMap.system_classes(n.system); });

        node_groups.append('text')
          .attr('class', 'system-name')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('x', rect_width / 2)
          .attr('y', 10)
          .text(function(n) { return n.system.name; });

        node_groups.on('click', function(n) {
          SystemMap.updateInfo( n.system.name );
        });

        link_groups.attr('x1', function(d) {return d.source.x;})
          .attr('y1', function(d) {return d.source.y;})
          .attr('x2', function(d) {return d.target.x;})
          .attr('y2', function(d) {return d.target.y;});

        link_groups.filter(function(l) { return l.type == 'wormhole'; }).on('click', function(l) {
          SystemMap.updateWormholeJump( l );
        });

        path_groups.filter(function(l) { return l.type == 'jumpbridge'; }).on('click', function(l) {
          SystemMap.showJumpbridgeInfo( l );
        });
        
        path_groups.attr('d', function(d) {
          var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });

        node_groups.attr('transform', function(d) {
          return 'translate(' + (d.x - rect_width / 2) + ',' + (d.y - rect_height / 2) + ')';
        });
      });

    var scale = 1;
    if( SystemMap.zoom ) scale = SystemMap.zoom.scale();

    SystemMap.zoom = d3.behavior.zoom()
      .scaleExtent([0.4, 1])
      .on('zoom', zoomHandler)
      .scale(scale);

    var root = svg.append('g');

    function zoomHandler() {
      root.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    }

    SystemMap.zoom(d3.select('#system-map'));

    var link = root.selectAll('.link'),
      node = root.selectAll('.node');

    // fetch data about our current system
    if (!Data.systems) return;
    system = Data.systems[ Data.state.vicinity.systemId ];

    SystemMap.systems = [];
    SystemMap.nodes = [];
    SystemMap.jumps = [];
    SystemMap.links = [];

    var nodes = {};

    SystemMap.systems = $.map(Data.systems, function(s) {
      var node = { system: s, x: s.x, y: s.y };
      nodes[s.id] = node;
      return node;
    });

    Data.jumps.forEach(function(gate) {
      var jump, node;
      var from = Data.systems[gate.fromSystem];
      var to = Data.systems[gate.toSystem];
      jump = {source: nodes[from.id], target: nodes[to.id], type: gate.type};
      if (gate.type == 'wormhole') {
        // pin nodes not in this region to this region's system
        if (from.regionId == Data.state.vicinity.regionId && to.regionId != Data.state.vicinity.regionId) {
          to.y = from.y;
          to.x = from.x;
        } else if (to.regionId == Data.state.vicinity.regionId && from.regionId != Data.state.vicinity.regionId) {
          from.y = to.y;
          from.x = to.x;
        }
        // pin the wormhole close to the connecting node
        if (to.y === undefined && to.x === undefined) {
          to.y = from.y;
          to.x = from.x;
        } else if ( from.y === undefined && from.x === undefined) {
          from.y = to.y;
          from.x = to.x;
        }

        jump.id = gate._id;
        jump.updated_at = gate.updated_at;
        jump.wormhole_data = gate.wormhole_data;
      }
      
      if (gate.type == 'jumpbridge') jump.jumpbridge_data = gate.jumpbridge_data;
      
      SystemMap.jumps.push(jump);
      SystemMap.links.push(jump);
    });

    SystemMap.systems.forEach(function (system) {
      var anchor;
      system.x *= SCALING_FACTOR;
      system.y *= SCALING_FACTOR;
      SystemMap.nodes.push(system);
      if (!Util.is_wormhole(system.system)) {
        SystemMap.nodes.push(anchor = { x: system.x, y: system.y, fixed: true });
        SystemMap.links.push({ source: system, target: anchor });
      }
    });

    force
      .nodes(SystemMap.nodes)
      .links(SystemMap.links)
      .gravity(0)
      .charge(function(d) {
        if (d.system && d.system.wormhole_class) return -1250 * SCALING_FACTOR * 0.5;
        return d.fixed ? 0 : -1250 * SCALING_FACTOR;
      })
      .chargeDistance(200 * SCALING_FACTOR)
      .linkDistance(function(l) {
        if (l.type == 'jumpbridge') return 0;
        if (l.type == 'wormhole') return 10;
        if (l.source.fixed || l.target.fixed) return 0;
        var dx = l.source.x - l.target.x, dy = l.source.y - l.target.y;
        return Math.min(50 * SCALING_FACTOR, Math.sqrt(dx * dx + dy * dy));
      })
      .linkStrength(function(l) {
        if (l.type == 'jumpbridge') return 0;
        if (l.type == 'wormhole') return 0;
        if (l.source.fixed || l.target.fixed) return 0.1;
        return 0.25;
      });
    force.start();
    while( force.alpha() > 0.01 ) {
      force.tick();
    }
    force.stop();

    SystemMap.zoom.translate([(Data.ui.map.width() / 2 - nodes[system.id].x * scale), (Data.ui.map.height() / 2 - nodes[system.id].y * scale)]);
    SystemMap.zoom.event(root);

    Data.ui.currentSystem
    .data('system-id', Data.state.vicinity.systemId)
    .text( Data.state.vicinity.systemName );

    Data.ui.currentRegion
    .data('region-id', Data.state.vicinity.regionId)
    .text( Data.state.vicinity.regionName );
  },

  updateHud: function(system_object) {
    if (system_object === undefined) return;
    Server.systemInformation(system_object.name, function(error, system) {
      if (system === null) return;
      system.status = SystemMap.system_color(system);

      if (system.status == 'clear') {
        if ($.inArray('hostile', $.map(system.vicinity, function(s) { return SystemMap.system_color(s); })) > -1) {
          system.status = 'warning';
        }
      }

      Data.ui.hud.html( Data.templates.hud(system) );
    });
  },

  updateInfo: function(system_name) {
    Server.systemInformation(system_name, function(error, results) {
      if (results === null) return;
      var system = { name: results.name,
                     systemId: results.id,
                     region: Data.regions[ results.regionID ].name,
                     hostiles: results.hostiles,
                     hostile_count: results.hostiles.length,
                     security: results.security,
                     faded_count: SystemMap.faded_count( results ),
                     gates: $.map( results.jumps, function(j) { return Data.systems[ j.to ]; })
      };

      if (results.security_class) system.security_class = results.security_class;
      if (results.wormhole_class) system.wormhole_class = results.wormhole_class;
      if (results.wormhole_effect) system.wormhole_effect = results.wormhole_effect;

      system.last_report = (results.reports.length) ? Util.formatTime(results.reports.pop().ts) : 'Never';
      system.advisories = AdvisoryList.lookup(results.id);
      system.active_advisories = $.grep(system.advisories, function(a) { return a.present === true; });
      if (results.id == Data.state.vicinity.systemId) system.allow_report = true;

      Data.ui.mapInfo.html( $(Data.templates.system_info(system)) );
      Data.ui.mapInfo.children('div.details')
        .fadeIn(Data.config.uiSpeed)
        .delay(Data.config.alertStay)
        .fadeOut(Data.config.uiSpeed * 8);
    });
  },

  updateWormholeJump: function(link_a) {
    link_b = $.grep(SystemMap.links, function(l) { 
      if (l.wormhole_data) return l.source.system.id == link_a.target.system.id && l.target.system.id == link_a.source.system.id; })[0];
    
    link_a.permitted_ships = Handlebars.helpers.jump_permitted_ships(link_a.wormhole_data.mass_total);
    link_b.permitted_ships = Handlebars.helpers.jump_permitted_ships(link_b.wormhole_data.mass_total);
    
    Data.ui.mapInfo.html( $(Data.templates.wormhole_link_info({link_a: link_a, link_b: link_b})) );
    Data.ui.mapInfo.children('div.wormhole-link-details')
      .fadeIn(Data.config.uiSpeed)
      .delay(Data.config.alertStay * 3)
      .fadeOut(Data.config.uiSpeed);
  },
  
  showJumpbridgeInfo: function(link) {
    Data.ui.mapInfo.html( $(Data.templates.jumpbridge_link_info(link)) );
    Data.ui.mapInfo.children('div.jumpbridge-link-details')
      .fadeIn(Data.config.uiSpeed)
      .delay(Data.config.alertStay * 3)
      .fadeOut(Data.config.uiSpeed);
  },

  refreshSystems: function() {
    d3.selectAll('g.node .system')
      .attr('class', function(n) { return SystemMap.system_classes(n.system); });

    d3.selectAll('g.node rect.advisories')
      .attr('class', function(n) {
        return (SystemMap.advisory_count(n.system) > 0) ? 'advisories present' : 'advisories vacant';
      });

    d3.selectAll('g.node text.advisories')
      .text(function(n) {
        return UI.mapUnicode(n.system.id, Data.advisories[n.system.id] );
      });

    d3.selectAll('g.node rect.hostiles')
      .attr('class', function(n) {
        return (SystemMap.hostile_count(n.system) > 0) ? 'hostiles present' : 'hostiles vacant';
      })
      .attr('width', function(n) {
        return (SystemMap.hostile_count(n.system) > 9) ? 27 : 20;
      });

    d3.selectAll('g.node text.hostiles')
      .text(function(n) {
        var count = SystemMap.hostile_count(n.system);
        return (count > 0) ? count : '';
      });

    d3.selectAll('g.node rect.faded')
      .attr('class', function(n) {
        return (SystemMap.faded_count(n.system) > 0) ? 'faded present' : 'faded vacant';
      })
      .attr('width', function(n) {
        return (SystemMap.faded_count(n.system) > 9) ? 27 : 20;
      });

    d3.selectAll('g.node text.faded')
      .text(function(n) {
        var count = SystemMap.faded_count(n.system);
        return (count > 0) ? count : '';
      });

    SystemMap.updateHud( Data.systems[ Data.state.vicinity.systemId ] );
  },

  updateCurrent: function(pilot) {
    Data.state.vicinity.systemId = pilot.systemId;
    Data.state.vicinity.systemName = pilot.systemName;

    Data.ui.currentSystem
      .data('system-id', Data.state.vicinity.systemId)
      .text( Data.state.vicinity.systemName );
  },

  redraw: function() {
    log('Redrawing System Map...');
    Data.populate(function() {
      Server.status(function(error, data) {
        SystemMap.draw();
        EventHandler.dispatchEvents(data.events);
      });
    });
  },

  init: function() {
    log('Initializing System Map...');
    SystemMap.draw();
  }

};
