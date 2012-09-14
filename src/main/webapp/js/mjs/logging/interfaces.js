/**
 *
 */
(function($){
    $.module("mjs/logging");
    $.require("mjs/core/oop");

    var logging = $.logging;

    /**
     *
     * @type {*}
     */
    logging.ILogger = $.Interface(
        'info',
        'error',
        'debug',
        'log',
        'warn',

        /**
         * Displays the contents of objects in the log output
         */
        "dir"
    );

})(mjs);