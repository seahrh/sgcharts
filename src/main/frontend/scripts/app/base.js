// Application Namespace
// Requires jQuery
 
( function(sgcharts, $, undefined) {

        // JQuery extension
        // Detect whether JQuery selector returns null

        $.fn.exists = function() {
            return this.length !== 0;
        };
            

    }(window.sgcharts = window.sgcharts || {}, jQuery));