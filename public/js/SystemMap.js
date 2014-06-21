var SystemMap = {
  init: function() {
    log("Initializing System Map...")
    Data.ui.map.append( Data.templates.map() );

    var rect_height = 17;
    var rect_width = 60;

    var force = d3.layout.force()
        .size([Data.ui.map.width(), Data.ui.map.height()])
        .charge(-250)
        .linkDistance(75)
        .on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) {
            return "translate(" + (d.x - rect_width/2) + "," + (d.y - rect_height/2) + ")";
          });
        });

    var drag = force.drag()
        .on("dragstart", function(d) {
          d3.select(this).classed("fixed", d.fixed = true);
        });

    var zoomListener = d3.behavior.zoom()
      .scaleExtent([0.5, 1])
      .on("zoom", zoomHandler);

    var svg = d3.select("#system-map")
                .attr("width", Data.ui.map.width())
                .attr("height", Data.ui.map.height())
                .append("svg");

    function zoomHandler() {
      svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    var link = svg.selectAll(".link"),
        node = svg.selectAll(".node");

    d3.json("/data/map.json", function(error, map) {
      var system = map.Systems[ Data.state.self.system_id ];
      var region = $.map( map.Systems, function(s) {
        if (s.regionID == system.regionID) {
          return s
        }
      });
      var jumps  = [];

      region.forEach(function(system) {
        map.Gates.forEach(function(gate) {
          if ( gate.type != "InterRegion" && gate.to == system.id  ) {
            jumps.push({source: map.Systems[gate.from], target: system});
          }
        });
      });

      force
        .nodes(region)
        .links(jumps)
        .start();

      var link_groups = link = link.data(jumps)
        .enter().append("g")
        .attr("class", "link")
        .append("line");

      var node_groups = node = node.data(region)
        .enter().append("g")
        .attr("class", function(d) {
          if (d.id == Data.state.self.system_id ) {
            return "node current-system"
          } else {
            return "node"
          }
        })
        .on("dblclick", function(d) {
          d3.select(this).classed("fixed", d.fixed = false);
        })
        .call(drag);

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
          var name = d.name;
          return name;
        });
    });

  }

};
