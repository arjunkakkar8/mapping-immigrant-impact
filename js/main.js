const scroller = scrollama();
const years = [2017, 2016, 2015, 2014, 2013, 2012];
var animId,
  PUMAdata,
  colorGuide,
  pathels,
  statels,
  sim,
  simNodes = [];

var tester;

var mapcolors = d3
  .scaleLinear()
  .domain([0, 0.5, 1, 2, 10])
  .range([
    "rgb(255, 199, 14)",
    "rgb(255, 199, 14)",
    "rgb(255, 255, 255)",
    "rgb(0, 117, 137)",
    "rgb(0, 117, 137)"
  ]);
var hotspotcolors = d3
  .scaleLinear()
  .domain([-10, -1.5, 0, 1.5, 10])
  .range([
    "rgb(255, 199, 14)",
    "rgb(255, 199, 14)",
    "rgb(255, 255, 255)",
    "rgb(0, 117, 137)",
    "rgb(0, 117, 137)"
  ]);

function init() {
  d3.select("#dot-container")
    .style("transform", "translate(0, 230)")
    .style("opacity", 0);

  d3.json("data/map_data.json")
    .then(
      function(map_data) {
        var subunits = topojson.feature(
          map_data,
          map_data.objects.ipums_puma_2010
        );
        var projection = d3
          .geoAlbers()
          .scale(2000)
          .translate([1000, 800]);
        var path = d3.geoPath().projection(projection);

        subunits.features.forEach(element => {
          cname = element.properties.State.replace(/\s/g, "") + "Group";
          if (document.getElementById(cname) == null) {
            var groupel = document
              .getElementById("map-group")
              .appendChild(document.createElement("g"));
            groupel.id = cname;
            groupel.classList.add("state-container");

            if ((cname == "AlaskaGroup") | (cname == "HawaiiGroup")) {
              var sizer = groupel.appendChild(document.createElement("g"));
              sizer.classList.add(cname + "Sizer");
              var pathel = sizer.appendChild(document.createElement("path"));
            } else {
              var pathel = groupel.appendChild(document.createElement("path"));
            }
            pathel.setAttribute("d", path(element));
            pathel.setAttribute("id", element.properties.GEOID);
          } else {
            if ((cname == "AlaskaGroup") | (cname == "HawaiiGroup")) {
              var pathel = document
                .getElementsByClassName(cname + "Sizer")[0]
                .appendChild(document.createElement("path"));
            } else {
              var pathel = document
                .getElementById(cname)
                .appendChild(document.createElement("path"));
            }
            pathel.setAttribute("d", path(element));
            pathel.setAttribute("id", element.properties.GEOID);
          }
        });
        document.getElementById("map-group").innerHTML += "";
      },
      error => {
        return console.error(error);
      }
    )
    .then(() => {
      d3.select("g.AlaskaGroupSizer").attr(
        "transform",
        "translate(500, 1250) scale(0.4) rotate(-30)"
      );

      d3.select("g.HawaiiGroupSizer").attr(
        "transform",
        "translate(1280, 150) rotate(-20)"
      );

      d3.selectAll(".state-container").each(function(d, i) {
        var elem = d3.select(this);
        var bbox = elem.node().getBBox();
        var xpos = bbox.x + bbox.width / 2;
        var ypos = bbox.y + bbox.height / 2;
        var xtrans = truncateD(2000 * Math.random() - xpos);
        var ytrans = truncateD(1500 * Math.random() - ypos);
        elem
          .attr("transform", "translate(" + xtrans + "," + ytrans + ")")
          .attr("origpos", "(" + truncateD(xpos) + "," + truncateD(ypos) + ")")
          .attr("prevtrans", "translate(" + xtrans + "," + ytrans + ")")
          .attr(
            "prevvelocity",
            "(" +
              truncateD(2 * (Math.random() - 0.5)) +
              "," +
              truncateD(2 * (Math.random() - 0.5)) +
              ")"
          );
        pathels = d3.selectAll("g.state-container path");
        statels = d3.selectAll(".state-container");
      });

      d3.json("data/score_data.json").then(function(score_data) {
        PUMAdata = score_data;
        pathels.data(score_data, function(d, i) {
          return d ? d.GEOID : this.id;
        });

        d3.json("data/state_immigcounts.json").then(function(immig_count) {
          statels.data(immig_count, function(d, i) {
            return d
              ? d.State.replace(/\s/g, "")
              : this.id.replace(/Group/g, "");
          });

          createColorGuide();
          addDotLabels();
          createTimeline();

          var nonProgressSteps = [2];

          var elements = document.querySelectorAll(".sticky");

          Stickyfill.add(elements);
          steps[0]();
          scroller
            .setup({
              step: ".step",
              progress: true,
              offset: 0,
              order: true
            })
            .onStepEnter(response => {
              if (nonProgressSteps.includes(response.index)) {
                steps[response.index](response);
              }
            })
            .onStepProgress(response => {
              if (!nonProgressSteps.includes(response.index)) {
                steps[response.index](response.progress);
              }
            });

          window.addEventListener("resize", scroller.resize);
        });
      });
    });
}

