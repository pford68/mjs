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
 *
 * DESIGN:
 *  Read log configuration
 *  Create LogFactory singleton
 *
 *  LogFactory.getLogger()
 *      If the a Logger type was specified in the configuration
 *          Create a new Logger of that type
 *      Otherwise
 *          Create a ConsoleLogger
 *      Pass the Logger instance to a new LoggingDecorator
 *      Return the LoggingDecorator
 *
 * @author Philip Ford
 */
(function mLogFactory($) {
    $.require("mjs/core/strings");
    $.require("mjs/logging/interfaces");
    $.require("mjs/logging/ConsoleLogger");
    $.require("mjs/core/ObjectFactory");
    $.require("mjs/core/ObjectDecorator");
    $.require("mjs/core/oop");
    $.require("mjs/util/DateFormat");


    var $config = $.config || {},                           // The log configuration
        props = $config.logging || {},                      // Log configuration properties
        layoutCommands,                                     // Supported symbols and handlers
        LOG_LEVELS = Object.freeze({                        // Supported log levels
            FATAL: 1,
            ERROR: 2,
            WARN: 3,
            INFO: 4,
            DEBUG: 5,
            LOG: 6,
            TRACE: 7,
            ASSERT: 8
        }),
        DateFormat = $.util.DateFormat,                     // Short name for the DateFormat class
        logging = $.logging,                                // Short name for the logging namespace
        ILogger = logging.ILogger;                          // Short name for the ILogger interface.

    // Adding default log property values if those properties are not set.
    $.augment(props,{
        pattern: "%d [%M]%l............%m",
        dateFormat: "yyyy-MM-dd HH:mm:ss.SSS",
        logger: logging.ConsoleLogger
    });
    Object.implement(props.logger, ILogger);



    /*
   Supported Layout symbols and their handlers.  Theoretically, we could let developers add handlers for symbols,
   or override existing ones, but that is not supported yet.  Supporting it, however, would be easy now.
    */
    layoutCommands = {
        JUSTIFY: {
            value: /%-[0-9]+/g,
            execute: function(format, logger){
                var num;
                (format.match(this.value) || []).forEach(function(match){
                    num = match.replace("%-","");
                    format = format.replace("%-" + num, "%".justify(num));
                });
                return format;
            }
        },
        CLASSNAME: {
            value: /%M/g,
            execute: function(format, logger){
                return format.replace(this.value, logger.subject);
            }
        },
        MESSAGE: {
            value: /%m/g,
            execute: function(format, logger){
                return format.replace(this.value, logger.logEvent.message);
            }
        },
        LOCATION: {
            value: /%l/g,
            execute: function(format, logger){
                return format.replace(this.value, logger.logEvent.location);
            }
        },
        EVENT: {
            value: /%p/g,
            execute: function(format, logger){
                return format.replace(this.value, logger.logEvent.name);
            }
        },
        DATETIME: {
            value: /%d/g,
            execute: function(format, logger){
                return format.replace(this.value, DateFormat.format(logger.logEvent.datetime, props.dateFormat));
            }
        },
        NEWLINE: {
            value: /%n/g,
            execute: function(format, logger){
                return format.replace(this.value, "\n");
            }
        }
    };



    // Error is not working with String.prototype.applyTemplate()
    function Exception(e){
        if ($.notEmpty(e)){
            this.name = e.name;
            this.message = e.message;
            this.lineNumber = e.lineNumber;
            this.fileName = e.fileName;
            this.stack = e.stack;
        }
    }


    function LogEvent(context, caller, message){
        this.name = caller.name;
        this.location = caller.caller ? caller.caller.name : context.callee.caller.name;
        this.datetime = new Date();
        this.message = message;
        this.data = null;
        if (!$.isString(message)){
            this.message = "";
            this.data = message;
        }

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
        log: function LOG(msg, e){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.LOG){
                var logEvent = logger.logEvent = new LogEvent(arguments, LOG, msg);
                logger.log(this.format(), new Exception(e), logEvent.data);
            }
            return this;
        },
        info: function INFO(msg, e){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.INFO) {
                var logEvent = logger.logEvent = new LogEvent(arguments, INFO, msg);
                logger.info(this.format(), new Exception(e), logEvent.data);
            }
            return this;
        },
        error: function ERROR(msg, e){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.ERROR){
                var logEvent = logger.logEvent = new LogEvent(arguments, ERROR, msg);
                logger.error(this.format(), new Exception(e), logEvent.data);
            }
            return this;
        },
        debug: function DEBUG(msg, e){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.DEBUG) {
                var logEvent = logger.logEvent = new LogEvent(arguments, DEBUG, msg);
                logger.debug(this.format(), new Exception(e), logEvent.data);
            }
            return this;
        },
        warn: function WARN(msg, e){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.WARN) {
                var logEvent = logger.logEvent = new LogEvent(arguments, WARN, msg);
                logger.warn(this.format(), new Exception(e), logEvent.data);
            }
            return this;
        },
        /*
        Trace is not required by ILogger interface.
         */
        trace: function TRACE(msg, e){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.TRACE && $.isFunction(logger.trace)) {
                var logEvent = logger.logEvent = new LogEvent(arguments, TRACE, msg);
                logger.trace(this.format(), new Exception(e), logEvent.data);
            }
            return this;
        },
        /*
         Assert is not required by ILogger interface.
         */
        assert: function ASSERT(msg, e){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.ASSERT && $.isFunction(logger.assert)) {
                var logEvent = logger.logEvent = new LogEvent(arguments, ASSERT, msg);
                logger.assert(this.format());
            }
            return this;
        },
        dir: function DIR(that){
            var logger = this.logger;
            if ($.isDebugEnabled()){
                /*
                I thought about adding an automatic message using the configured format,
                but it's probably better to let the use add an explicit log statement before
                the explicit dir() call.
                 */
                //logger.logEvent = new LogEvent(arguments, DIR, "");
                //logger.log(this.format());
                logger.dir(that);
            }
        },
        /**
         *
         * @return {String}
         */
        format: function(){
            var format = props.pattern,
                logger = this.logger;

            // Replacing each symbol found in the pattern with the corresponding log event values
            format = layoutCommands.JUSTIFY.execute(format, this.logger); /* JUSTIFY must come first, but the order
             of iteration below is not guaranteed,
             so I call it first. */
            $.decorate(layoutCommands).forEach($.proxy(this, function(cmd, key){
                if (key !== "JUSTIFY") format = cmd.execute(format, logger);
            }));
            return format;
        }
    };






    // Create the LogFactory singleton and set the Logger type produced by the factory.
    var LogFactory = $.getFactory({
        getLogger: function(that){
            /*
            Note:  I decided that the Logger should not be a singleton:
            we will want multiple loggers per page--different ones in
            different classes, modules, functions, etc.
            */
            var loggerInstance = Object.create(props.logger);
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
            return Object.freeze(new LoggingDecorator(loggerInstance));
        }
    }).build();

    $.extend($.logging, { LogFactory: LogFactory });

})(mjs);