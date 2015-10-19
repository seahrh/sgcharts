// Page script
// Requires Jquery, Moment, Numeral, Google Charts

( function(Page, $, undefined) {
        var Log, Chart, bidPsmData, bidData, schema, hawkerCentreMap, chartWrapperMap, stallTypes, dimensions, plotColumns, selectedStallType, selectedDimension;
        Chart = sgcharts.Chart;
        Log = sgcharts.Log;
        schema = ["Hawker Centre", "Stall Type", "Year", "Count", "Min", "Max", "Median", "Average"];
        hawkerCentreMap = {
            "AMOY STREET FOOD CENTRE" : $("#amoy-street-food-centre"),
            "BEO CRESCENT MARKET" : $("#beo-crescent-market"),
            "BERSEH FOOD CENTRE" : $("#berseh-food-centre"),
            "BLK 665 BUFFALO ROAD" : $("#blk-665-buffalo-road"),
            "BLK 1 JALAN KUKOH" : $("#blk-1-jalan-kukoh"),
            "BLK 11 TELOK BLANGAH CRESCENT" : $("#blk-11-telok-blangah-crescent"),
            "BLK 112 JALAN BUKIT MERAH" : $("#blk-112-jalan-bukit-merah"),
            "BLK 115 BUKIT MERAH VIEW" : $("#blk-115-bukit-merah-view"),
            "BLK 117 ALJUNIED AVENUE 2" : $("#blk-117-aljunied-avenue-2"),
            "BLK 120 BUKIT MERAH LANE 1" : $("#blk-120-bukit-merah-lane-1"),
            "BLK 127 TOA PAYOH LORONG 1" : $("#blk-127-toa-payoh-lorong-1"),
            "BLK 14 HAIG ROAD" : $("#blk-14-haig-road")

        };
        chartWrapperMap = {};
        stallTypes = ["Cooked Food Stalls", "Market Stalls", "Lock-Up Stalls"];
        selectedStallType = stallTypes[0];
        dimensions = ["bid", "bid-psm"];
        selectedDimension = dimensions[0];

        plotColumns = [schema.indexOf("Year"), schema.indexOf("Min"), schema.indexOf("Median"), schema.indexOf("Max")];

        Page.documentReady = function() {
            Log.debug("document ready");
            hawkerCentreTitles();
            dimensionSelector();
            stallTypeSelector();
        };

        function hawkerCentreTitles() {
            var hc, $title;
            for (hc in hawkerCentreMap) {
                if (hawkerCentreMap.hasOwnProperty(hc)) {
                    $title = hawkerCentreMap[hc].find(".hawker-centre__title");
                    $title.text(hc);
                }
            }
        }

        function stallTypeSelector() {
            var $buttons, $cookedFood, $market, $lockup;
            $cookedFood = $("#stall-type__cooked-food");
            $market = $("#stall-type__market");
            $lockup = $("#stall-type__lockup");
            $buttons = $cookedFood.add($market).add($lockup);

            // Show cooked food data

            $cookedFood.on("click", function() {
                var data;
                $buttons.removeClass("active");
                $(this).addClass("active");
                selectedStallType = stallTypes[0];
                data = dimensionData(selectedDimension);
                drawCharts(data, plotColumns);
            });

            // Show market stall data

            $market.on("click", function() {
                var data;
                $buttons.removeClass("active");
                $(this).addClass("active");
                selectedStallType = stallTypes[1];
                data = dimensionData(selectedDimension);
                drawCharts(data, plotColumns);
            });

            // Show lockup stall data

            $lockup.on("click", function() {
                var data;
                $buttons.removeClass("active");
                $(this).addClass("active");
                selectedStallType = stallTypes[2];
                data = dimensionData(selectedDimension);
                drawCharts(data, plotColumns);
            });
        }

        function dimensionSelector() {
            var $buttons, $bid, $bidPsm;
            $bid = $("#dimension__bid");
            $bidPsm = $("#dimension__bid-psm");
            $buttons = $bid.add($bidPsm);

            // Show bid data

            $bid.on("click", function() {
                $buttons.removeClass("active");
                $(this).addClass("active");
                selectedDimension = dimensions[0];
                drawCharts(bidData, plotColumns);
            });

            // Show bid psm data

            $bidPsm.on("click", function() {
                $buttons.removeClass("active");
                $(this).addClass("active");
                selectedDimension = dimensions[1];
                drawCharts(bidPsmData, plotColumns);
            });
        }


        Page.googleVisApiOnLoad = function() {
            Log.debug("google visualization api loaded");

            query();
            getCharts();
        };

        function query() {
            var url, q, sQuery;

            // Sort by hawker centre, stall type, year

            sQuery = "select A, B, C, D, E, F, G, H order by A, B, C options no_format";

            // Bid data

            url = "https://docs.google.com/spreadsheets/d/1dLIO3YPGuAG_komdWQc1Hwl4ED6jDuaJzoSJ__zqmO4/gviz/tq?gid=914354820&headers=1";
            q = new google.visualization.Query(url);
            q.setQuery(sQuery);
            q.send(handleBidData);

            // Bid $psm data

            url = "https://docs.google.com/spreadsheets/d/1dLIO3YPGuAG_komdWQc1Hwl4ED6jDuaJzoSJ__zqmO4/gviz/tq?gid=0&headers=1";
            q = new google.visualization.Query(url);
            q.setQuery(sQuery);
            q.send(handleBidPsmData);

        }

        function handleBidPsmData(response) {
            var data, cookedFoodStalls;

            Log.info("received bid psm data");
            if (response.isError()) {
                Log.error("Query error: " + response.getMessage() + "\n" + response.getDetailedMessage());
                return;
            }
            data = response.getDataTable();
            //Log.debug(JSON.stringify(data));

            bidPsmData = format(data);

            // Do not draw charts. By default, draw bid data first.

            //drawCharts(dimensions[1], bidData, plotColumns, cookedFoodStalls);
        }

        function handleBidData(response) {
            var data;
            Log.info("received bid data");

            if (response.isError()) {
                Log.error("Query error: " + response.getMessage() + "\n" + response.getDetailedMessage());
                return;
            }
            data = response.getDataTable();
            //Log.debug(JSON.stringify(data));

            bidData = format(data);

            drawCharts(bidData, plotColumns);
        }

        function format(data) {
            var twoDecimalPlacesFormat, moneyFormat, intFormat;
            moneyFormat = new google.visualization.NumberFormat({
                "prefix" : "$",
                "pattern" : "#,###.##"
            });

            twoDecimalPlacesFormat = new google.visualization.NumberFormat({
                "pattern" : "#,###.##"
            });

            intFormat = new google.visualization.NumberFormat({
                "pattern" : "#,###"
            });
            moneyFormat.format(data, schema.indexOf("Min"));
            moneyFormat.format(data, schema.indexOf("Median"));
            moneyFormat.format(data, schema.indexOf("Max"));
            moneyFormat.format(data, schema.indexOf("Average"));
            return data;
        }

        function dimensionData(dimension) {
            if (dimension === dimensions[0]) {
                return bidData;
            }
            if (dimension === dimensions[1]) {
                return bidPsmData;
            }
            Log.error("Dimension is an invalid value: " + dimension);
            return;
        }

        function getCharts() {
            var hc, $chart, cw;
            for (hc in hawkerCentreMap) {
                if (hawkerCentreMap.hasOwnProperty(hc)) {

                    cw = new google.visualization.ChartWrapper({
                        "chartType" : "AreaChart",
                        "options" : {
                            "title" : hc,
                            "titlePosition" : "none",
                            "titleTextStyle" : {
                                "fontSize" : 11,
                                "bold" : false
                            },
                            "hAxis" : {
                                "textPosition" : "out",
                                "ticks" : [2012, 2013, 2014, 2015],
                                "format" : "#" // No thousand separator
                            },
                            "vAxis" : {
                                "textPosition" : "out",
                                "ticks" : [0, 200, 400, 600, 800],
                                "format" : "$#,###"
                            },
                            "legend" : {
                                "position" : "none"
                            },
                            "focusTarget" : "category",
                            "tooltip" : {
                                "trigger" : "none",
                                "textStyle" : {
                                    "fontSize" : 12
                                }
                            },
                            "chartArea" : {
                                "height" : "80%",
                                "width" : "60%"
                            }
                        }
                    });

                    scrubYear(cw);

                    chartWrapperMap[hc] = cw;
                }
            }
        }

        function setChartOptions(chartWrapper) {
            var ticks, type;
            type = chartWrapper.getChartName();
            if (!type) {
                Log.error("Chart type must not be falsy");
                return;
            }

            if (type === dimensions[0]) {

                // Bid chart

                ticks = [0, 1000, 2000, 3000, 4000, 5000];
            } else if (type === dimensions[1]) {

                // Bid $psm chart

                ticks = [0, 200, 400, 600, 800];
            } else {
                Log.error("Chart type is unknown: " + type);
                return;
            }

            chartWrapper.setOption("vAxis.ticks", ticks);
            return chartWrapper;
        }

        function scrubYear(chartWrapper) {
            google.visualization.events.addListener(chartWrapper, 'ready', function() {
                google.visualization.events.addListener(chartWrapper.getChart(), "onmouseover", function(e) {
                    var rowIndex, rows, data, year, cw, hc, chart, yearIndex, view, count, metricLabel, txt, median, min, max, chartType;

                    row = e.row;
                    data = chartWrapper.getDataTable();

                    metricLabel = "median";

                    yearIndex = schema.indexOf("Year");
                    year = data.getValue(row, yearIndex);

                    //Log.debug("row: " + row + " year: " + year);

                    for (hc in chartWrapperMap) {
                        if (chartWrapperMap.hasOwnProperty(hc)) {
                            cw = chartWrapperMap[hc];
                            chartType = cw.getChartName();
                            chart = cw.getChart();
                            data = cw.getDataTable();

                            rows = data.getFilteredRows([{
                                "column" : yearIndex,
                                "value" : year
                            }]);

                            //Log.debug(hc + ": " + JSON.stringify(data) + " Rows:" + rows);

                            if ($.isArray(rows) && rows.length > 0) {
                                rowIndex = rows[0];

                                chart.setSelection([{
                                    "row" : rowIndex,
                                    "column" : null
                                }]);
                                //Log.debug("rowIndex: " + rowIndex);
                                count = data.getValue(rowIndex, schema.indexOf("Count"));
                                median = data.getValue(rowIndex, schema.indexOf("Median"));
                                min = data.getValue(rowIndex, schema.indexOf("Min"));
                                max = data.getValue(rowIndex, schema.indexOf("Max"));

                                // Bid chart

                                if (chartType === dimensions[0]) {
                                    median = numeral(median).format("$0,0");
                                    min = numeral(min).format("$0,0");
                                    max = numeral(max).format("$0,0");
                                }

                                // Bid $psm chart

                                if (chartType === dimensions[1]) {
                                    median = numeral(median).format("$0,0") + " psm";
                                    min = numeral(min).format("$0,0") + " psm";
                                    max = numeral(max).format("$0,0") + " psm";
                                }

                                kpi(hc, median, "median");
                                kpi(hc, min, "min");
                                kpi(hc, max, "max");
                                kpiMsg(hc, year, count);
                            } else {

                                // unset chart selection

                                chart.setSelection();
                                clearKpi(hc);
                            }

                        }
                    }
                });
            });
        }

        function kpiMsg(hawkerCentre, year, count) {
            var $msg, txt;
            $msg = hawkerCentreMap[hawkerCentre].find(".hawker-centre__kpi-msg");
            txt = "(year " + year + ", n=" + count + ")";
            $msg.text(txt);
            $msg.removeClass("invisible");
        }

        function clearKpi(hawkerCentre) {
            var $msg;
            $msg = hawkerCentreMap[hawkerCentre].find(".hawker-centre__kpi-msg, .hawker-centre__kpi");
            $msg.addClass("invisible");
        }

        function kpi(hawkerCentre, txt, type) {
            var $kpi, selector;
            if (type === "min") {
                selector = ".hawker-centre__kpi__min";
            }
            if (type === "median") {
                selector = ".hawker-centre__kpi__median";
            }
            if (type === "max") {
                selector = ".hawker-centre__kpi__max";
            }
            $kpi = hawkerCentreMap[hawkerCentre].find(selector);
            if (!$kpi.exists()) {
                Log.error("$kpi does not exist for selector: " + selector);
                return;
            }

            $kpi.text(txt);
            $kpi = hawkerCentreMap[hawkerCentre].find(".hawker-centre__kpi");
            $kpi.removeClass("invisible");
        }

        function drawCharts(data, cols) {
            var hc, $chart, cw, rows, view;
            Log.info("draw charts");
            for (hc in chartWrapperMap) {
                if (chartWrapperMap.hasOwnProperty(hc)) {
                    cw = chartWrapperMap[hc];
                    cw.setChartName(selectedDimension);
                    cw = setChartOptions(cw);

                    // Filter by hawker centre to get the relevant rows
                    // Set this as the data table

                    view = new google.visualization.DataView(data);
                    rows = data.getFilteredRows([{
                        "column" : schema.indexOf("Hawker Centre"),
                        "value" : hc
                    }, {
                        "column" : schema.indexOf("Stall Type"),
                        "value" : selectedStallType
                    }]);
                    view.setRows(rows);
                    cw.setDataTable(view);

                    // Apply another filter to show the relevant columns in the chart

                    cw.setView({
                        "columns" : cols
                    });
                    $chart = hawkerCentreMap[hc].find(".hawker-centre__chart");

                    cw.draw($chart[0]);

                    // Hide all kpi messages

                    clearKpi(hc);
                }
            }
        }

    }(window.sgcharts.Page = window.sgcharts.Page || {}, jQuery));

// Loads the Google Visualization libraries
google.load('visualization', '1', {
    'packages' : ['controls']
});
google.setOnLoadCallback(sgcharts.Page.googleVisApiOnLoad);

$(document).ready(sgcharts.Page.documentReady);
