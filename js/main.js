function setup() {
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
            pathel.setAttribute("geoid", element.properties.GEOID);
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
            pathel.setAttribute("geoid", element.properties.GEOID);
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
        var xtrans = 2 * truncateD(xpos - 1000);
        var ytrans = 2 * truncateD(ypos - 700);
        elem
          .attr("transform", "translate(" + xtrans + "," + ytrans + ")")
          .attr("origtrans", "translate(" + xtrans + "," + ytrans + ")")
          .attr(
            "origvelocity",
            "(" +
              truncateD(2*(Math.random() - 0.5)) +
              "," +
              truncateD(2*(Math.random() - 0.5)) +
              ")"
          );
      });
    });

  var elements = document.querySelectorAll(".sticky");
  Stickyfill.add(elements);
}

function init() {
  setup();

  // instantiate the scrollama
  const scroller = scrollama();

  // setup the instance, pass callback functions
  scroller
    .setup({
      step: ".step",
      progress: true,
      offset: 0
    })
    .onStepEnter(response => {
      if (response.index != 1) {
        console.log(response.index)
        steps[response.index]();
      }
    })
    .onStepProgress(response => {
      if (response.index == 1) {
        steps[1](response.progress);
      }
    });

  // setup resize event
  window.addEventListener("resize", scroller.resize);
}

init();

var steps = [
  function step0() {
    d3.select(".animator").classed("active", true);
    console.log("trigger");
    requestAnimationFrame(function animate() {
      d3.selectAll(".state-container").each(function() {
        var originalPos = d3
          .select(this)
          .attr("origtrans")
          .replace(/[^\d-,.]/g, "")
          .split(",");

        var velocity = d3
          .select(this)
          .attr("origvelocity")
          .replace(/[^\d-,.]/g, "")
          .split(",");

        var xvel = truncateD(
          Math.max(
            Math.min(Number(velocity[0]) + 0.05 * (Math.random() - 0.5), 1),
            -1
          )
        );
        var yvel = truncateD(
          Math.max(
            Math.min(Number(velocity[1]) + 0.05 * (Math.random() - 0.5), 1),
            -1
          )
        );
        var xtrans = truncateD(Number(originalPos[0]) + xvel);
        var ytrans = truncateD(Number(originalPos[1]) + yvel);
        xtrans = truncateD(xtrans / 2000) != 0 ? xtrans % 2000 : xtrans;
        ytrans = truncateD(ytrans / 1500) != 0 ? ytrans % 1500 : ytrans;
        d3.select(this)
          .attr("transform", "translate(" + xtrans + "," + ytrans + ")")
          .attr("origtrans", "translate(" + xtrans + "," + ytrans + ")")
          .attr("origvelocity", "(" + xvel + "," + yvel + ")");
      });

      if (d3.select(".animator").classed("active")) {
        requestAnimationFrame(animate);
      }
    });
  },
  function step1(progress) {
    d3.select(".animator").classed("active", false);
    d3.selectAll("g.state-container").each(function(d, i) {
      var originalPos = d3
        .select(this)
        .attr("origtrans")
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
  }
];

truncateD = function(number) {
  num = number * 1000;
  return Math[num < 0 ? "ceil" : "floor"](num) / 1000;
};
