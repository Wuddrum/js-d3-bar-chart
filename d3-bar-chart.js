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
    var container = d3.select(selector);
    if (container.empty()) {
      throw new Error("Container element not found");
    }

    container.style("position", "relative");

    var containerRect = container.node().getBoundingClientRect();

    var left = 40;
    var bottom = 115;
    var top = 20;
    var right = 10;
    var width = containerRect.width;
    var height = containerRect.height;
    var chartWidth = containerRect.width - left - right;
    var chartHeight = containerRect.height - top - bottom;

    appendBarTooltip(container);
    appendAverageTooltip(container);


    var svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", "0 0 " + width + " " + height)
      .classed("chart-svg", true);

    var chart = svg
      .append("g")
      .classed("chart", true)
      .attr("transform", "translate(" + left + "," + top + ")");

    var x0 = d3.scaleOrdinal();
    var y = d3.scaleLinear().range([chartHeight, 0]);
    
    var xAxisBottom = d3.axisBottom(x0);
    var xAxisTop = d3.axisTop(x0);
    var xAxisTopLabels = d3.axisTop(x0);
    var yAxis = d3.axisLeft(y);

    var totalEntryCount = data.length;
    var barWidth = chartWidth / totalEntryCount;

    x0.domain(data.map(getEntryKey));
    var x0Range = [0];
    var subScales = d3.nest()
      .key(getEntryKey)
      .rollup(function(d) {
        var barSpace = barWidth * d.length;
        x0Range.push(x0Range[x0Range.length - 1] + barSpace);
        return d3.scaleBand()
          .domain(d.map(getEntryWeekDateName))
          .range([0, barSpace])
          .paddingInner(0.26)
          .paddingOuter(0.13);
      })
      .map(data);

    var monthlyAverages = d3.nest()
      .key(getEntryKey)
      .rollup(function(d) {
        return d3.mean(d, function(entry) { return entry.records });
      })
      .entries(data);

    x0.range(x0Range);
    y.domain([0, d3.max(data, function(d) { return d.records; })]);

    chart.append("g")
      .attr("class", "xaxis-bottom")
      .attr("transform", "translate(0, " + chartHeight + ")")
      .call(xAxisBottom.tickFormat("").tickSize(bottom))
      .selectAll("text")
      .style("text-anchor", "middle");

    chart.append("g")
      .attr("class", "xaxis-top")
      .call(xAxisTop.tickFormat("").tickSize(top));

    chart.append("g")
      .attr("class", "xaxis-top")
      .call(xAxisTopLabels.tickSize(0))
      .selectAll("text")
      .style("text-anchor", "middle")
      .attr("transform", function(d, i) {
        var midpoint = (x0Range[i + 1] - x0Range[i]) / 2;
        return "translate(" + midpoint + ", -2)"; 
      });

    chart.append("g")
      .attr("class", "yaxis")
      .call(yAxis.tickSize(0))
      .append("text");

    chart.append("g")
      .attr("class", "horizontal-grid")
      .call(yAxis.tickSize(-chartWidth).tickFormat(""));

    chart.append("g")
      .attr("class", "vertical-grid")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(xAxisBottom.tickSize(-chartHeight).tickFormat(""));

    chart.selectAll("bar")
      .data(data)
      .enter().append("rect")
      .style("fill", "#4d79ab")
      .attr("y", function(d) { return y(d.records); })
      .attr("x", function(d) {
        var key = getEntryKey(d);
        var entryWeekDateName = getEntryWeekDateName(d);
        return x0(key) + subScales.get(key)(entryWeekDateName);
      })
      .attr("height", function(d) { return y(0) - y(d.records); })
      .attr("width", function(d) { return subScales.get(getEntryKey(d)).bandwidth(); })
      .on("mouseenter", function(d) { showBarTooltip(d); })
      .on("mousemove", function() { positionBarTooltip(d3.event.pageX, d3.event.pageY); })
      .on("mouseleave", function() { hideBarTooltip(); });

    var averageLines = chart.selectAll(".average")
      .data(monthlyAverages)
      .enter().append("g");

    averageLines.append("line")
      .attr("class", "average")
      .attr("x1", function(d, i) { return x0Range[i]; })
      .attr("y1", function(d) { return y(d.value); })
      .attr("x2", function(d, i) { return x0Range[i + 1]; })
      .attr("y2", function(d) { return y(d.value); });

    averageLines.append("line")
      .attr("class", "average-mouse-layer")
      .attr("x1", function(d, i) { return x0Range[i]; })
      .attr("y1", function(d) { return y(d.value); })
      .attr("x2", function(d, i) { return x0Range[i + 1]; })
      .attr("y2", function(d) { return y(d.value); })
      .on("mouseenter", function(d) { showAverageTooltip(d); })
      .on("mousemove", function() { positionAverageTooltip(d3.event.pageX, d3.event.pageY); })
      .on("mouseleave", function() { hideAverageTooltip(); });

    var labels = chart.selectAll(".labels")
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
        var x = x0(key) + subScales.get(key)(entryWeekDateName) + subScales.get(key).bandwidth() / 2;
        var y_ = y(0) + 10;
        return "translate(" + x + "," + y_ + "),rotate(-90)"; 
      });
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

  function getAbsoluteCoordinates(x, y) {
    var chart = d3.select(selector + " .chart");
    var bodyRect = document.body.getBoundingClientRect();
    var chartRect = chart.node().getBoundingClientRect();

    var absX = bodyRect.left - chartRect.left + x;
    var absY = bodyRect.top - chartRect.top + y;

    return [absX, absY];
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