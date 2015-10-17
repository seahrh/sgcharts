// Page script
// Requires Jquery, Moment, Numeral, Google Charts

( function(Page, $, undefined) {
        var Log, Chart, bidPsmData, schema, m$charts, mChartWrappers, stallTypes, twoDecimalPlacesFormat, moneyFormat, intFormat;
        Chart = sgcharts.Chart;
        Log = sgcharts.Log;
        schema = ["Hawker Centre", "Stall Type", "Year", "Count", "Min", "Max", "Median", "Average"];
        m$charts = {
            "AMOY STREET FOOD CENTRE" : $("#amoy-street-food-centre__chart"),
            "BEO CRESCENT MARKET" : $("#beo-crescent-market__chart"),
            "BERSEH FOOD CENTRE" : $("#berseh-food-centre__chart"),
            "BLK 665 BUFFALO ROAD" : $("#blk-665-buffalo-road__chart"),
            "BLK 1 JALAN KUKOH" : $("#blk-1-jalan-kukoh__chart"),
            "BLK 11 TELOK BLANGAH CRESCENT" : $("#blk-11-telok-blangah-crescent__chart"),
            "BLK 112 JALAN BUKIT MERAH" : $("#blk-112-jalan-bukit-merah__chart"),
            "BLK 115 BUKIT MERAH VIEW" : $("#blk-115-bukit-merah-view__chart"),
            "BLK 117 ALJUNIED AVENUE 2" : $("#blk-117-aljunied-avenue-2__chart"),
            "BLK 120 BUKIT MERAH LANE 1" : $("#blk-120-bukit-merah-lane-1__chart"),
            "BLK 127 TOA PAYOH LORONG 1" : $("#blk-127-toa-payoh-lorong-1__chart"),
            "BLK 14 HAIG ROAD" : $("#blk-14-haig-road__chart")

        };
        mChartWrappers = {};
        stallTypes = ["Cooked Food Stalls", "Market Stalls", "Lock-Up Stalls"];

        Page.documentReady = function() {
            Log.debug("document ready");

        };

        Page.googleVisApiOnLoad = function() {
            Log.debug("google visualization api loaded");

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
            query();
            getCharts();
        };

        function query() {
            var url, q;

            // Bid $psm data

            url = "https://docs.google.com/spreadsheets/d/1dLIO3YPGuAG_komdWQc1Hwl4ED6jDuaJzoSJ__zqmO4/edit#gid=0";
            q = new google.visualization.Query(url);

            // Sort by year

            q.setQuery("select A, B, C, D, E, F, G, H order by C options no_format");
            q.send(handleBidPsmData);
        }

        function handleBidPsmData(response) {
            var data, cols, cookedFoodStalls, yearIndex, medianIndex, minIndex, maxIndex;
            cookedFoodStalls = stallTypes[0];
            yearIndex = schema.indexOf("Year");
            medianIndex = schema.indexOf("Median");
            minIndex = schema.indexOf("Min");
            maxIndex = schema.indexOf("Max");

            cols = [yearIndex, minIndex, medianIndex, maxIndex];

            if (response.isError()) {
                Log.error("Query error: " + response.getMessage() + "\n" + response.getDetailedMessage());
                return;
            }
            data = response.getDataTable();
            //Log.debug(JSON.stringify(data));

            moneyFormat.format(data, medianIndex);
            moneyFormat.format(data, minIndex);
            moneyFormat.format(data, maxIndex);
            moneyFormat.format(data, schema.indexOf("Average"));

            bidPsmData = data;

            drawCharts(bidPsmData, cols, cookedFoodStalls);
        }

        function getCharts() {
            var hawkerCentre, $chart, cw;
            for (hawkerCentre in m$charts) {
                if (m$charts.hasOwnProperty(hawkerCentre)) {

                    cw = new google.visualization.ChartWrapper({
                        "chartType" : "AreaChart",
                        "options" : {
                            "title" : hawkerCentre,
                            "hAxis" : {
                                "textPosition" : "out",
                                "ticks" : [2012, 2013, 2014, 2015],
                                "format" : "#" // No thousand separator
                            },
                            "vAxis" : {
                                "textPosition" : "out",
                                "ticks" : [0, 200, 400, 600, 800],
                                "format" : "$#"
                            },
                            "legend" : {
                                "position" : "none"
                            },
                            "focusTarget" : "category"
                        }
                    });

                    scrubYear(cw);

                    mChartWrappers[hawkerCentre] = cw;
                }
            }
        }

        function scrubYear(chartWrapper) {
            google.visualization.events.addListener(chartWrapper, 'ready', function() {
                google.visualization.events.addListener(chartWrapper.getChart(), "onmouseover", function(e) {
                    var row, rows, data, year, cw, hawkerCentre, chart;
                    row = e.row;
                    data = chartWrapper.getDataTable();

                    // Year is first column

                    year = data.getValue(row, 0);
                    Log.debug("row: " + row + " year: " + year);

                    for (hawkerCentre in mChartWrappers) {
                        if (mChartWrappers.hasOwnProperty(hawkerCentre)) {
                            cw = mChartWrappers[hawkerCentre];
                            data = cw.getDataTable();
                            rows = data.getFilteredRows([{
                                "column" : 0,
                                "value" : year
                            }]);
                            chart = cw.getChart();
                            chart.setSelection([{
                                "row" : rows[0],
                                "column" : null
                            }]);
                        }
                    }
                });
            });
        }

        function drawCharts(data, cols, stallType) {
            var hawkerCentre, $chart, cw, view, rows;
            for (hawkerCentre in mChartWrappers) {
                if (mChartWrappers.hasOwnProperty(hawkerCentre)) {
                    cw = mChartWrappers[hawkerCentre];
                    $chart = m$charts[hawkerCentre];

                    // TODO remove - Remove all existing listeners, if any

                    //google.visualization.events.removeAllListeners(cw);
                    view = new google.visualization.DataView(data);
                    rows = data.getFilteredRows([{
                        "column" : schema.indexOf("Hawker Centre"),
                        "value" : hawkerCentre
                    }, {
                        "column" : schema.indexOf("Stall Type"),
                        "value" : stallType
                    }]);
                    view.setRows(rows);
                    view.setColumns(cols);

                    cw.setDataTable(view);
                    cw.draw($chart[0]);
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
