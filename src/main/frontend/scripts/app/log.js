// Log is the utility module for logging
// Requires JQuery, Moment

( function(Log, $, undefined) {

        var DEBUG, INFO, Time;

        DEBUG = true;
        INFO = true;
        Time = sgcharts.Time;

        Log.debug = function(msg) {
            if (DEBUG) {
                log(msg, "color: blue;");
            }
        };

        Log.info = function(msg) {
            if (INFO) {
                log(msg, "color: green;");
            }
        };

        Log.warn = function(msg) {
            log(msg, "color: brown;");
        };

        Log.error = function(msg, type) {
            log(msg, "background: yellow; color: red;");
        };

        function log(msg, styles) {
            var timestamp;
            timestamp = moment($.now()).format(Time.Formats.dateTime());
            console.log("%c[" + timestamp + "] " + msg, styles);
        }

    }(window.sgcharts.Log = window.sgcharts.Log || {}, jQuery));
