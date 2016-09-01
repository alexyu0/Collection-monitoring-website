
function graphResults(data, resList, use, xAxisLabel, yAxisLabel, title) {

    var minP = 0;
    var maxP = 0;
    for (var i = 0; i < data.length; i++) {
        var k = (data[i])["name"];
        var v = data[i]["value"];
        if (v < minP) {
            minP = v;
        } else if (v > maxP) {
            maxP = v;
        }
    }
 
    minP = Math.abs(minP);
    actLeft = 230 - minP/1010;

    var divisor = 1;
    while (maxP > 100) {
        maxP = Math.round(maxP / 10);
        divisor = divisor * 10;
    }

    // code from http://bl.ocks.org/mbostock/79a82f4b9bffb69d89ae
    //make margins dynamic
    if (use != "sel") {
        var margin = {top: 30, right: 190, bottom: 30, left:actLeft},
            width = parseInt(d3.select('#dataVis').style('width'),10),
            width = width - margin.left - margin.right - width/20,
            height = ((700 - margin.top - margin.bottom)/21)*resList.length;
    } else {
        var margin = {top: 30, right: 190, bottom: 30, left:actLeft},
            width = parseInt(d3.select('#dataSel').style('width'),10),
            width = width - margin.left - margin.right - width/20,
            height = 700 - margin.top - margin.bottom;
    }

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.ordinal()
        .rangeRoundBands([0, height], 0.1);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(6, 0);

    if (use != "sel") {
        $("#dataVis").append("<h3>"+title+"</h3>")
        $("#dataVis h3").attr("color", "rgba(255,255,255,0.8)");
        var svg = d3.select("#dataVis").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + ")");
    } else {
        $("#dataSel").append("<h3>"+title+"</h3>")
        $("#dataSel h3").attr("color", "rgba(255,255,255,0.8)");
        var svg = d3.select("#dataSel").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + ")");
    }

    var xExtent = d3.extent(data,function(d) { return d.value; });
    if (xExtent[0] <= 0) {
        x.domain(xExtent).nice();
    } else {
        x.domain([0,xExtent[1]]).nice();
    }
    y.domain(data.map(function(d) { return d.name; }));

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
            .attr("class", function(d) {
                return "bar bar--" + (d.value < 0 ? "negative" : "positive"); })
            .attr("x", function(d) { return x(Math.min(0, d.value)); })
            .attr("y", function(d) { return y(d.name); })
            .attr("width", function(d) { return Math.abs(x(d.value) - x(0)); })
            .attr("height", y.rangeBand())
            .attr("id", function(d) { 
                            var firstSpace = (d.name).indexOf(" ");
                            return (d.name).slice(0,firstSpace); 
                        } );

    //build dictionary for labels here
    var labelDict = {}; var labels = [];
    for (var i = 0; i < resList.length; i++) {
        var key = resList[i];
        if (!(key in labelDict)) {
            labelDict[key] = [0,0];
        }
    }
    
    for (var i = 0; i < data.length; i++) {
        var k = (data[i])["name"];
        var v = data[i]["value"];
        if (v >= 0) {
            if (labelDict[k][0] > 0) {
                labelDict[k] = [labelDict[k][0],Math.abs(v)];
            } else {
                labelDict[k] = [v, labelDict[k][1]];
            }
        } else {
            labelDict[k] = [labelDict[k][0],Math.abs(v)];
        }
    }

    var barLabels = Object.keys(labelDict);
    for (var i = 0; i < barLabels.length; i++) {
        var key = barLabels[i];
        labels.push({"name" : key, 
                     "pos" : labelDict[key][0],
                     "neg" : labelDict[key][1]})
    }
    
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    var tickNegative = svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + x(0) + ",0)")
        .call(yAxis)
        .selectAll(".tick")
        .filter(function(d, i) {
            return false; });

    tickNegative.select("line")
        .attr("x2", 6);

    tickNegative.select("text")
        .attr("x", 9)
        .style("text-anchor", "start");

    svg.selectAll(".bartext")
        .data(labels)
        .enter()
        .append("text")
        .attr("class", "bartext")
        .attr("text-anchor", "right")
        .attr("fill", "white")
        .attr("x", function(d,i) {
            var width = parseInt(d3.select("svg").style("width"),10);
            return Math.abs(x(d.pos)-x(0))+(width/50)+x(0); 
        })
        .attr("y", function(d,i) {
            var height = y.rangeBand();
            return y(d.name) + (height / 2) + (height / 8);
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "0.8em")
        .attr("fill", "rgba(255,255,255,0.7)")
        .text(function(d){
            if (use != "overall") {
                return ("(" + (d.pos).toString() + " live, " + 
                        (d.neg).toString() + " parked)");
            } else {
                return (d.pos);
            }
        });

    svg.selectAll(".tick text")
        .attr("font-family", "sans-serif")
        .attr("font-size", "0.8em")
        .attr("fill", "white")
        .attr("width", "auto")
        .text(function(d) {
            if (typeof(d) == "number") {
                if (d < 0) {
                    d = Math.abs(d);
                }
                return d / divisor;
            } else {
                return d;
            }
        });

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", function() {
            var tickHeight = parseInt(d3.select(".tick text")
                                        .style("line-height"),10);
            return height + (tickHeight * 2);
        })
        .attr("fill", "rgba(255,255,255,0.7)")
        .attr("font-size", "1em")
        .text(xAxisLabel + " (in " + divisor.toString() + "s)");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", function() {
            var max1 = 0; var max2 = 0;
            $(".tick text").each(function() {
                console.log(this.clientWidth);
                console.log(this.getBBox().width);
                console.log("next");
                if (this.getBBox().width > max1) {
                    max1 = this.getBBox().width;
                    max2 = this.clientWidth;
                }
            })
            var max = (max1 * 1.75 + max2 * 0.25) / 2;
            console.log(max);
            if (use == "overall") {
                return -max;
            } else {
                return -max * 0.8;
            }
        })
        .attr("fill", "rgba(255,255,255,0.7)")
        .attr("font-size", "1em")
        .attr("transform", "rotate(-90)")
        .text(yAxisLabel);
        
}

