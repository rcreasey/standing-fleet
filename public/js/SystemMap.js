var SystemMap = {
  nodes: [],
  links: [],
  systems: [],
  jumps: [],

  // Given a system, return the class that corresponds to whether a system is hostile or not.
  system_color: function(system) {
    if ( $.grep(Data.hostiles, function(h) { return system.name === h.systemName; }).length > 0 ) {
      return "status-hostile";
    } else if ( $.grep(Data.members, function(m) { return system.name === m.systemName; }).length > 0 ) {
      return "status-clear";
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

        var link_groups = link = link.data(SystemMap.jumps)
          .enter().append("g")
          .attr("class", "link")
          .append("line");

        var node_groups = node = node.data(SystemMap.systems)
          .enter().append("g")
          .attr("id", function(n) { return "system-" + n.id })
          .attr("class", function(n) {
            return (n.id === +Data.state.self.systemId ) ? "current node" : "node";
          });

        $('#current-system')
          .data('systemId', system.id)
          .text( system.name );

        node_groups.append("rect")
          .attr("width", rect_width)
          .attr("height", rect_height)
          .attr("rx", 2).attr("ry", 2)
          .attr("class", function(n) { return SystemMap.system_color(n); });

        node_groups.append("text")
          .attr("class", "system-name")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .attr("x", rect_width / 2)
          .attr("y", 10)
          .text(function(d) { return d.name; });

        link.attr("x1", function(d) {return d.source.x;})
          .attr("y1", function(d) {return d.source.y;})
          .attr("x2", function(d) {return d.target.x;})
          .attr("y2", function(d) {return d.target.y;});

        node.attr("transform", function(d) {
          return "translate(" + (d.x - rect_width / 2) + "," + (d.y - rect_height / 2) + ")";
        });

      });

    var zoom = d3.behavior.zoom()
      .scaleExtent([0.5, 1])
      .on("zoom", zoomHandler);

    var root = svg.append("g");

    function zoomHandler() {
      root.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    zoom(d3.select("#system-map"));

    var link = root.selectAll(".link"),
      node = root.selectAll(".node");

    // fetch data about our current system
    system = Data.systems[ Data.state.self.systemId ];

    // Only draw systems that are in our current region
    SystemMap.systems = $.map(Data.systems, function(s) {
      if (system && (s.regionID === system.regionID)) return s;
    });

    SystemMap.systems.forEach(function(system) {
      var anchor;
      system.x *= SCALING_FACTOR;
      system.y *= SCALING_FACTOR;
      SystemMap.nodes.push(system);
      SystemMap.nodes.push(anchor = { x: system.x, y: system.y, fixed: true });
      SystemMap.links.push({ source: system, target: anchor });
    });

    Data.gates.forEach(function(gate) {
      var jump;
      if(Data.systems[gate.from].regionID == system.regionID && Data.systems[gate.to].regionID == system.regionID) {
        SystemMap.jumps.push(jump = {source: Data.systems[gate.from], target: Data.systems[gate.to]});
        SystemMap.links.push(jump);
      }
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

    var scale = zoom.scale();
    zoom.translate([(Data.ui.map.width() / 2 - system.x * scale), (Data.ui.map.height() / 2 - system.y * scale)]);
    zoom.event(root);
  },

  updateCurrent: function() {
    d3.selectAll('g.node')
      .attr("class", function(n) {
        return (n.id === +Data.state.self.systemId ) ? "current node" : "node";
      });

    $('#current-system')
      .data('system-id', Data.state.self.systemId)
      .text( $('.current text').text() );
  },

  refreshSystems: function() {
    d3.selectAll('g.node rect')
      .attr("class", function(n) { return SystemMap.system_color(n); });
  },

  redraw: function() {
    log("Redrawing System Map...");
    $("#system-map > svg").remove();
    SystemMap.draw();
  },

  init: function() {
    log("Initializing System Map...");
    SystemMap.draw();
  }

};