init();

var steps = [
  function step0() {
    d3.select(".animator").classed("active", true);
    var animId = window.requestAnimationFrame(function animate() {
      if (d3.select(".animator").classed("active")) {
        d3.selectAll(".state-container").each(function() {
          var prevTran = d3
            .select(this)
            .attr("prevtrans")
            .replace(/[^\d-,.]/g, "")
            .split(",");

          var velocity = d3
            .select(this)
            .attr("prevvelocity")
            .replace(/[^\d-,.]/g, "")
            .split(",");

          var origPos = d3
            .select(this)
            .attr("origpos")
            .replace(/[^\d-,.]/g, "")
            .split(",");

          var xvel = truncateD(
            Math.max(
              Math.min(Number(velocity[0]) + 0.2 * (Math.random() - 0.5), 1),
              -1
            )
          );
          var yvel = truncateD(
            Math.max(
              Math.min(Number(velocity[1]) + 0.2 * (Math.random() - 0.5), 1),
              -1
            )
          );

          if (Number(prevTran[0]) + Number(origPos[0]) > 2000) {
            xvel = -Math.abs(xvel);
          }
          if (Number(origPos[0]) + Number(prevTran[0]) < 0) {
            xvel = Math.abs(xvel);
          }
          if (Number(prevTran[1]) + Number(origPos[1]) > 1500) {
            yvel = -Math.abs(yvel);
          }
          if (Number(prevTran[1]) + Number(origPos[1]) < 0) {
            yvel = Math.abs(yvel);
          }
          var xtrans = truncateD(Number(prevTran[0]) + xvel);
          var ytrans = truncateD(Number(prevTran[1]) + yvel);

          d3.select(this)
            .attr("transform", "translate(" + xtrans + "," + ytrans + ")")
            .attr("prevtrans", "translate(" + xtrans + "," + ytrans + ")")
            .attr("prevvelocity", "(" + xvel + "," + yvel + ")");
        });
        window.requestAnimationFrame(animate);
      }
    });
  },
  function step1(progress) {
    d3.select(".animator").classed("active", false);
    d3.selectAll("g.state-container").each(function(d, i) {
      var originalPos = d3
        .select(this)
        .attr("prevtrans")
        .replace(/[^\d-,.]/g, "")
        .split(",");

      d3.select(this).attr(
        "transform",
        "translate(" +
          truncateD(Number(originalPos[0]) * Math.max(1 - progress * 2, 0)) +
          "," +
          truncateD(Number(originalPos[1]) * Math.max(1 - progress * 2, 0)) +
          ")"
      );
    });
  },
  function step2(response) {
    if (response.direction == "down") {
      scroller.offsetTrigger([0.5]);
      scroller.resize();
    } else if (response.direction == "up") {
      scroller.offsetTrigger([0]);
      scroller.resize();
    }
  },
  function step3(progress) {
    pathels
      .style(
        "stroke",
        "rgb(" +
          (progress * 128 + (1 - progress) * 105) +
          "," +
          (progress * 128 + (1 - progress) * 141) +
          "," +
          (progress * 128 + (1 - progress) * 165) +
          ")"
      )
      .style("fill", d => {
        fillVals = mapcolors(d.score_2012)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        return (
          "rgb(" +
          (progress * fillVals[0] + (1 - progress) * 125) +
          "," +
          (progress * fillVals[1] + (1 - progress) * 168) +
          "," +
          (progress * fillVals[2] + (1 - progress) * 197) +
          ")"
        );
      })
      .style("fill-opacity", 0.6 * progress + 0.2 * (1 - progress));

    d3.select("#color-guide-group").style("opacity", progress);
  },
  function step4(progress) {
    d3.select("#map-group").attr(
      "transform",
      "translate(0," + -230 * progress + ")"
    );
    d3.select("#dot-container").attr(
      "transform",
      "translate(0," + 230 * (1 - progress) + ")"
    );
    createDotPlot(0);
    d3.select("#dot-container").style("opacity", progress * 0.9);

    d3.selectAll("#dot-container circle");
  },
  function step5(progress) {
    pathels.style("fill", d => {
      oldVals = mapcolors(d.score_2012)
        .replace(/[^\d-,.]/g, "")
        .split(",");
      newVals = hotspotcolors(d.score_2012_g)
        .replace(/[^\d-,.]/g, "")
        .split(",");
      return (
        "rgb(" +
        (progress * newVals[0] + (1 - progress) * oldVals[0]) +
        "," +
        (progress * newVals[1] + (1 - progress) * oldVals[1]) +
        "," +
        (progress * newVals[2] + (1 - progress) * oldVals[2]) +
        ")"
      );
    });
    d3.select("#scaleLabels1").style("opacity", 1 - progress);
    d3.select("#scaleLabels2").style("opacity", progress);
  },
  function step6(progress) {
    statels.each(function(d) {
      elem = d3.select(this);
      scaler =
        4 * progress * (1 - progress) * truncateD(d.immigcount_2017) +
        (1 - 4 * progress * (1 - progress));
      coords = elem
        .attr("origpos")
        .replace(/[^\d-,.]/g, "")
        .split(",");

      elem.attr(
        "transform",
        "translate(" +
          (1 - scaler) * coords[0] +
          "," +
          (1 - scaler) * coords[1] +
          ") scale(" +
          scaler +
          ")"
      );
    });
  },
  function step7(progress) {
    if (progress < 0.01) {
      d3.select("#timeline-group").style("opacity", 0);
    } else if (progress < 0.05) {
      d3.select("#timeline-group").style("opacity", 25 * progress);
    } else {
      d3.select("#timeline-group").style("opacity", 1);
      d3.select("#slider").attr(
        "transform",
        "translate(0," + (-973 * (progress - 0.05)) / 0.95 + ")"
      );
    }

    if ((progress > 0.05) & (progress < 0.24)) {
      if (sim.step != 0) createDotPlot(0);
      pathels.style("fill", d => {
        oldVals = hotspotcolors(d.score_2012_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        newVals = hotspotcolors(d.score_2013_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        return (
          "rgb(" +
          truncateD(
            ((progress - 0.05) * newVals[0] + (0.24 - progress) * oldVals[0]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.05) * newVals[1] + (0.24 - progress) * oldVals[1]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.05) * newVals[2] + (0.24 - progress) * oldVals[2]) /
              0.19
          ) +
          ")"
        );
      });
    } else if ((progress > 0.24) & (progress < 0.43)) {
      if (sim.step != 1) createDotPlot(1);
      pathels.style("fill", d => {
        oldVals = hotspotcolors(d.score_2013_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        newVals = hotspotcolors(d.score_2014_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        return (
          "rgb(" +
          truncateD(
            ((progress - 0.24) * newVals[0] + (0.43 - progress) * oldVals[0]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.24) * newVals[1] + (0.43 - progress) * oldVals[1]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.24) * newVals[2] + (0.43 - progress) * oldVals[2]) /
              0.19
          ) +
          ")"
        );
      });
    } else if ((progress > 0.43) & (progress < 0.62)) {
      if (sim.step != 2) createDotPlot(2);
      pathels.style("fill", d => {
        oldVals = hotspotcolors(d.score_2014_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        newVals = hotspotcolors(d.score_2015_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        return (
          "rgb(" +
          truncateD(
            ((progress - 0.43) * newVals[0] + (0.62 - progress) * oldVals[0]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.43) * newVals[1] + (0.62 - progress) * oldVals[1]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.43) * newVals[2] + (0.62 - progress) * oldVals[2]) /
              0.19
          ) +
          ")"
        );
      });
    } else if ((progress > 0.62) & (progress < 0.81)) {
      if (sim.step != 3) createDotPlot(3);
      pathels.style("fill", d => {
        oldVals = hotspotcolors(d.score_2015_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        newVals = hotspotcolors(d.score_2016_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        return (
          "rgb(" +
          truncateD(
            ((progress - 0.62) * newVals[0] + (0.81 - progress) * oldVals[0]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.62) * newVals[1] + (0.81 - progress) * oldVals[1]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.62) * newVals[2] + (0.81 - progress) * oldVals[2]) /
              0.19
          ) +
          ")"
        );
      });
    } else if ((progress > 0.81) & (progress < 0.95)) {
      if (sim.step != 4) createDotPlot(4);
      pathels.style("fill", d => {
        oldVals = hotspotcolors(d.score_2016_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        newVals = hotspotcolors(d.score_2017_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        return (
          "rgb(" +
          truncateD(
            ((progress - 0.81) * newVals[0] + (1 - progress) * oldVals[0]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.81) * newVals[1] + (1 - progress) * oldVals[1]) /
              0.19
          ) +
          "," +
          truncateD(
            ((progress - 0.81) * newVals[2] + (1 - progress) * oldVals[2]) /
              0.19
          ) +
          ")"
        );
      });
    } else if (progress > 0.95) {
      if (sim.step != 5) createDotPlot(5);
      pathels.style("fill", d => {
        newVals = hotspotcolors(d.score_2017_g)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        return (
          "rgb(" +
          truncateD(newVals[0]) +
          "," +
          truncateD(newVals[1]) +
          "," +
          truncateD(newVals[2]) +
          ")"
        );
      });
    }
  },
  function step8() {}
];

function addDotLabels() {
  container = d3.select("#dot-container");
  container
    .append("text")
    .attr("id", "under-num")
    .attr("class", "text")
    .attr("x", 450)
    .attr("y", 1320)
    .style("font-size", "45px")
    .style("fill", "grey")
    .text("");
  container
    .append("text")
    .attr("class", "text")
    .attr("x", 450)
    .attr("y", 1360)
    .style("fill", "grey")
    .style("font-size", "25px")
    .text("PUMAs with immigrants");
  container
    .append("text")
    .attr("class", "text")
    .attr("x", 450)
    .attr("y", 1390)
    .style("fill", "grey")
    .style("font-size", "25px")
    .text("under-contributing");

  container
    .append("text")
    .attr("id", "over-num")
    .attr("class", "text")
    .attr("x", 1550)
    .attr("y", 1320)
    .attr("text-anchor", "end")
    .style("font-size", "45px")
    .style("fill", "grey")
    .text("");
  container
    .append("text")
    .attr("class", "text")
    .attr("x", 1550)
    .attr("y", 1360)
    .attr("text-anchor", "end")
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("PUMAs with immigrants");
  container
    .append("text")
    .attr("class", "text")
    .attr("x", 1550)
    .attr("y", 1390)
    .attr("text-anchor", "end")
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("over-contributing");
}

function createDotPlot(step) {
  var scoreSel = "score_" + years[5 - step];
  var countSel = "immigcount_" + years[5 - step];

  var oldNodes = simNodes;
  simNodes = PUMAdata.filter(n => n[scoreSel] != 1);

  if (oldNodes.length == 0) {
    sim = d3.forceSimulation(simNodes);
    simNodes.forEach(function(node) {
      node.x = 500 * Math.min(1, Math.max(-1, node[scoreSel] - 1));
      node.y = Math.random() * 50 - 25;
    });

    sim
      .alphaDecay([0.2])
      .force(
        "collide",
        d3.forceCollide(d => truncateD(d[countSel] / 5000)).strength([1])
      )
      .force("axis", d3.forceY(10).strength([0.3]))
      .force("box", boxingForce)
      .force(
        "positioning",
        d3
          .forceX(d => {
            score = Math.min(1, Math.max(-1, d[scoreSel] - 1));
            return 500 * score;
          })
          .strength([1])
      );
  } else {
    sim
      .nodes(simNodes)
      .alpha(1)
      .restart();
    simNodes = PUMAdata.filter(n => n[scoreSel] != 1);
    simNodes.forEach(function(node) {
      match = oldNodes.filter(n => n.GEOID == node.GEOID);
      node.x = match.length == 1 ? match[0].x : 0;
      node.y = match.length == 1 ? match[0].y : 0;
    });

    sim
      .force(
        "collide",
        d3.forceCollide(d => truncateD(d[countSel] / 5000)).strength([1])
      )
      .force(
        "positioning",
        d3
          .forceX(d => {
            score = Math.min(500, Math.max(-500, 750 * (d[scoreSel] - 1)));
            return score;
          })
          .strength([1])
      );
  }

  sim.step = step;

  function boxingForce() {
    dx = 500;
    dy = 150;
    for (let node of simNodes) {
      node.x = Math.max(-dx, Math.min(dx, node.x));
      node.y = Math.max(-dy, Math.min(dy, node.y));
    }
  }
  var dotContainer = d3.select("#dot-container");
  var dotData = dotContainer.selectAll(".dots").data(simNodes, d => d.GEOID);
  dotData
    .enter()
    .append("circle")
    .merge(dotData)
    .attr("class", "dots")
    .attr("stroke", "grey")
    .transition()
    .delay(1000)
    .duration(2000)
    .attr("id", d => "dot" + d.GEOID)
    .attr("fill", d => mapcolors(d[scoreSel]))
    .attr("r", d => truncateD(d[countSel] / 5000));

  dotData.exit().remove();

  sim.on("tick", () => {
    dotContainer
      .selectAll("circle")
      .attr("cx", function(d) {
        return 1000 + d.x;
      })
      .attr("cy", function(d) {
        return 1250 + d.y;
      });
  });

  d3.select("#under-num")
    .transition()
    .duration(1000)
    .tween("text", function() {
      var selection = d3.select(this);
      var start = d3
        .select(this)
        .text()
        .replace(/[^\d-,.]/g, "");
      var end = simNodes.filter(n => n[scoreSel] < 1).length / 23.51;
      var interpolator = d3.interpolateNumber(start, end);
      return function(t) {
        selection.text(truncateD(interpolator(t), 2) + "%");
      };
    });

  d3.select("#over-num")
    .transition()
    .duration(1000)
    .tween("text", function() {
      var selection = d3.select(this);
      var start = d3
        .select(this)
        .text()
        .replace(/[^\d-,.]/g, "");
      var end = simNodes.filter(n => n[scoreSel] > 1).length / 23.51;
      var interpolator = d3.interpolateNumber(start, end);
      return function(t) {
        selection.text(truncateD(interpolator(t), 2) + "%");
      };
    });
}

function createColorGuide() {
  colorGuide = d3.select("#color-scale");

  colorGuide
    .append("rect")
    .attr("x", 50)
    .attr("y", 125)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", 20)
    .attr("height", 750)
    .attr("fill", "url(#gradient)")
    .attr("stroke", "grey");

  labels1 = colorGuide
    .append("g")
    .attr("id", "scaleLabels1")
    .attr("class", "text")
    .style("opacity", 1);

  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 40)
    .style("font-size", "30px")
    .style("fill", "grey")
    .text("Over");
  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 60)
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("Contributing");
  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 80)
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("Regions");

  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 940)
    .style("font-size", "30px")
    .style("fill", "grey")
    .text("Under");
  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 960)
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("Contributing");
  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 980)
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("Regions");

  labels2 = colorGuide
    .append("g")
    .attr("id", "scaleLabels2")
    .attr("class", "text")
    .style("opacity", 0);

  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 40)
    .style("font-size", "30px")
    .style("fill", "grey")
    .text("Over");
  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 60)
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("Contributing");
  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 80)
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("Hotspots");

  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 940)
    .style("font-size", "30px")
    .style("fill", "grey")
    .text("Under");
  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 960)
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("Contributing");
  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 980)
    .style("fill", "grey")
    .style("font-size", "25px")
    .text("Hotspots");
}

