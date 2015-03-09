var WormholeMap = {
  nodes: [],
  links: [],
  systems: [],
  jumps: [],
  zoom: null,

  // Given a system, return the class that corresponds to whether a system is hostile or not.
  system_color: function(system) {
    return 'unknown';
  },

  // Determines class list for a system
  system_classes: function(system) {
    var classes = ['system'];
    classes.push('status-' + WormholeMap.system_color(system));
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
    var quadtree = d3.geom.quadtree(WormholeMap.nodes);
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
        WormholeMap.nodes.forEach(WormholeMap.collide(1));
      })
      .on('end', function(){

        var link_groups = link.data( $.grep(WormholeMap.jumps, function(l) { return l.type == 'wormhole'}))
          .enter().append('g')
          .attr('class', function(j) { return 'link ' + j.type; })
          .append('line');

        var node_groups = node.data(WormholeMap.systems)
          .enter().append('g')
          .attr('id', function(n) { return 'system-' + n.system.id; })
          .attr('class', 'node');

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
          .attr('width', rect_width)
          .attr('height', rect_height)
          .attr('rx', 2).attr('ry', 2)
          .attr('class', function(n) { return WormholeMap.system_classes(n.system); });

        node_groups.append('text')
          .attr('class', 'region')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('x', rect_width / 2).attr('y', rect_height * -0.5)
          .text(function(n) {
            return Data.regions[n.system.regionID].name;
          });

        node_groups.append('text')
          .attr('class', 'system-name')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .attr('x', rect_width / 2)
          .attr('y', 10)
          .text(function(n) { return n.system.name; });

        node_groups.on('click', function(n) {
          WormholeMap.updateInfo( n.system.name );
        });

        link_groups.attr('x1', function(d) {return d.source.x;})
          .attr('y1', function(d) {return d.source.y;})
          .attr('x2', function(d) {return d.target.x;})
          .attr('y2', function(d) {return d.target.y;});

        link_groups.filter(function(l) { return l.type == 'wormhole'; }).on('click', function(l) {
          WormholeMap.updateWormholeJump( l );
        });

        node_groups.attr('transform', function(d) {
          return 'translate(' + (d.x - rect_width / 2) + ',' + (d.y - rect_height / 2) + ')';
        });
      });

    var scale = 1;
    if( WormholeMap.zoom ) scale = WormholeMap.zoom.scale();

    WormholeMap.zoom = d3.behavior.zoom()
      .scaleExtent([0.4, 1])
      .on('zoom', zoomHandler)
      .scale(scale);

    var root = svg.append('g');

    function zoomHandler() {
      root.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    }

    WormholeMap.zoom(d3.select('#system-map'));

    var link = root.selectAll('.link'),
      node = root.selectAll('.node');

    // fetch data about our current system
    if (!Data.systems) return;
    
    // pick a random system to center on
    systemId = Object.keys(Data.systems)[0];
    system = Data.systems[ systemId ];
        
    WormholeMap.systems = [];
    WormholeMap.nodes = [];
    WormholeMap.jumps = [];
    WormholeMap.links = [];

    var nodes = {};

    WormholeMap.systems = $.map(Data.systems, function(s) {
      // var node = { system: s, x: s.x, y: s.y };
      var node = { system: s };
      nodes[s.id] = node;
      return node;
    });

    Data.jumps.forEach(function(gate) {
      var jump, node;
      var from = Data.systems[gate.fromSystem];
      var to = Data.systems[gate.toSystem];
      jump = {source: nodes[from.id], target: nodes[to.id], type: gate.type};
      
      if (gate.type == 'wormhole') {
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
      WormholeMap.jumps.push(jump);
      WormholeMap.links.push(jump);
    });

    WormholeMap.systems.forEach(function (system) {
      var anchor;
      system.x *= SCALING_FACTOR;
      system.y *= SCALING_FACTOR;
      WormholeMap.nodes.push(system);
      if (!Util.is_wormhole(system.system)) {
        WormholeMap.nodes.push(anchor = { x: system.x, y: system.y, fixed: true });
        WormholeMap.links.push({ source: system, target: anchor });
      }
    });

    force
      .nodes(WormholeMap.nodes)
      .links(WormholeMap.links)
      .gravity(0)
      .charge(function(d) {
        if (d.system && d.system.wormhole_class) return -1250 * SCALING_FACTOR * 0.5;
        return d.fixed ? 0 : -1250 * SCALING_FACTOR;
      })
      .chargeDistance(200 * SCALING_FACTOR)
      .linkDistance(function(l) {
        if (l.source.fixed || l.target.fixed) return 0;
        if (l.type == 'wormhole') return 75 * SCALING_FACTOR;
        var dx = l.source.x - l.target.x, dy = l.source.y - l.target.y;
        return Math.min(50 * SCALING_FACTOR, Math.sqrt(dx * dx + dy * dy));
      })
      .linkStrength(function(l) {
        if (l.source.fixed || l.target.fixed) return 0.1;
        return 0.25;
      });
    force.start();
    while( force.alpha() > 0.01 ) {
      force.tick();
    }
    force.stop();

    WormholeMap.zoom.translate([(Data.ui.map.width() / 2 - nodes[system.id].x * scale), (Data.ui.map.height() / 2 - nodes[system.id].y * scale)]);
    WormholeMap.zoom.event(root);
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
                     gates: $.map( results.jumps, function(j) { return Data.systems[ j.to ]; })
      };

      if (results.security_class) system.security_class = results.security_class;
      if (results.wormhole_class) system.wormhole_class = results.wormhole_class;
      if (results.wormhole_effect) system.wormhole_effect = results.wormhole_effect;

      system.last_report = (results.reports.length) ? Util.formatTime(results.reports.pop().ts) : 'Never';
      
      Data.ui.mapInfo.html( $(Data.templates.system_info(system)) );
      Data.ui.mapInfo.children('div.details')
        .fadeIn(Data.config.uiSpeed)
        .delay(Data.config.alertStay)
        .fadeOut(Data.config.uiSpeed * 8);
    });
  },
  
  updateWormholeJump: function(link_a) {
    link_b = $.grep(WormholeMap.links, function(l) { 
      if (l.wormhole_data) return l.source.system.id == link_a.target.system.id && l.target.system.id == link_a.source.system.id; })[0];
    
    link_a.permitted_ships = Handlebars.helpers.jump_permitted_ships(link_a.wormhole_data.mass_total);
    link_b.permitted_ships = Handlebars.helpers.jump_permitted_ships(link_b.wormhole_data.mass_total);
    
    Data.ui.mapInfo.html( $(Data.templates.wormhole_link_info({link_a: link_a, link_b: link_b, read_only: true})) );
    Data.ui.mapInfo.children('div.wormhole-link-details')
      .fadeIn(Data.config.uiSpeed)
      .delay(Data.config.alertStay * 3)
      .fadeOut(Data.config.uiSpeed);
  },
  
  searchNodes: function() {
    //find the node
    var selectedVal = document.getElementById('search').value;
    var node = d3.selectAll(".node");
    if (selectedVal == "none") {
      node.style("stroke", "white").style("stroke-width", "1");
    } else {
      var selected = node.filter(function (d, i) {
        return (Data.regions[d.system.regionID].name != selectedVal) && (d.system.name != selectedVal);
      });
      console.log(selected)
      selected.style("opacity", "0");
      var link = d3.selectAll(".link")
      link.style("opacity", "0");
      d3.selectAll(".node, .link").transition()
        .duration(15000)
        .style("opacity", 1);
    }
  },

  init: function() {
    log('Initializing Wormhole Map...');
    WormholeMap.draw();
    $('#search').typeahead({
      hint: false,
      highlight: true,
      minLength: 1
    },
    {
      source: UIPanels.substringMatcher($.merge(
          $.map(Data.regions, function(r) { return r.name; }),
          $.map(Data.systems, function(s) { return s.name; })
        ))
    });
    
    $('#search').focus().on('keydown', function (event) {
      if (event.keyCode == 13) {
        WormholeMap.searchNodes();
        return false;
      }
    });
  }

};
