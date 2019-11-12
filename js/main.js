const scroller = scrollama();
var requestId = undefined;

function init() {
  map = d3.select("#basemap");
  map
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("svg")
    .attr("id", "map-container")
    .attr("viewBox", "0, 0, 2000, 1500")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("id", "map-group");

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
          if (document.getElementsByClassName(cname).length == 0) {
            var groupel = document
              .getElementById("map-group")
              .appendChild(document.createElement("g"));
            groupel.classList.add(cname);
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
                .getElementsByClassName(cname)[0]
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
        "translate(400, 1200) scale(0.4) rotate(-30)"
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
              truncateD(3 * (Math.random() - 0.5)) +
              "," +
              truncateD(3 * (Math.random() - 0.5)) +
              ")"
          );
      });

      d3.json("data/score_data.json").then(function(score_data) {
        d3.select("#map-container")
          .selectAll("path")
          .data(score_data, function(d, i) {
            return d ? d.GEOID : this.id;
          });
      });

      var elements = document.querySelectorAll(".sticky");
      Stickyfill.add(elements);

      scroller
        .setup({
          step: ".step",
          progress: true,
          offset: 0,
          order: true
        })
        .onStepEnter(response => {
          if (response.index != 1) {
            steps[response.index](response);
          }
        })
        .onStepProgress(response => {
          if (response.index == 1) {
            steps[1](response.progress);
          }
        });

      // setup resize event
      window.addEventListener("resize", scroller.resize);
      steps[0]();
    });
}

init();

var steps = [
  function step0() {
    d3.select(".animator").classed("active", true);
    requestId = requestAnimationFrame(function animate() {
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
            Math.min(Number(velocity[0]) + 0.5 * (Math.random() - 0.5), 3),
            -3
          )
        );
        var yvel = truncateD(
          Math.max(
            Math.min(Number(velocity[1]) + 0.5 * (Math.random() - 0.5), 3),
            -3
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
      if (d3.select(".animator").classed("active")) {
        requestAnimationFrame(animate);
      }
    });
  },
  function step1(progress) {
    cancelAnimationFrame(requestId);
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
    t = d3
      .transition()
      .duration(700)
      .ease(d3.easeQuadInOut);

    if (response.direction == "down") {
      d3.selectAll("g.state-container path")
        .transition(t)
        .style("stroke", "white")
        .style("fill", "grey");
      scroller.offsetTrigger([0.5]);
      scroller.resize();
    } else if (response.direction == "up") {
      d3.selectAll("g.state-container path")
        .transition(t)
        .style("stroke", "rgb(231, 157, 157)")
        .style("fill", "red");
      scroller.offsetTrigger([0]);
      scroller.resize();
    }
  },
  function step3(response) {
    t = d3
      .transition()
      .duration(1000)
      .ease(d3.easeQuadInOut);

    console.log("trigger");
  }
];

truncateD = function(number) {
  num = number * 1000;
  return Math[num < 0 ? "ceil" : "floor"](num) / 1000;
};
