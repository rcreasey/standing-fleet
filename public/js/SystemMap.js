var SystemMap = {
  init: function() {
    log("Initializing System Map...")
    Data.ui.map.append( Data.templates.map() );

    var force = d3.layout.force()
        .size([Data.ui.map.width(), Data.ui.map.height()])
        .charge(-400)
        .linkDistance(40)
        .on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        });

    var drag = force.drag()
        .on("dragstart", function(d) {
          d3.select(this).classed("fixed", d.fixed = true);
        });

    var svg = d3.select("svg");
    var link = svg.selectAll(".link"),
        node = svg.selectAll(".node");

    d3.json("/data/graph.json", function(error, graph) {
      force
          .nodes(graph.nodes)
          .links(graph.links)
          .start();

      link = link.data(graph.links)
        .enter().append("line")
          .attr("class", "link");

      node = node.data(graph.nodes)
        .enter().append("circle")
          .attr("class", "node")
          .attr("r", 12)
          .on("dblclick", function(d) {
            d3.select(this).classed("fixed", d.fixed = false);
          })
          .call(drag);
    });
  }

};
