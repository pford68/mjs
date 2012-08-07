/**
 *
 */
(function($){
    $.module("mjs/logging");
    $.require("mjs/core/oop");

    var logging = $.logging;

    logging.ILogger = $.Interface('info', 'error', 'debug', 'log', 'warn');

})(mjs);