function createTimeline() {
  timelineGroup = d3
    .select("#map-container")
    .append("g")
    .attr("id", "timeline-group")
    .style("opacity", 0);

  timeline = timelineGroup
    .append("svg")
    .attr("id", "timeline")
    .attr("x", 1775)
    .attr("y", 250)
    .attr("height", 1000)
    .attr("width", 200)
    .attr("viewBox", "0, 0, 200, 1000")
    .attr("preserveAspectRatio", "xMidYMid meet");

  for (var i = 0; i < years.length; i++) {
    timeline
      .append("text")
      .attr("class", "text")
      .style("font-size", 30)
      .style("fill", "grey")
      .attr("x", 65)
      .attr("y", 20 + truncateD((i * 975) / 5))
      .text(years[i]);

    if (i != 5) {
      timeline
        .append("rect")
        .attr("fill", "grey")
        .attr("x", 90)
        .attr("y", 58.75 + truncateD((i * 975) / 5))
        .attr("width", 20)
        .attr("height", 2);

      timeline
        .append("rect")
        .attr("fill", "grey")
        .attr("x", 80)
        .attr("y", 107.5 + truncateD((i * 975) / 5))
        .attr("width", 40)
        .attr("height", 2);

      timeline
        .append("rect")
        .attr("fill", "grey")
        .attr("x", 90)
        .attr("y", 156.25 + truncateD((i * 975) / 5))
        .attr("width", 20)
        .attr("height", 2);
    }
  }

  slider = timeline.append("g").attr("id", "slider");

  slider
    .append("path")
    .attr("d", "M60 985 L145 985")
    .attr("stroke", "grey")
    .attr("stroke-width", "2");

  slider
    .append("path")
    .attr("d", "M60 985 L40 970 L40 1000")
    .attr("stroke", "grey")
    .attr("fill", "grey");

  slider
    .append("path")
    .attr("d", "M145 985 L165 970 L165 1000")
    .attr("stroke", "grey")
    .attr("fill", "grey");
}

function truncateD(number, n = 3) {
  num = number * 10 ** n;
  return Math[num < 0 ? "ceil" : "floor"](num) / 10 ** n;
}
