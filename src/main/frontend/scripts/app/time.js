// Time module
// Requires jQuery, Momemnt

( function(Time, $, undefined) {

        var INPUT_DATE_FORMAT, DATE_FORMAT, DATE_TIME_FORMAT, TIME_FORMAT, SHORT_DATE_FORMAT;

        DATE_FORMAT = "YYYY-MM-DD";

        TIME_FORMAT = "HH:mm:ss.SSS";

        // Helps a11y by allowing easy typing

        INPUT_DATE_FORMAT = "DD/MM/YYYY";

        DATE_TIME_FORMAT = DATE_FORMAT + " " + TIME_FORMAT;

        SHORT_DATE_FORMAT = "DD MMM YYYY";

        SHORT_DATE_WITH_DAY_FORMAT = "ddd, " + SHORT_DATE_FORMAT;

        Time.Formats = {
            "inputDate" : function() {
                return INPUT_DATE_FORMAT;
            },

            "date" : function() {
                return DATE_FORMAT;
            },

            "time" : function() {
                return TIME_FORMAT;
            },

            "dateTime" : function() {
                return DATE_TIME_FORMAT;
            },

            "shortDate" : function() {
                return SHORT_DATE_FORMAT;
            },

            "shortDateWithDay" : function() {
                return SHORT_DATE_WITH_DAY_FORMAT;
            }
        };

    }(window.sgcharts.Time = window.sgcharts.Time || {}, jQuery));