function makeTable(dataDict,resList,selectData,colKey,colName) {
    var resList = resList.sort(function(a,b) {
                                    aL = a.toLowerCase();
                                    bL = b.toLowerCase();
                                    if (aL < bL) {
                                        return -1;
                                    } else if (aL > bL) {
                                        return 1;
                                    }
                                    return 0;
                    });
    var columns = [colKey].concat(resList);
    var data = Object.keys(dataDict).map(
                function(key){
                    return dataDict[key];
                });

    var table = d3.select("#dataTable").append("table"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .attr("colspan", 2)
        .text(function(column) {
            return column;
            });

    $("#dataVis table thead tr:first-child th:first-child").attr(
        "colspan",1);

    //append colspan row
    var cols2 = [colName];
    for (var i = 1; i < columns.length; i++) {
        cols2 = cols2.concat([(columns[i]).concat("_live")]);
        cols2 = cols2.concat([(columns[i]).concat("_park")]);
    }
    thead.append("tr")
        .selectAll("th")
        .data(cols2)
        .enter()
        .append("th")
        .text(function(column) {
            if (column.indexOf("_live") >= 0) {
                return "Live";
            } else if (column == colName) {
                return "";
            } else {
                return "Parked";
            }
        });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr")
        .attr("rowName", function(d) { return d.Country; })
        .attr("chosen", false)
        .on("click", function(d) {
            console.log(d);
            $("#dataSel").fadeOut();
            $("#dataSel").html("");
            $("#dataSel").fadeIn();
            $("#dataTable tr").each(function() {
                $(this).attr("chosen",false)
            });
            $(this).attr("chosen", true)
            var selectRow; var title;
            if (selectData[d.Country] == null) {
                selectRow = selectData[d.Source];
                title = "Results for URLs from " + d.Source;
            } else {
                selectRow = selectData[d.Country];
                title = "Results for URLs from " + d.Country;
            }
            selectRow = selectRow.sort(function(a,b) {
                                            aL = a["name"].toLowerCase();
                                            bL = b["name"].toLowerCase();
                                            if (aL < bL) {
                                                return -1;
                                            } else if (aL > bL) {
                                                return 1;
                                            }
                                            return 0;
                                        });
            graphResults(selectRow, resList, "sel", "# of URLs", 
                        "Capture results", title);
        });

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return cols2.map(function(column) {
                return {
                    column: column, value: row[column]
                };
            });
        })
        .enter()
        .append("td")
        .html(function(d) {
            return d.value;
        });

    return table;
}
