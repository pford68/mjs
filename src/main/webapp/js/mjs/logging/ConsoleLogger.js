(function ($) {

    $.require("mjs/core/arrays");

    function execute(op, msg, varargs){
        if (window.console){
            var args = $.from(arguments);
            var last = args.last();
            if (last.stack){
                args[args.length - 1] = last.stack;
            }
            console[op].apply(console, args);
        }
    }


    $.logging.ConsoleLogger = {
        log: function(msg, e){
            execute.apply(null, ["log"].concat($.from(arguments)));
        },
        info: function(msg, e){
            execute.apply(null, ["info"].concat($.from(arguments)));
        },
        debug: function(msg, e){
            execute.apply(null, ["debug"].concat($.from(arguments)));
        },
        warn: function(msg, e){
            execute.apply(null, ["warn"].concat($.from(arguments)));
        },
        error: function(msg, e){
            execute.apply(null, ["error"].concat($.from(arguments)));
        },
        trace: function(msg, e){
            execute.apply(null, ["trace"].concat($.from(arguments)));
        },
        assert: function(expr){
            execute.apply(null, ["assert"].concat($.from(arguments)));
        },
        dir: function(that){
            if (window.console) console.dir(that);
        }
    };

    return $.logging.ConsoleLogger;

})(mjs);