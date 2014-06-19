var SystemMap = {
  init: function() {
    log("Initializing System Map...")
    Data.ui.map.append( Data.templates.map() );

    var rect_height = 17;
    var rect_width = 60;

    var force = d3.layout.force()
        .size([Data.ui.map.width(), Data.ui.map.height()])
        .charge(-200)
        .linkDistance(10)
        .on("tick", function() {
          // link.attr("x1", function(d) { return d.source.x; })
          //     .attr("y1", function(d) { return d.source.y; })
          //     .attr("x2", function(d) { return d.target.x; })
          //     .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) {
            return "translate(" + (d.x - rect_width/2) + "," + (d.y - rect_height/2) + ")";
          });
        });

    var drag = force.drag()
        .on("dragstart", function(d) {
          d3.select(this).classed("fixed", d.fixed = true);
        });

    var svg = d3.select("svg");
    var link = svg.selectAll(".link"),
        node = svg.selectAll(".node");

    d3.json("/data/systems.json", function(error, systems) {
      var system = systems[ Data.state.self.system_id ];
      var region = $.map( systems, function(s) { if (s["regionID"] == system["regionID"]) return s });

      force
        .nodes(region)
        .start();

      // link = link.data(graph.links)
      //   .enter().append("line")
      //     .attr("class", "link");

      var node_groups = node = node.data(region)
        .enter().append("g")
        .attr("class", "node")
        .on("dblclick", function(d) {
          d3.select(this).classed("fixed", d.fixed = false);
        })
        .call(drag);

      node_groups.append("rect")
        .attr("class", "status-clear")
        .attr("width", rect_width)
        .attr("height", rect_height)
        .attr("rx", 2).attr("ry", 2);

      node_groups.append("text")
        .attr("class", "system_name")
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
