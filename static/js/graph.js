queue()
   .defer(d3.json, "/NCT2016/data")
   .await(makeGraphs);
 
function makeGraphs(error, projectsJson) {
 
   //Clean projectsJson data
   var NCTdata = projectsJson;
   
 
 
   //Create a Crossfilter instance
   var ndx = crossfilter(NCTdata);
   //Define Dimensions
   var dateDim = ndx.dimension(function (d) {
       return d["YearOfBirth"];
 });
   var carDim = ndx.dimension(function (d) {
       return d["VehicleMake"];
   });
   var modelDim = ndx.dimension(function (d) {
       return d["VehicleModel"];
   });

   var totalTestDim = ndx.dimension(function (d) {
       return d["Total"];
   });

   var numbyDate = dateDim.group().reduceSum(function(d){ return d["Total"];});
   var carGroup = carDim.group();
   var modelGroup = modelDim.group();
   var totalTestbyManufacturer = carDim.group().reduceSum(function(d){ return d["Total"];});
   var totalTestbyModel = modelDim.group().reduceSum(function(d){ return d["Total"];});
   var PassbyDate = dateDim.group().reduceSum(function(d){ return d["PASS"];});
   var failbyDate = dateDim.group().reduceSum(function(d){ return d["FAIL"];});
   
    var eventsByDate = dateDim.group().reduce(
            function (p, v) {
                p['PASS'] += v['PASS'];
                p['FAIL'] += v['FAIL'];
                return p;
            },
            function (p, v) {
                p['PASS'] -= v['PASS'];
                p['FAIL'] -= v['FAIL'];
                return p;
            },
            function () {
                return {
                    ['PASS']: 0,
                    ['FAIL']: 0
                };
            });

    /* when any bar is clicked, recolor the chart */
    var colorRenderlet = function (_chart) {
        _chart.selectAll("rect.bar")
                .on("click", function (d) {
                    function setAttr(selection, keyName) {
                        selection.style("fill", function (d) {
                            if (d[keyName] == ['PASS']) return "#63D3FF";
                            else if (d[keyName] == ['FAIL']) return "#FF548F";
                        });
                    };
                    setAttr(_chart.selectAll("g.stack").selectAll("rect.bar"), "layer")
  setAttr(_chart.selectAll("g.dc-legend-item").selectAll("rect"), "name")
                });
    };
   

   var all = ndx.groupAll();
   var totalTests = ndx.groupAll().reduceSum(function (d) {
       return d["Total"];
   });


//    var toyotaPass = dateDim.group().reduceSum(function(d){
//        if (d['VehicleMake'] === 'TOYOTA') {
//            return +d['Total'];
//        } else {
//            return 0
//        }
//    });

//    var vwPass = dateDim.group().reduceSum(function(d){
//        if (d['VehicleMake'] === 'VOLKSWAGEN') {
//            return +d['Total'];
//        } else {
//            return 0
//        }
//    });

   var averageEmmissionFailCar = carDim.group().reduce(
        function (p, v) {
            ++p.count;
            p.total += v['Emmissions'];
            p.average = p.total / p.count;
            
            return p;
        },
        function (p, v) {
            --p.count;
            if(p.count == 0) {
                p.total = 0;
                p.average = 0;
            } else {
                p.total -= v['Emmissions'];
                p.average = p.total / p.count;
            };
            
            return p;
        },
        function () {
            return {count: 0, total: 0, average: 0};
        }
    );
    
    var averagePercentPass = carDim.group().reduce(
        function (p, v) {
            ++p.count;
            var dx = v['PASS %'] - p.mean;
            p.mean += dx / p.count;
            p.m2 += dx * (v['PASS %'] - p.mean) 
            return p;
        },
        function (p, v) {
            --p.count;
            var dx = v['PASS %'] - p.mean;
            p.mean -= dx / p.count;
            p.m2 -= dx * (v['PASS %'] - p.mean) 
            return p;
        },
        function () {
            
            return  {
               count:0,
                mean: 0,
                m2: 0,
                variance: function(){
                    return this.m2/(this.count - 1);
                },
                stdev: function(){
                    return Math.sqrt(this.variance());

                }
            };
        });
            
            
//Define values (to be used in charts)
   var minDate = dateDim.bottom(1)[0]["YearOfBirth"];
   var maxDate = dateDim.top(1)[0]["YearOfBirth"];
   var timeChart = dc.barChart("#time-chart");
   var passChart = dc.barChart("#pass-chart");
   var failChart = dc.barChart("#fail-chart");
   var manufacturerChart = dc.pieChart("#funding-chart");
   var modelChart = dc.pieChart("#model-chart");
   var totalTestsND = dc.numberDisplay("#total-donations-nd");
   var varienceND = dc.numberDisplay("#varience-nd");
   var stackChart = dc.barChart("#stack-chart");
    // var compositeChart = dc.compositeChart('#composite-chart');
    var averageEmmissionFailbyCar = dc.barChart("#average-by-name-chart");
  
//    var numberTestsND = dc.numberDisplay("#number-projects-nd");

   selectField = dc.selectMenu('#menu-select')
       .dimension(carDim)
       .group(carGroup);

   timeChart
       .width(800)
       .height(200)
       .margins({top: 10, right: 50, bottom: 30, left: 50})
       .dimension(dateDim)
       .group(numbyDate)
       .transitionDuration(500)
       .x(d3.time.scale().domain([minDate, maxDate]))
       .elasticY(true)
       .xAxisLabel("Year")
       .yAxis().ticks(4);

    passChart
       .width(800)
       .height(200)
       .margins({top: 10, right: 50, bottom: 30, left: 50})
       .dimension(dateDim)
       .group(PassbyDate)
       .transitionDuration(500)
       .x(d3.time.scale().domain([minDate, maxDate]))
       .elasticY(true)
       .xAxisLabel("Year")
       .yAxis().ticks(4);

    failChart
       .width(800)
       .height(200)
       .margins({top: 10, right: 50, bottom: 30, left: 50})
       .dimension(dateDim)
       .group(failbyDate)
       .transitionDuration(500)
       .x(d3.time.scale().domain([minDate, maxDate]))
       .elasticY(true)
       
       .yAxis().ticks(4);

manufacturerChart
       .height(220)
       .radius(90)
       .innerRadius(40)
       .transitionDuration(1500)
       .dimension(carDim)
       .group(totalTestbyManufacturer)
       .externalLabels(10);

modelChart
       .height(220)
       .radius(90)
       .innerRadius(40)
       .transitionDuration(1500)
       .dimension(modelDim)
       .group(totalTestbyModel)
       .externalLabels(10);

totalTestsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d) {
           return d;
       })
       .group(totalTests)
       .formatNumber(d3.format(".3s"));

