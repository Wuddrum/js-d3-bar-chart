function D3BarChart(options) {
  validateOptions(options);

  var MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  var data = options.data;
  var selector = options.selector;

  this.render = function() {
    var ctx = {}
    ctx.container = getContainer(selector);
    ctx.containerRect = ctx.container.node().getBoundingClientRect();
    ctx.left = 40;
    ctx.bottom = 115;
    ctx.top = 20;
    ctx.right = 10;
    ctx.width = ctx.containerRect.width;
    ctx.height = ctx.containerRect.height;
    ctx.chartWidth = ctx.containerRect.width - ctx.left - ctx.right;
    ctx.chartHeight = ctx.containerRect.height - ctx.top - ctx.bottom;

    appendBarTooltip(ctx.container);
    appendAverageTooltip(ctx.container);

    ctx.svg = ctx.container
      .append("svg")
      .attr("width", ctx.width)
      .attr("height", ctx.height)
      .attr("viewBox", "0 0 " + ctx.width + " " + ctx.height)
      .classed("chart-svg", true);

    ctx.chart = ctx.svg
      .append("g")
      .classed("chart", true)
      .attr("transform", "translate(" + ctx.left + "," + ctx.top + ")");

    ctx.x0 = d3.scaleOrdinal().domain(data.map(getEntryKey));
    ctx.y = d3.scaleLinear().range([ctx.chartHeight, 0]);
    
    ctx.xAxisBottom = d3.axisBottom(ctx.x0);
    ctx.xAxisTop = d3.axisTop(ctx.x0);
    ctx.xAxisTopLabels = d3.axisTop(ctx.x0);
    ctx.yAxis = d3.axisLeft(ctx.y);

    ctx.totalEntryCount = data.length;
    ctx.barWidth = ctx.chartWidth / ctx.totalEntryCount;

    ctx.x0Range = [0];
    ctx.xSubScales = d3.nest()
      .key(getEntryKey)
      .rollup(function(d) {
        var barSpace = ctx.barWidth * d.length;
        ctx.x0Range.push(ctx.x0Range[ctx.x0Range.length - 1] + barSpace);
        return d3.scaleBand()
          .domain(d.map(getEntryWeekDateName))
          .range([0, barSpace])
          .paddingInner(0.26)
          .paddingOuter(0.13);
      })
      .map(data);

    ctx.x0.range(ctx.x0Range);
    ctx.y.domain([0, d3.max(data, function(d) { return d.records; })]);

    renderChartAxisAndLabels(ctx);
    renderChartGrid(ctx);
    renderBars(ctx);
    renderAverageLines(ctx);
  }

  function renderChartAxisAndLabels(ctx) {
    ctx.chart.append("g")
      .attr("class", "xaxis-bottom")
      .attr("transform", "translate(0, " + ctx.chartHeight + ")")
      .call(ctx.xAxisBottom.tickFormat("").tickSize(ctx.bottom))
      .selectAll("text")
      .style("text-anchor", "middle");

    ctx.chart.append("g")
      .attr("class", "xaxis-top")
      .call(ctx.xAxisTop.tickFormat("").tickSize(ctx.top));

    ctx.chart.append("g")
      .attr("class", "xaxis-top")
      .call(ctx.xAxisTopLabels.tickSize(0))
      .selectAll("text")
      .style("text-anchor", "middle")
      .attr("transform", function(d, i) {
        var midpoint = (ctx.x0Range[i + 1] - ctx.x0Range[i]) / 2;
        return "translate(" + midpoint + ", -2)"; 
      });

    ctx.chart.append("g")
      .attr("class", "yaxis")
      .call(ctx.yAxis.tickSize(0))
      .append("text");

    var labels = ctx.chart.selectAll(".labels")
      .data(data)
      .enter().append("g");

    labels.append("text")
      .text(function(d) {
        var entryWeekDateName = getEntryWeekDateName(d);
        return entryWeekDateName;
      })
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "1%")
      .style("alignment-baseline", "bottom")
      .attr("class", "bottom-label")
      .attr("transform", function(d) {
        var key = getEntryKey(d);
        var entryWeekDateName = getEntryWeekDateName(d);
        var x = ctx.x0(key) + ctx.xSubScales.get(key)(entryWeekDateName) + ctx.xSubScales.get(key).bandwidth() / 2;
        var y_ = ctx.y(0) + 10;
        return "translate(" + x + "," + y_ + "),rotate(-90)";
      });
  }

  function renderChartGrid(ctx) {
    ctx.chart.append("g")
    .attr("class", "horizontal-grid")
    .call(ctx.yAxis.tickSize(-ctx.chartWidth).tickFormat(""));

    ctx.chart.append("g")
      .attr("class", "vertical-grid")
      .attr("transform", "translate(0," + ctx.chartHeight + ")")
      .call(ctx.xAxisBottom.tickSize(-ctx.chartHeight).tickFormat(""));
  }

  function renderBars(ctx) {
    ctx.chart.selectAll("bar")
      .data(data)
      .enter().append("rect")
      .style("fill", "#4d79ab")
      .attr("y", function(d) { return ctx.y(d.records); })
      .attr("x", function(d) {
        var key = getEntryKey(d);
        var entryWeekDateName = getEntryWeekDateName(d);
        return ctx.x0(key) + ctx.xSubScales.get(key)(entryWeekDateName);
      })
      .attr("height", function(d) { return ctx.y(0) - ctx.y(d.records); })
      .attr("width", function(d) { return ctx.xSubScales.get(getEntryKey(d)).bandwidth(); })
      .on("mouseenter", function(d) { showBarTooltip(d); })
      .on("mousemove", function() { positionBarTooltip(d3.event.pageX, d3.event.pageY); })
      .on("mouseleave", function() { hideBarTooltip(); });
  }

  function renderAverageLines(ctx) {
    var monthlyAverages = d3.nest()
      .key(getEntryKey)
      .rollup(function(d) {
        return d3.mean(d, function(entry) { return entry.records });
      })
      .entries(data);

    var averageLines = ctx.chart.selectAll(".average")
      .data(monthlyAverages)
      .enter().append("g");

    averageLines.append("line")
      .attr("class", "average")
      .attr("x1", function(d, i) { return ctx.x0Range[i]; })
      .attr("y1", function(d) { return ctx.y(d.value); })
      .attr("x2", function(d, i) { return ctx.x0Range[i + 1]; })
      .attr("y2", function(d) { return ctx.y(d.value); });

    averageLines.append("line")
      .attr("class", "average-mouse-layer")
      .attr("x1", function(d, i) { return ctx.x0Range[i]; })
      .attr("y1", function(d) { return ctx.y(d.value); })
      .attr("x2", function(d, i) { return ctx.x0Range[i + 1]; })
      .attr("y2", function(d) { return ctx.y(d.value); })
      .on("mouseenter", function(d) { showAverageTooltip(d); })
      .on("mousemove", function() { positionAverageTooltip(d3.event.pageX, d3.event.pageY); })
      .on("mouseleave", function() { hideAverageTooltip(); });
  }

  function showBarTooltip(entry) {
    var tooltip = d3.select(selector + " .bar-tooltip");

    var monthDateValue = getEntryKey(entry);
    var weekDateValue = getEntryWeekDateName(entry);
    var recordsValue = entry.records;

    tooltip.select(".month-date-container > .value").text(monthDateValue);
    tooltip.select(".week-date-container > .value").text(weekDateValue);
    tooltip.select(".records-container > .value").text(recordsValue);

    tooltip.classed("active", true);
  }

  function hideBarTooltip() {
    var tooltip = d3.select(selector + " .bar-tooltip");
    tooltip.classed("active", false);
  }

  function positionBarTooltip(x, y) {
    var absCoords = getAbsoluteCoordinates(x, y);
    var tooltip = d3.select(selector + " .bar-tooltip");
    tooltip.style("transform", "translate(" + (absCoords[0] + 20) + "px, " + (absCoords[1] + 10) + "px)");
  }

  function showAverageTooltip(entry) {
    var tooltip = d3.select(selector + " .average-tooltip");
    var averageValue = Math.round(entry.value);

    tooltip.select(".average-container > .value").text(averageValue);
    tooltip.classed("active", true);
  }

  function hideAverageTooltip() {
    var tooltip = d3.select(selector + " .average-tooltip");
    tooltip.classed("active", false);
  }

  function positionAverageTooltip(x, y) {
    var absCoords = getAbsoluteCoordinates(x, y);
    var tooltip = d3.select(selector + " .average-tooltip");
    tooltip.style("transform", "translate(" + (absCoords[0] + 20) + "px, " + (absCoords[1] + 10) + "px)");
  }

  function appendBarTooltip(container) {
    var tooltip = container.append("div").classed("bar-tooltip", true)
    var tooltipContainer = tooltip.append("div")
      .classed("tooltip-container", true);
    var tooltipCard = tooltipContainer.append("div")
      .classed("tooltip-card", true);

    var monthDateDiv = tooltipCard.append("div")
      .classed("month-date-container", true);
    monthDateDiv.append("span")
      .classed("title", true)
      .text("Month of Date/Time: ");
    monthDateDiv.append("span")
      .classed("value", true)
      .text("");

    var weekDateDiv = tooltipCard.append("div")
      .classed("week-date-container", true);
    weekDateDiv.append("span")
      .classed("title", true)
      .text("Week of Date/Time: ");
    weekDateDiv.append("span")
      .classed("value", true)
      .text("");

    var recordsDiv = tooltipCard.append("div")
      .classed("records-container", true);
    recordsDiv.append("span")
      .classed("title", true)
      .text("Number of Records: ");
    recordsDiv.append("span")
      .classed("value", true)
      .text("");
  }

  function appendAverageTooltip(container) {
    var tooltip = container.append("div").classed("average-tooltip", true)
    var tooltipContainer = tooltip.append("div")
      .classed("tooltip-container", true);
    var tooltipCard = tooltipContainer.append("div")
      .classed("tooltip-card", true);

    var monthDateDiv = tooltipCard.append("div")
      .classed("average-container", true);
    monthDateDiv.append("span")
      .classed("title", true)
      .text("Average = ");
    monthDateDiv.append("span")
      .classed("value", true)
      .text("");
  }

  function getContainer(selector) {
    var container = d3.select(selector);
    if (container.empty()) {
      throw new Error("Container element not found");
    }

    container.style("position", "relative");

    return container;
  }

  function getAbsoluteCoordinates(x, y) {
    var chart = d3.select(selector + " .chart");
    var bodyRect = document.body.getBoundingClientRect();
    var chartRect = chart.node().getBoundingClientRect();

    var absX = bodyRect.left - chartRect.left + x;
    var absY = bodyRect.top - chartRect.top + y;

    return [absX, absY];
  }

  function getEntryWeekDateName(entry) {
    var date = entry.weekDate.getDate();
    var month = entry.weekDate.getMonth();
    var year = entry.weekDate.getFullYear();

    return MONTHS[month] + " " + date + ", " + year;
  }

  function getEntryKey(entry) {
    var midWeekDate = new Date(entry.weekDate.getTime());
    midWeekDate.setDate(entry.weekDate.getDate() + 3);

    return MONTHS[midWeekDate.getMonth()] + " " + midWeekDate.getFullYear();
  }

  function validateOptions(options) {
    if (typeof options === "undefined") {
      throw new Error("No options object passed");
    }

    if (typeof options.data === "undefined") {
      throw new Error("No data passed with options");
    }

    if (typeof options.selector === "undefined") {
      throw new Error("No selector passed with options");
    }
  }
}