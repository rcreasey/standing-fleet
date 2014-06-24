var SystemMap = {
  init: function() {
    log("Initializing System Map...");
    Data.ui.map.append( Data.templates.map() );

    var svg = d3.select("#system-map")
      .attr("width", Data.ui.map.width())
      .attr("height", Data.ui.map.height())
      .append("svg");

    d3.json("/data/map.json", function(error, map) {
      var nodes = [];
      var links = [];
      var padlocked = true;
      var translate;

      var rect_height = 17;
      var rect_width = 60;
      var system, systems, jumps;

      var force = d3.layout.force()
        .size([Data.ui.map.width(), Data.ui.map.height()])
        .charge(-250)
        .linkDistance(75)
        .on("tick", function() {

          systems.forEach(function (systemNode) {
            jumps.forEach(function (jump) {
              // Push each node away from any lines passing within r=20 units of its center.
              // This is implemented as a weak repulsive force that scales with r but not with
              // the layout's stabilisation factor.
              // This causes the repulsion to only minimally affect the overall map layout,
              // but as the layout stabilises nodes gently slip away from jump lines intersecting
              // their center.
              if( jump.source === systemNode || jump.target === systemNode ) return;
              const r = 20;
              if(!lineCircleIntersection(jump.source, jump.target, systemNode, r)) return;
              var dx, dy, dn, k;
              var p = getSpPoint(jump.source, jump.target, systemNode);
              dx = systemNode.x - p.x;
              dy = systemNode.y - p.y;
              dn = Math.max(1000, dx * dx + dy * dy);
              k = -100/dn;
              systemNode.x -= dx * k * 0.15;
              systemNode.y -= dy * k * 0.15;
            });
          });

          link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) {
            return "translate(" + (d.x - rect_width/2) + "," + (d.y - rect_height/2) + ")";
          });

          if( padlocked ) {
            var scale = zoom.scale();
            translate = [(Data.ui.map.width() / 2 - system.x * scale), (Data.ui.map.height() / 2 - system.y * scale)];
            zoom.translate(translate);
            zoom.event(root);
          }
        });

      var zoom = d3.behavior.zoom()
        .scaleExtent([0.5, 1])
        .on("zoom", zoomHandler);

      var root = svg.append("g");

      function zoomHandler() {
        if( padlocked && ( d3.event.translate[0] !== translate[0] || d3.event.translate[1] !== translate[1] ) )
          padlocked = false;
        root.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      zoom(d3.select("#system-map"));

      var link = root.selectAll(".link"),
        node = root.selectAll(".node");

      system = map.Systems[ Data.state.self.system_id ];
      systems = $.map( map.Systems, function(s) {
        if (s.regionID === system.regionID) {
          return s
        }
      });

      systems.forEach(function(system) {
        var anchor;
        nodes.push(system);
        nodes.push(anchor = { x: system.x, y: system.y, fixed: true });
        links.push({ source: system, target: anchor });
      });

      jumps = [];

      map.Gates.forEach(function(gate) {
        var jump;
        if ( map.Systems[gate.from].regionID == system.regionID && map.Systems[gate.to].regionID == system.regionID ) {
          jumps.push(jump = {source: map.Systems[gate.from], target: map.Systems[gate.to]});
          links.push(jump);
        }
      });

      force
        .nodes(nodes)
        .links(links)
        .gravity(0)
        .charge(function(d){
          return d.fixed ? 0 : -1250;
        })
        .chargeDistance(200)
        .linkDistance(function(l){
          if(l.source.fixed || l.target.fixed) {
            return 0;
          }
          var dx = l.source.x - l.target.x, dy = l.source.y - l.target.y;
          return Math.min(50, Math.sqrt(dx*dx + dy*dy));
        })
        .linkStrength(function(l) {
          if(l.source.fixed || l.target.fixed) return 0.1;
          return 0.25;
        })
        .start();

      var link_groups = link = link.data(jumps)
        .enter().append("g")
        .attr("class", "link")
        .append("line");

      var node_groups = node = node.data(systems)
        .enter().append("g")
        .attr("class", function(d) {
          if (d.id == Data.state.self.system_id ) {
            return "node current-system"
          } else {
            return "node"
          }
        });

      node_groups.append("rect")
        .attr("class", "status-hostile")
        .attr("width", rect_width)
        .attr("height", rect_height)
        .attr("rx", 2).attr("ry", 2);

      node_groups.append("text")
        .attr("class", "system-name")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("x", rect_width / 2)
        .attr("y", 10)
        .text(function(d) {
          return d.name;
        });
    });

    // Given a line AB and a point C, finds point D such that CD is perpendicular
    // to AB
    var getSpPoint = function(A,B,C){
      var x1=A.x, y1=A.y, x2=B.x, y2=B.y, x3=C.x, y3=C.y;
      var px = x2-x1, py = y2-y1, dAB = px*px + py*py;
      var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
      var x = x1 + u * px, y = y1 + u * py;
      return {x:x, y:y}; //this is D
    };

    // A square-root and division free line segment / circle intersection algorithm
    var lineCircleIntersection = function(A, B, C, r) {
      var a, b, c, d;
      // Translate everything so that one line end is at [0,0]
      a = B.x - A.x;
      b = B.y - A.y;
      c = C.x - A.x;
      d = C.y - A.y;
      var rr = r*r;
      var cadb = c*a + d*b;
      var dacb = d*a - c*b;
      var a2b2 = a*a + b*b;

      if (dacb*dacb > (rr*a2b2)) return false;
      else if( c*c + d*d <= rr ) return true;
      else if( (a-c)*(a-c) + (b-d)*(b-d) <= rr) return true;
      return cadb >= 0 && cadb <= a2b2;
    }

  }

};
