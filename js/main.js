const scroller = scrollama();
var colorGuide, pathels;
var mapcolors = d3
  .scaleLinear()
  .domain([0.5, 1, 2])
  .range(["rgb(255, 199, 14)", "rgb(185, 202, 146)", "rgb(0, 117, 137)"]);
var hotspotcolors = d3
  .scaleLinear()
  .domain([-1.5, 0, 1.5])
  .range(["rgb(255, 199, 14)", "rgb(185, 202, 146)", "rgb(0, 117, 137)"]);

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
              truncateD(3 * (Math.random() - 0.5)) +
              "," +
              truncateD(3 * (Math.random() - 0.5)) +
              ")"
          );
        pathels = d3.selectAll("g.state-container path");
      });

      d3.json("data/score_data.json").then(function(score_data) {
        pathels.data(score_data, function(d, i) {
          return d ? d.GEOID : this.id;
        });
      });

      createColorGuide();

      var progressSteps = [1, 3, 4, 5];

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
          if (!progressSteps.includes(response.index)) {
            steps[response.index](response);
          }
        })
        .onStepProgress(response => {
          if (progressSteps.includes(response.index)) {
            steps[response.index](response.progress);
          }
        });

      // setup resize event
      window.addEventListener("resize", scroller.resize);
    });
}

init();

var steps = [
  function step0() {
    d3.select(".animator").classed("active", true);
    requestAnimationFrame(function animate() {
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
    var id = window.requestAnimationFrame(function() {});
    while (id--) {
      window.cancelAnimationFrame(id);
    }
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
          (progress * 128 + (1 - progress) * 185) +
          "," +
          (progress * 128 + (1 - progress) * 202) +
          "," +
          (progress * 128 + (1 - progress) * 146) +
          ")"
      )
      .style("fill", d => {
        fillVals = mapcolors(d.score_2012)
          .replace(/[^\d-,.]/g, "")
          .split(",");
        return (
          "rgb(" +
          (progress * fillVals[0] + (1 - progress) * 185) +
          "," +
          (progress * fillVals[1] + (1 - progress) * 202) +
          "," +
          (progress * fillVals[2] + (1 - progress) * 146) +
          ")"
        );
      })
      .style("fill-opacity", 0.6 * progress + 0.2 * (1 - progress));

    colorGuideGroup.style("opacity", progress);
  },
  function step4(progress) {
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
  function step5(progress){

  }
];

function createColorGuide() {
  colorGuideGroup = d3
    .select("#map-container")
    .append("g")
    .attr("id", "color-guide-group")
    .style("opacity", 0);

  colorGuide = colorGuideGroup
    .append("svg")
    .attr("id", "color-scale")
    .attr("x", 25)
    .attr("y", 250)
    .attr("height", 1000)
    .attr("width", 200)
    .attr("viewBox", "0, 0, 200, 1000")
    .attr("preserveAspectRatio", "xMidYMid meet");

  colorGuide.html(
    "<defs><linearGradient id='gradient' x1='0' x2='0' y1='0' y2='1'>" +
      "<stop offset='10%' stop-color='rgb(0, 117, 137)'/>" +
      "<stop offset='50%' stop-color='rgb(185, 202, 146)'/>" +
      "<stop offset='90%' stop-color='rgb(255, 199, 14)'/>" +
      "</linearGradient></defs>"
  );
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
    .html("Over");
  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 60)
    .style("font-size", "25px")
    .html("Contributing");
  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 80)
    .style("font-size", "25px")
    .html("Regions");

  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 940)
    .style("font-size", "30px")
    .html("Under");
  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 960)
    .style("font-size", "25px")
    .html("Contributing");
  labels1
    .append("text")
    .attr("x", 0)
    .attr("y", 980)
    .style("font-size", "25px")
    .html("Regions");

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
    .html("Over");
  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 60)
    .style("font-size", "25px")
    .html("Contributing");
  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 80)
    .style("font-size", "25px")
    .html("Hotspots");

  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 940)
    .style("font-size", "30px")
    .html("Under");
  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 960)
    .style("font-size", "25px")
    .html("Contributing");
  labels2
    .append("text")
    .attr("x", 0)
    .attr("y", 980)
    .style("font-size", "25px")
    .html("Hotspots");
}

function truncateD(number) {
  num = number * 1000;
  return Math[num < 0 ? "ceil" : "floor"](num) / 1000;
}
