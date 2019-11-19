const scroller = scrollama();
const years = [2017, 2016, 2015, 2014, 2013, 2012];
let PUMAdata,
  stateData = [],
  colorGuide,
  pathels,
  statels,
  sim,
  simNodes = [];

const stateviewcolors = d3
  .scaleLinear()
  .domain([-1, 0, 1])
  .range(["rgb(253, 204, 171)", "rgb(255, 252, 247)", "rgb(201, 228, 138)"]);

const mapcolors = d3
  .scaleLinear()
  .domain([0, 0.5, 1, 2, 10])
  .range([
    "rgb(255, 199, 14)",
    "rgb(255, 199, 14)",
    "rgb(255, 255, 255)",
    "rgb(0, 117, 137)",
    "rgb(0, 117, 137)"
  ]);
const hotspotcolors = d3
  .scaleLinear()
  .domain([-10, -1.5, 0, 1.5, 10])
  .range([
    "rgb(255, 199, 14)",
    "rgb(255, 199, 14)",
    "rgb(255, 255, 255)",
    "rgb(0, 117, 137)",
    "rgb(0, 117, 137)"
  ]);

const regions = [
  {
    region: "Southwest",
    states: ["Arizona", "New Mexico", "Texas"],
    abb: ["AZ", "NM", "TX]"]
  },
  {
    region: "West",
    states: [
      "Alaska",
      "California",
      "Colorado",
      "Hawaii",
      "Idaho",
      "Montana",
      "Nevada",
      "Oregon",
      "Utah",
      "Washington",
      "Wyoming"
    ],
    abb: ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"]
  },
  {
    region: "Northeast",
    states: [
      "Connecticut",
      "Delaware",
      "Maine",
      "Massachusetts",
      "New Hampshire",
      "New Jersey",
      "New York",
      "Pennsylvania",
      "Rhode Island",
      "Vermont"
    ],
    abb: ["CT", "DE", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"]
  },
  {
    region: "Southeast",
    states: [
      "Alabama",
      "Arkansas",
      "District of Columbia",
      "Florida",
      "Georgia",
      "Kentucky",
      "Louisiana",
      "Maryland",
      "Mississippi",
      "North Carolina",
      "South Carolina",
      "Tennessee",
      "Virginia",
      "West Virginia"
    ],
    abb: [
      "AL",
      "AR",
      "DC",
      "FL",
      "GA",
      "KY",
      "LA",
      "MD",
      "MS",
      "NC",
      "SC",
      "TN",
      "VA",
      "WV"
    ]
  },
  {
    region: "Midwest",
    states: [
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Michigan",
      "Minnesota",
      "Missouri",
      "Nebraska",
      "North Dakota",
      "Ohio",
      "Oklahoma",
      "South Dakota",
      "Wisconsin"
    ],
    abb: [
      "IL",
      "IN",
      "IA",
      "KS",
      "MI",
      "MN",
      "MO",
      "NE",
      "ND",
      "OH",
      "OK",
      "SD",
      "WI"
    ]
  }
];

function init() {
  regions.forEach(region =>
    d3
      .select("#map-group")
      .append("g")
      .attr("id", region.region)
      .attr("class", "region-container")
  );

  d3.json("data/map_data.json")
    .then(
      function(map_data) {
        let subunits = topojson.feature(
          map_data,
          map_data.objects.ipums_puma_2010
        );
        let projection = d3
          .geoAlbers()
          .scale(2000)
          .translate([1000, 800]);
        let path = d3.geoPath().projection(projection);

        subunits.features.forEach(element => {
          let state = element.properties.State;
          let region = regions.filter(n => n.states.includes(state))[0].region;
          let sname = state.replace(/\s/g, "") + "Group";
          if (document.getElementById(sname) == null) {
            let pathel;
            let groupel = document
              .getElementById(region)
              .appendChild(document.createElement("g"));
            groupel.id = sname;
            groupel.classList.add("state-container");

            if ((sname == "AlaskaGroup") | (sname == "HawaiiGroup")) {
              let sizer = groupel.appendChild(document.createElement("g"));
              sizer.classList.add(sname + "Sizer");
              pathel = sizer.appendChild(document.createElement("path"));
            } else {
              pathel = groupel.appendChild(document.createElement("path"));
            }
            pathel.setAttribute("d", path(element));
            pathel.setAttribute("id", element.properties.GEOID);
          } else {
            if ((sname == "AlaskaGroup") | (sname == "HawaiiGroup")) {
              pathel = document
                .getElementsByClassName(sname + "Sizer")[0]
                .appendChild(document.createElement("path"));
            } else {
              pathel = document
                .getElementById(sname)
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
        let elem = d3.select(this);
        let bbox = elem.node().getBBox();
        let xpos = bbox.x + bbox.width / 2;
        let ypos = bbox.y + bbox.height / 2;
        let xtrans = truncateD(2000 * Math.random() - xpos);
        let ytrans = truncateD(1500 * Math.random() - ypos);
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
        pathels = d3.selectAll("g.region-container path");
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
          createTimeline();
          addDotLabels();
          createStateData();
          createStateElems();

          let nonProgressSteps = [0, 2, 8, 9];

          let elements = document.querySelectorAll(".sticky");

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

let steps = [
  function step0() {
    d3.select(".animator").classed("active", true);
    window.requestAnimationFrame(function animate() {
      if (d3.select(".animator").classed("active")) {
        d3.selectAll(".state-container").each(function() {
          let prevTran = d3
            .select(this)
            .attr("prevtrans")
            .replace(/[^\d-,.]/g, "")
            .split(",");

          let velocity = d3
            .select(this)
            .attr("prevvelocity")
            .replace(/[^\d-,.]/g, "")
            .split(",");

          let origPos = d3
            .select(this)
            .attr("origpos")
            .replace(/[^\d-,.]/g, "")
            .split(",");

          let xvel = truncateD(
            Math.max(
              Math.min(Number(velocity[0]) + 0.2 * (Math.random() - 0.5), 1),
              -1
            )
          );
          let yvel = truncateD(
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
          let xtrans = truncateD(Number(prevTran[0]) + xvel);
          let ytrans = truncateD(Number(prevTran[1]) + yvel);

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
      let originalPos = d3
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
    pathels.style("fill", d => {
      fillVals = mapcolors(d.score_2012)
        .replace(/[^\d-,.]/g, "")
        .split(",");
      return (
        "rgb(" +
        (progress * fillVals[0] + (1 - progress) * 255) +
        "," +
        (progress * fillVals[1] + (1 - progress) * 218) +
        "," +
        (progress * fillVals[2] + (1 - progress) * 188) +
        ")"
      );
    });

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
    pathels
      .style("fill", d => {
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
      })
      .style("stroke-width", 0.4 * (1 - progress) + "px");
    d3.select("#scaleLabels1").style("opacity", 1 - progress);
    d3.select("#scaleLabels2").style("opacity", progress);
  },
  function step6(progress) {
    pathels.style("stroke-width", 4 * progress * (1 - progress) * 0.6 + "px");
    statels.each(function(d) {
      let scaler =
        4 * progress * (1 - progress) * truncateD(d.immigcount_2017) +
        (1 - 4 * progress * (1 - progress));
      elem = d3.select(this);
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
      t = d3
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut);

      d3.selectAll(".region-container")
        .transition(t)
        .attr("transform", "translate(0, 0) scale(1)");
      d3.select("#overall-under-num").style("opacity", 1);
      d3.select("#overall-over-num").style("opacity", 1);
      d3.select("#timeline-group")
        .transition(t)
        .style("opacity", 1);
      d3.selectAll(".cat-lab1")
        .transition(t)
        .attr("x", 450);
      d3.selectAll(".cat-lab2")
        .transition(t)
        .attr("x", 1550);
      d3.select("#region-labels")
        .transition(t)
        .style("opacity", 0);
    }
    pathels.style("stroke-width", "0px");
  },
  function step8() {
    if (d3.select("#region-labels").nodes().length == 0) addRegionLabels();
    t = d3
      .transition()
      .duration(1000)
      .ease(d3.easeQuadInOut);

    d3.select("#Southwest")
      .transition(t)
      .attr("transform", "translate(200, 120) scale(0.3)");

    d3.select("#West")
      .transition(t)
      .attr("transform", "translate(300, 470) scale(0.25)");

    d3.select("#Northeast")
      .transition(t)
      .attr("transform", "translate(-250, 680) scale(0.45)");

    d3.select("#Southeast")
      .transition(t)
      .attr("transform", "translate(50, 900) scale(0.3)");

    d3.select("#Midwest")
      .transition(t)
      .attr("transform", "translate(150, 1250) scale(0.25)");

    d3.select("#map-group")
      .transition(t)
      .style("opacity", 1);
    d3.select("#color-guide-group")
      .transition(t)
      .style("opacity", 1);
    d3.select("#region-labels")
      .transition(t)
      .style("opacity", 1);
    pathels
      .transition(t)
      .delay(1500)
      .style("stroke-width", "1px");
    d3.select("#overall-under-num")
      .transition(t)
      .style("opacity", 0);
    d3.select("#overall-over-num")
      .transition(t)
      .style("opacity", 0);
    d3.select("#timeline-group")
      .transition(t)
      .style("opacity", 0);
    d3.select("#cat-labels")
      .transition(t)
      .style("opacity", 1);
    d3.selectAll(".cat-lab1")
      .transition(t)
      .attr("x", 1000);
    d3.selectAll(".cat-lab2")
      .transition(t)
      .attr("x", 1800);
    d3.select("#state-view-group")
      .transition(t)
      .style("opacity", 0);

    if (sim.step != "region") regionDotPlot();
  },
  function step9() {
    if (sim.step != "state1") {
      t = d3
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut);

      d3.select("#region-labels")
        .transition(t)
        .style("opacity", 0);
      d3.select("#map-group")
        .transition(t)
        .style("opacity", 0);
      d3.select("#color-guide-group")
        .transition(t)
        .style("opacity", 0);
      d3.select("#cat-labels")
        .transition(t)
        .style("opacity", 0);
      d3.select("#state-view-group")
        .transition(t)
        .style("opacity", 1);
      changeStateGrid(1);
    }
  },
  function step10(progress) {
    t = d3
      .transition()
      .duration(500)
      .ease(d3.easeQuadInOut);

    d3.select("#state-slider").attr(
      "d",
      "M" +
        (250 + 1500 * progress) +
        " 170 L" +
        (230 + 1500 * progress) +
        " 150 L" +
        (270 + 1500 * progress) +
        " 150"
    );

    if ((progress < 0.25) & (sim.step != "state1")) {
      d3.select("#region-labels")
        .transition(t)
        .style("opacity", 0);
      d3.select("#map-group")
        .transition(t)
        .style("opacity", 0);
      d3.select("#color-guide-group")
        .transition(t)
        .style("opacity", 0);
      d3.select("#cat-labels")
        .transition(t)
        .style("opacity", 0);
      d3.select("#state-view-group")
        .transition(t)
        .style("opacity", 1);
      changeStateGrid(1);
    } else if ((progress > 0.25) & (progress < 0.5) & (sim.step != "state2")) {
      changeStateGrid(2);
    } else if ((progress > 0.5) & (progress < 0.75) & (sim.step != "state3")) {
      changeStateGrid(3);
    } else if ((progress > 0.75) & (progress < 1) & (sim.step != "state4")) {
      changeStateGrid(4);
    }
  }
];

function createStateData() {
  const states = [].concat(...regions.map(r => r.states));
  const region = [].concat(...regions.map(r => r.abb));
  states
    .map((state, i) => ({ a: state, b: region[i] }))
    .forEach(function(state) {
      let pumas = PUMAdata.filter(row => row.State == state.a);
      stateData.push({
        state: state.a,
        abb: state.b == "TX]" ? "TX" : state.b,
        ppProp: truncateD(
          pumas.filter(row => row.score_2017 > 1).length / pumas.length
        ),
        piProp: truncateD(
          pumas
            .filter(row => row.score_2017 > 1)
            .reduce((acc, cur) => acc + cur.immigcount_2017, 0) /
            pumas.reduce((acc, cur) => acc + cur.immigcount_2017, 0)
        ),
        npProp: truncateD(
          pumas.filter(row => row.score_2017 < 1).length / pumas.length
        ),
        niProp: truncateD(
          pumas
            .filter(row => row.score_2017 < 1)
            .reduce((acc, cur) => acc + cur.immigcount_2017, 0) /
            pumas.reduce((acc, cur) => acc + cur.immigcount_2017, 0)
        )
      });
    });
}

function changeStateGrid(selector) {
  container = d3.select("#state-view-group");
  let varSel, mulSel;
  switch (selector) {
    case 1:
      varSel = "ppProp";
      mulSel = 1;
      break;
    case 2:
      varSel = "piProp";
      mulSel = 1;
      break;
    case 3:
      varSel = "npProp";
      mulSel = -1;
      break;
    case 4:
      varSel = "niProp";
      mulSel = -1;
      break;
  }
  stateData.sort((a, b) => b[varSel] - a[varSel]);

  let t = d3
    .transition()
    .duration(750)
    .ease(d3.easeQuadInOut);

  d3.selectAll(".state-view-labels").style("opacity", 0.4);
  d3.selectAll(".state-label-" + selector).style("opacity", 1);

  let w = (1900 - 100) / 9;
  let h = (1400 - 300) / 6;
  boxData = d3
    .select("#state-view-group")
    .selectAll(".boxes")
    .data(stateData);
  boxData
    .enter()
    .append("rect")
    .attr("class", "boxes")
    .merge(boxData)
    .attr("x", (d, i) => 100 + (i % 9) * w)
    .attr("y", (d, i) => 300 + Math.floor(i / 9) * h)
    .attr("width", w)
    .attr("height", h)
    .attr("stroke", "rgb(128, 128, 128, 0.3)")
    .transition(t)
    .attr("fill", d => stateviewcolors(mulSel * d[varSel]))
    .attr("fill-opacity", 1)
    .style("opacity", 0.5);

  textData = d3
    .select("#state-view-group")
    .selectAll(".labels")
    .data(stateData, d => d.abb);
  textData
    .enter()
    .append("text")
    .attr("class", "text labels")
    .attr("text-anchor", "middle")
    .merge(textData)
    .attr("id", d => d.state.replace(/\s/g, "") + "-label")
    .transition(t)
    .delay((d, i) => i * 25)
    .attr("x", (d, i) => 100 + (0.5 + (i % 9)) * w)
    .attr("y", (d, i) => truncateD(300 + (0.95 + Math.floor(i / 9)) * h))
    .style("font-size", "30px")
    .style("fill", "grey")
    .tween("text", function(d, i) {
      let selection = d3.select(this);
      let start = selection.text().replace(/[^\d-,.]/g, "");
      let end = 100 * d[varSel];
      let interpolator = d3.interpolateNumber(start, end);
      return function(t) {
        selection.text(d.abb + " " + truncateD(interpolator(t), 2) + "%");
      };
    });

  sim.step = "state" + selector;
  sim
    .alpha(1)
    .restart()
    .force("axis", null)
    .force("positioning", null)
    .force(
      "px",
      d3
        .forceX(d => {
          if (mulSel * d.score_2017 > mulSel) {
            let ind = stateData.findIndex(n => n.state == d.State);
            return (0.5 + (ind % 9)) * w - 900;
          } else {
            return 600;
          }
        })
        .strength(0.08)
    )
    .force(
      "py",
      d3
        .forceY(d => {
          if (mulSel * d.score_2017 > mulSel) {
            let ind = stateData.findIndex(n => n.state == d.State);
            return (0.7 + Math.floor(ind / 9)) * h - 950;
          } else {
            return 200;
          }
        })
        .strength(0.08)
    )
    .force("box", boxingForce);

  function boxingForce() {
    for (let node of simNodes) {
      if (mulSel * node.score_2017 > mulSel) {
        let ind = stateData.findIndex(n => n.state == node.State);
        node.y = Math.min((0.7 + Math.floor(ind / 9)) * h - 950, node.y);
      } else {
        node.y = Math.min(200, node.y);
      }
    }
  }
}

function createStateElems() {
  container = d3.select("#state-view-group");

  container
    .append("path")
    .attr("id", "state-slider")
    .attr("d", "M250 170 L230 150 L270 150")
    .attr("fill", "grey");

  container
    .append("text")
    .attr("class", "text")
    .attr("x", 250)
    .attr("y", 100)
    .style("font-size", "45px")
    .style("fill", "grey")
    .text("Percentage by state of:");

  lines = [
    [
      "over-contributing",
      "immigrants in",
      "under-contributing",
      "immigrants in"
    ],
    ["PUMAs", "over-contributing", "PUMAs", "under-contributing"],
    ["", "PUMAs", "", "PUMAs"]
  ];
  for (let i = 0; i < 4; i++) {
    container
      .append("line")
      .attr("x1", 250 + i * 375)
      .attr("x2", 250 + i * 375)
      .attr("y1", 260)
      .attr("y2", 170)
      .style("stroke", "grey")
      .style("stroke-width", "2");
    for (let j = 0; j < 3; j++) {
      container
        .append("text")
        .attr("class", "text state-view-labels state-label-" + (i + 1))
        .attr("text-anchor", "middle")
        .attr("x", 250 + (i + 0.5) * 375)
        .attr("y", 200 + j * 25 + (i % 2 == 0 ? 12.5 : 0))
        .style("font-size", "30px")
        .style("fill", "grey")
        .style("opacity", 0.4)
        .text(lines[j][i]);
    }
  }
  container
    .append("line")
    .attr("x1", 1750)
    .attr("x2", 1750)
    .attr("y1", 260)
    .attr("y2", 170)
    .style("stroke", "grey")
    .style("stroke-width", "2");
}

function addRegionLabels() {
  container = d3
    .select("#dot-container")
    .append("g")
    .attr("id", "region-labels")
    .style("opacity", 0);

  for (let i = 0; i < 5; i++) {
    container
      .append("text")
      .attr("class", "text")
      .attr("x", 575)
      .attr("y", 175 + i * 250)
      .style("font-size", "45px")
      .style("fill", "grey")
      .text(regions[i].region);

    container
      .append("text")
      .attr("class", "text")
      .attr("x", 575)
      .attr("y", 235 + i * 250)
      .style("font-size", "25px")
      .style("fill", "grey")
      .text("[" + regions[i].abb.slice(0, 7).toString());

    if (regions[i].abb.length > 7) {
      container
        .append("text")
        .attr("class", "text")
        .attr("x", 590)
        .attr("y", 260 + i * 250)
        .style("font-size", "25px")
        .style("fill", "grey")
        .text(regions[i].abb.slice(7).toString() + "]");
    }

    container
      .append("text")
      .attr("class", "text")
      .attr("x", 1000)
      .attr("y", 260 + i * 250)
      .style("font-size", "35px")
      .style("fill", "grey")
      .text(
        truncateD(
          (100 *
            PUMAdata.filter(
              n => (n.region == regions[i].region) & (n.score_2017 < 1)
            ).length) /
            PUMAdata.filter(n => n.region == regions[i].region).length,
          2
        ) + "%"
      );

    container
      .append("text")
      .attr("class", "text")
      .attr("x", 1700)
      .attr("y", 260 + i * 250)
      .style("font-size", "35px")
      .style("fill", "grey")
      .text(
        truncateD(
          (100 *
            PUMAdata.filter(
              n => (n.region == regions[i].region) & (n.score_2017 > 1)
            ).length) /
            PUMAdata.filter(n => n.region == regions[i].region).length,
          2
        ) + "%"
      );
  }
}

function addDotLabels() {
  container = d3
    .select("#dot-container")
    .append("g")
    .attr("id", "timeline-dot-text");
  labels = container.append("g").attr("id", "cat-labels");
  container
    .append("text")
    .attr("id", "overall-under-num")
    .attr("class", "text")
    .attr("x", 450)
    .attr("y", 1320)
    .style("font-size", "45px")
    .style("fill", "grey")
    .text("");
  labels
    .append("text")
    .attr("class", "text cat-lab1")
    .attr("x", 450)
    .attr("y", 1360)
    .style("fill", "grey")
    .style("font-size", "25px")
    .text("PUMAs with immigrants");
  labels
    .append("text")
    .attr("class", "text cat-lab1")
    .attr("x", 450)
    .attr("y", 1390)
    .style("fill", "grey")
    .style("font-size", "25px")
    .text("under-contributing");

  container
    .append("text")
    .attr("id", "overall-over-num")
    .attr("class", "text")
    .attr("x", 1550)
    .attr("y", 1320)
    .attr("text-anchor", "end")
    .style("font-size", "45px")
    .style("fill", "grey")
    .text("");
  labels
    .append("text")
    .attr("class", "text cat-lab2")
    .attr("x", 1550)
    .attr("y", 1360)
    .attr("text-anchor", "end")
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("PUMAs with immigrants");
  labels
    .append("text")
    .attr("class", "text cat-lab2")
    .attr("x", 1550)
    .attr("y", 1390)
    .attr("text-anchor", "end")
    .style("font-size", "25px")
    .style("fill", "grey")
    .text("over-contributing");
}

function regionDotPlot() {
  sim.step = "region";
  sim
    .alpha(0.3)
    .restart()
    .force(
      "axis",
      d3
        .forceY(d => {
          switch (d.region) {
            case "Southwest":
              return -1050;
            case "West":
              return -800;
            case "Northeast":
              return -550;
            case "Southeast":
              return -300;
            case "Midwest":
              return -50;

            default:
              return 10;
          }
        })
        .strength([0.3])
    )
    .force("py", null)
    .force("px", null)
    .force("box", null)
    .force(
      "positioning",
      d3
        .forceX(d => {
          score = Math.min(
            900,
            Math.max(-100, 400 + 750 * (d["score_2017"] - 1))
          );
          return score;
        })
        .strength([1])
    );
}

function createDotPlot(step, alpha = 0.3) {
  let scoreSel = "score_" + years[5 - step];
  let countSel = "immigcount_" + years[5 - step];

  let oldNodes = simNodes;
  simNodes = PUMAdata.filter(n => n[scoreSel] != 1);

  if (oldNodes.length == 0) {
    sim = d3.forceSimulation(simNodes);
    simNodes.forEach(function(node) {
      node.x = 500 * Math.min(1, Math.max(-1, node[scoreSel] - 1));
      node.y = Math.random() * 50 - 25;
    });

    sim
      .alpha(alpha)
      .alphaDecay([0.03])
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
      .alpha(alpha)
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
      .force("axis", d3.forceY(10).strength([0.3]))
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

  function boxingForce() {
    dx = 500;
    dy = 150;
    for (let node of simNodes) {
      node.x = Math.max(-dx, Math.min(dx, node.x));
      node.y = Math.max(-dy, Math.min(dy, node.y));
    }
  }

  sim.step = step;

  let dotContainer = d3.select("#dot-container");
  let dotData = dotContainer.selectAll(".dots").data(simNodes, d => d.GEOID);
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

  dotData
    .exit()
    .transition()
    .duration(1000)
    .attr("r", 0)
    .remove();

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

  d3.select("#overall-under-num")
    .transition()
    .duration(1000)
    .tween("text", function() {
      let selection = d3.select(this);
      let start = d3
        .select(this)
        .text()
        .replace(/[^\d-,.]/g, "");
      let end = simNodes.filter(n => n[scoreSel] < 1).length / 23.51;
      let interpolator = d3.interpolateNumber(start, end);
      return function(t) {
        selection.text(truncateD(interpolator(t), 2) + "%");
      };
    });

  d3.select("#overall-over-num")
    .transition()
    .duration(1000)
    .tween("text", function() {
      let selection = d3.select(this);
      let start = d3
        .select(this)
        .text()
        .replace(/[^\d-,.]/g, "");
      let end = simNodes.filter(n => n[scoreSel] > 1).length / 23.51;
      let interpolator = d3.interpolateNumber(start, end);
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

  for (let i = 0; i < years.length; i++) {
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