stackChart
            .margins({top: 50, right: 20, left: 50, bottom: 50})
            .width(500)
            .height(200)
            .gap(50)
            .dimension(dateDim)
            .group(eventsByDate, "Pass")
            .valueAccessor(function (d) {
                return d.value['PASS'];
            })
            .stack(eventsByDate, "Fail", function (d) {
                return d.value['FAIL'];
            })
            
            .x(d3.time.scale().domain([minDate, maxDate]))
            .xUnits(d3.time.days)
            .centerBar(true)
            .elasticY(true)
            .brushOn(false)
            .renderlet(colorRenderlet)
            .legend(dc.legend().x(100).y(0).itemHeight(13).gap(5));

averageEmmissionFailbyCar
        .width(500)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(carDim)
        .group(averageEmmissionFailCar)
        .valueAccessor(function (p) {
            return p.value.average;
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Manufacturer")
        .yAxis().ticks(4);

varienceND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (p) {
           return p.value.stdev;
       })
       .group(averagePercentPass)
       .formatNumber(d3.format(".3s"));
    // compositeChart
    //     .width(990)
    //     .height(200)
    //     .x(d3.time.scale().domain([minDate, maxDate]))
    //     .xUnits(d3.time.days)
    //     .xAxisLabel("Year")
    //     .yAxisLabel("The Y Axis")
    //     .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
    //     .renderHorizontalGridLines(true)
    //     .compose([
    //         dc.lineChart(compositeChart)
    //             .dimension(dateDim)
    //             .colors('green')
    //             .group(toyotaPass, 'Toyota'),
    //         dc.lineChart(compositeChart)
    //             .dimension(dateDim)
    //             .colors('red')
    //             .group(vwPass, 'VW')
    //     ])
    //     .brushOn(false);

        
// numberTestsND
//        .formatNumber(d3.format("d"))
//        .valueAccessor(function (d) {
//            return d;
//        })
//        .group(all);

       dc.renderAll();
}