(function ($) {


    function execute(op, msg, e, data){
        if (window.console){
            var args = [msg];
            if (data){
                args.push(data);
            }
            if (e && e.stack){
                args.push(e.stack);
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

})(mjs);