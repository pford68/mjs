(function ($) {

    function execute(op, msg, e){
        if ($.notEmpty(window.console)){
            var f = console[op] || console.log;
            if ($.notEmpty(e)){
                f.call(console, msg, e)
            } else {
                f.call(console, msg);
            }
        }
    }

    $.logging.ConsoleLogger = {
        log: function(msg, e){
            execute("log", msg, e);
        },
        info: function(msg, e){
            execute("info", msg, e);
        },
        debug: function(msg, e){
            execute("debug", msg, e);
        },
        warn: function(msg, e){
            execute("log", msg, e);
        },
        error: function(msg, e){
            execute("error", msg, e);
        },
        trace: function(msg, e){
            execute("trace", msg, e);
        },
        assert: function(expr){
            execute("assert", msg, e);
        },
        dir: function(that){
            console.dir(that);
        }
    };

})(mjs);