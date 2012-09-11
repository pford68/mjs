/**
 * Requirements:
 * (1) To be able to configure the pattern of the log/error messages.
 * (2) To be told the exact file/class/function that the log/error message came from.
 * (3) To be able to set separate log levels for separate files/classes/functions.
 * (4) To be able to use a different logger from the default console logger, as long as it implements ILogger.
 * (5) To minimize the work involved in creating new ILogger class:  just simple implementations for
 *      log, info, debug, and error--without explicitly checking the log configuration (e.g., not
 *      having to call isLogEnabled() within the new log() function).
 *
 * @author Philip Ford
 */
(function mLogFactory($) {
    $.module("mjs/logging");
    $.require("mjs/core/strings");
    $.require("mjs/xp/logging/interfaces");
    $.require("mjs/core/ObjectFactory");
    $.require("mjs/core/oop");
    $.require("mjs/util/DateFormat");


    var $config = $.config || {},                           // The log configuration
        props = $config.log || {},                          // Log configuration properties
        Logger,                                             // The logger instance
        SYMBOLS = "%-[0-9]+ %M %m %l %p %d".split(/\s+/),   // Supported symbols in layout patterns
        LOG_LEVELS = Object.freeze({                        // Supported log levels
            ERROR: 1,
            WARN: 2,
            INFO: 3,
            DEBUG: 4,
            LOG: 5,
            TRACE: 6,
            ASSERT: 7
        }),
        DateFormat = $.util.DateFormat,                     // Short name for the DateFormat class
        logging = $.logging,                                // Short name for the logging namespace
        ILogger = logging.ILogger;                          // Short name for the ILogger interface.

    // Adding default log property values if those properties are not set.
    $.augment(props,{
        pattern: "%d [%M]%l............%m",
        dateFormat: "yyyy-MM-dd HH:mm:ss.SSS"
    });


    function LogEvent(context, caller){
        this.name = caller.name;
        this.location = caller.caller ? caller.caller.name : context.callee.caller.name;
        this.datetime = new Date();
    }


    function getLogLevel(logger){
        if (!logger.logLevel){
            var level = -1, prop = props[logger.subject];
            if (prop) {
                level = LOG_LEVELS[prop.toUpperCase()] || -1;
            }
            logger.logLevel = level;
        }
        return logger.logLevel;
    }



    /*
     If someone wants to use a different logger implementation, he/she need only provide the code
     he/she is interested in, and this decorator will wrap it within excise code.  That excise code
     checks the log configuration to determine whether the invoked Logger command is enabled for the
     Logger instance's class/function/module.  The excise code currently also injects the log event
     name, the date/time of the log event, and the name (if any) of the calling function, but those
     points may change.
     */
    function LoggingDecorator(logger){
        this.logger = Object.seal(logger);
    }
    LoggingDecorator.prototype = {
        log: function LOG(msg){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.LOG){
                logger.logEvent = new LogEvent(arguments, LOG);
                logger.log(msg);
            }
        },
        info: function INFO(msg){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.INFO) {
                logger.logEvent = new LogEvent(arguments, INFO);
                logger.info(msg);
            }
        },
        error: function ERROR(msg){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.ERROR){
                logger.logEvent = new LogEvent(arguments, ERROR);
                logger.error(msg);
            }
        },
        debug: function DEBUG(msg){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.DEBUG) {
                logger.logEvent = new LogEvent(arguments, DEBUG);
                logger.debug(msg);
            }
        },
        warn: function WARN(msg){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.WARN) {
                logger.logEvent = new LogEvent(arguments, WARN);
                logger.warn(msg);
            }
        },
        /*
        Trace is not required by ILogger interface.
         */
        trace: function TRACE(msg){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.TRACE && $.isFunction(logger.trace)) {
                logger.logEvent = new LogEvent(arguments, TRACE);
                logger.trace(msg);
            }
        },
        /*
         Assert is not required by ILogger interface.
         */
        assert: function ASSERT(msg){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.ASSERT && $.isFunction(logger.assert)) {
                logger.logEvent = new LogEvent(arguments, ASSERT);
                logger.assert(msg);
            }
        }
    };


    /*
    If a Logger object is assigned to $.config.logger, use that Logger;
    otherwise, use the default console logger.
     */
    if ($config.logger){
        Logger = $config.logger;
    } else {
        function execute(that, op, msg){
            var c = console[op] ? $.proxy(console, op) : $.proxy(console, "log");
            if (msg != null) c(that.render(msg));
        }
        /*
        The default ConsoleLogger
         */
        Logger = {
            log: function(msg){
                if (window["console"]) execute(this, "log", msg);
            },
            info: function(msg){
                if (window["console"]) execute(this, "info", msg);
            },
            debug: function(msg){
                if (window["console"]) execute(this, "debug", msg);
            },
            warn: function(msg){
                if (window["console"]) execute(this, "warn", msg);
            },
            error: function(msg){
                if (window["console"]) execute(this, "error", msg);
            },
            trace: function(msg){
                var c = window["console"];
                if (c && c.trace) {
                    execute(this, "log", msg);
                    c.trace();
                }
            },
            assert: function(expr){
                if (window['console']) execute(this, "assert", expr);
            }
        };
    }

    /* Add the final render() method.  This method is not provided by Logger implementations.
       The Logger is sealed when a LoggingDecorator is created, in LogFactory.getLogger(). */
    Logger.render = function(msg){
        var pattern = props.pattern,
            dateFormat = props.dateFormat,
            logEvent = this.logEvent,
            re;
        // Replacing each symbol found in the pattern with the corresponding log event values
        SYMBOLS.forEach($.proxy(this, function(p, index){
            re  = new RegExp(p, ['g']);
            switch(p){
                case '%M':
                    pattern = pattern.replace(re, this.subject);
                    break;
                case '%m':
                    pattern = pattern.replace(re, msg);
                    break;
                case '%l':
                    pattern = pattern.replace(re, logEvent.location);
                    break;
                case '%p':
                    pattern = pattern.replace(re, logEvent.name);
                    break;
                case '%d':
                    pattern = pattern.replace(re, DateFormat.format(logEvent.datetime, dateFormat));
                    break;
                case '%-[0-9]+':
                    var num;
                    (pattern.match(re) || []).forEach(function(match){
                        num = match.replace("%-","");
                        pattern = pattern.replace("%-" + num, "%".justify(num));
                    });
                    break;
            }
        }));
        return pattern;
    };


    // Create the LogFactory singleton and set the Logger type produced by the factory.
    Object.implement(Logger, ILogger);
    var LogFactory = $.getFactory({
        getLogger: function(that){
            /*
            Note:  I decided that the Logger should not be a singleton:
            we will want multiple loggers per page--different ones in
            different classes, modules, functions, etc.
            */
            var loggerInstance = Object.create(Logger);
            that = $.isString(that) ? { name: that } : that;
            /*
            Definitions of the properties listed below:
            (1) subject:  the class, function, object, file, etc. being logged.
            (2) fileName:
            (3) logLevel: the minimum log level of the logger.
            (4) logEvent: the LogEvent object containing the event name (e.g., INFO),
                          date/time of the event, and the location (e.g., the method
                          containing the log statement.
             */
            $.extend(loggerInstance, {
                subject:  (that && that.name) ? that.name : arguments.callee.caller.name,
                fileName: null,
                logLevel: null,
                logEvent: null
            });
            return Object.seal(new LoggingDecorator(loggerInstance));
        }
    }).build();

    $.extend($.logging, { LogFactory: LogFactory });


})(mjs);