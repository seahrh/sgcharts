// Page script
// Requires Jquery, Moment, Numeral, Google Charts

( function(Page, $, undefined) {
        var Log, Chart, bidPsmData, schema, $charts, charts;
        Chart = sgcharts.Chart;
        Log = sgcharts.Log;
        schema = ["Hawker Centre", "Stall Type", "Year", "Count", "Min", "Max", "Median", "Average"];
        $charts = {
            "AMOY STREET FOOD CENTRE" : $("#amoy-street-food-centre__chart"),
            "BEO CRESCENT MARKET" : $("#beo-crescent-market__chart")

        };
        charts = {};

        Page.documentReady = function() {
            Log.debug("document ready");

        };

        Page.charts = function() {
            Log.debug("charts");
            query();
            initCharts();
        };

        function query() {
            var url, q;

            // Bid $psm data

            url = "https://docs.google.com/spreadsheets/d/1dLIO3YPGuAG_komdWQc1Hwl4ED6jDuaJzoSJ__zqmO4/edit#gid=0";
            q = new google.visualization.Query(url);
            q.setQuery("select A, B, C, D, E, F, G, H options no_format");
            q.send(handleBidPsmData);
        }

        function handleBidPsmData(response) {
            var data, view;

            if (response.isError()) {
                Log.error("Query error: " + response.getMessage() + "\n" + response.getDetailedMessage());
                return;
            }
            data = response.getDataTable();
            //Log.debug(JSON.stringify(data));
            view = new google.visualization.DataView(data);
            view.setColumns([schema.indexOf("Year"), schema.indexOf("Median")]);
            bidPsmData = view;
            drawCharts(bidPsmData);
        }

        function initCharts() {
            var hawkerCentre, $chart;
            for (hawkerCentre in $charts) {
                if ($charts.hasOwnProperty(hawkerCentre)) {
                    $chart = $charts[hawkerCentre];
                    Log.debug($chart.prop("id"));
                    charts[hawkerCentre] = new google.visualization.AreaChart($chart[0]);
                    
                }
            }
        }

        function drawCharts(data) {
            var hawkerCentre, chart;
            for (hawkerCentre in charts) {
                if (charts.hasOwnProperty(hawkerCentre)) {
                    chart = charts[hawkerCentre];
                    chart.draw(data, getChartOptions(hawkerCentre));
                }
            }
        }

        function getChartOptions(title) {
            return {
                "title" : title,
                "hAxis" : {
                    "textPosition" : "out"
                },
                "vAxis" : {
                    "textPosition" : "out"
                },
                "legend" : {
                    "position" : "none"
                }
            };
        }

        function TOREMOVEcharts(data, schema) {
            var chart = new google.visualization.ChartWrapper({
                "containerId" : "amoy-street-food-centre__chart",
                "chartType" : "AreaChart",
                "options" : {
                    "title" : "AMOY STREET FOOD CENTRE",
                    "hAxis" : {
                        "textPosition" : "out"
                    },
                    "vAxis" : {
                        "textPosition" : "out"
                    },
                    "legend" : {
                        "position" : "none"
                    }
                }
            });
            //chart.setView({
            //'columns' : [2, 6]
            //"columns" : [schema.indexOf("Year"), schema.indexOf("Median")]//,
            //"rows" : data.getFilteredRows([{"column":schema.indexOf("Hawker Centre"), "value": "AMOY STREET FOOD CENTRE"}])
            //});
            return [chart];
        }

    }(window.sgcharts.Page = window.sgcharts.Page || {}, jQuery));

// Loads the Google Visualization libraries
google.load('visualization', '1', {
    'packages' : ['corechart', 'controls']
});
google.setOnLoadCallback(sgcharts.Page.charts);

$(document).ready(sgcharts.Page.documentReady);
