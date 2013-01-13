(function ($) {

    $.require("mjs/core/arrays");

    /*
     *  Note: styling messages is handled automatically by the browser console.
     */

    /*
    All of the methods do the same thing, merely calling the corresponding console method,
    so I extracted the common code.
     */
    function execute(op, msg, varargs){
        if (window.console){
            var args = $.from(arguments),
                i = args.length,
                stack;
            while (i > 0){
                if (args[i] instanceof Error){
                    stack = args[i].stack;
                    break;
                }
                --i;
            }
            // Adding any error stack at the end.  Perhaps this should be configurable.
            if (stack){
                args.push(stack);
            }

            args.shift();  // Removing the method name from the argument list so it isn't printed.
            console[op].apply(console, args);
        }
    }


    $.logging.ConsoleLogger = {
        log: function(msg, varargs){
            execute.apply(null, ["log"].concat($.from(arguments)));
        },
        info: function(msg, varargs){
            execute.apply(null, ["info"].concat($.from(arguments)));
        },
        debug: function(msg, varargs){
            execute.apply(null, ["debug"].concat($.from(arguments)));
        },
        warn: function(msg, varargs){
            execute.apply(null, ["warn"].concat($.from(arguments)));
        },
        error: function(msg, varargs){
            execute.apply(null, ["error"].concat($.from(arguments)));
        },
        trace: function(msg, varargs){
            execute.apply(null, ["trace"].concat($.from(arguments)));
        },
        assert: function(expr){
            execute.apply(null, ["assert"].concat($.from(arguments)));
        },
        dir: function(that){
            if (window.console) console.dir(that);
        }
    };

    // Returning the ConsoleLogger to the LogFactory:  this is mandatory for ILoggers.
    return $.logging.ConsoleLogger;

})(mjs);