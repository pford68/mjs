/**
 * <p>LogFactory is a log4j-style logging system for the MJS framework, though configuration is much simpler
 * than for other frameworks.</p>
 *
 * <p>LogFactory dispenses with appenders and layouts in configurations.  To configure log messages,
 * simply create a JavaScript object containing the format for the log messages, and the log levels for
 * whatever you want to log.  Log levels can be assigned to anything--files, "classes," functions, "packages."
 * To use a custom logger, assign the path (relative to the JS root) to logger file to the optional "logger" property.
 * If you omit the logger property, the default ConsoleLogger will be used, sending messages to the browser console.
 *
 * An example configuration file:
 * <code>
 * mjs.config.logging = {
        logger: 'mjs/logging/AlertLogger',
        pattern: "%d{yyyy/MM/dd HH:mm:ss.SSS} [%M] %p%-5l - %m%n",
        firstModule: "INFO",                     // "firstModule" is a function being logged from INFO up.
        MyGreatClass: "LOG"                      // "MyGreatClass" is a "class" being logged from LOG up.
    };
 * </code>
 * </p>
 *
 * <p>Configuration properties:
 * <ul>
 * <li>pattern:  The format for log messages
 * <li>logger:  [optional] A String path to the ILogger class to use for logger.  The path is relative to the JS root.
 * <li>All other properties are key-value pairs mapping a string (which can be the name of a function, the "name"
 *      of a class, or any string that was used when the logger instance was created) to a log level.  Hence,
 *      given the properties example above, LogFactory.getLogger("MyGreatClass") would create a Logger with a
 *      log level of LOG, because "MyGreatClass" maps to LOG.
 * </ul>
 * </p>
 *
 * <p>The pattern symbols are the same ones used by log4j, and for the most part they have the same functions,
 * but there are a few differences, and only the symbols below are supported:
 *
 * <table>
 *     <tr>
 *         <td>%c</td>
 *         <td>The CSS style for the log message.  This departs from log4j and follows the Console API.</td>
 *     </tr>
 *     <tr>
 *         <td>%d{<i>date format</i>}</td>
 *         <td>The date of the event.  Optionally the date format follows within braces:
 *         e.g., %d{yyyy/MM/dd HH:mm:ss,SSS}.  If the format is omitted, the format defaults to yyyy/MM/dd HH:mm:ss.</td>
 *     </tr>
 *     <tr>
 *         <td>%F</td>
 *         <td>The web page where the log request was issued.</td>
 *     </tr>
 *     <tr>
 *         <td>%l</td>
 *         <td>The function that generated the event</td>
 *     </tr>
 *     <tr>
 *         <td>%L</td>
 *         <td></td>
 *     </tr>
 *     <tr>
 *         <td>%m</td>
 *         <td>The log message</td>
 *     </tr>
 *     <tr>
 *         <td>%M</td>
 *         <td>Class, function, file, package that issued the message.  The name will be the one passed
 *             to LogFactory.getLogger() when the logger was created.</td>
 *     </tr>
 *     <tr>
 *         <td>%n</td>
 *         <td>The platform-specific newline character</td>
 *     </tr>
 *     <tr>
 *         <td>%p</td>
 *         <td>The log level of the event</td>
 *     </tr>
 *     <tr>
 *         <td>%%</td>
 *         <td>The percent sign</td>
 *     </tr>
 *     <tr>
 *         <td>%-[0-9]+</td>
 *         <td>Moves the next part of the message to the right by the specified number of spaces:
 *         e.g., %p%-5l, writes the log level, followed by 5 spaces followed by the location.</td>
 *     </tr>
 * </table>
 *
 * </p>
 *
 * <p>Again, the default logger is mjs.logging.ConsoleLogger, which sends messages to the browser console.
 * Custom loggers can be created easily, and need only implement the methods in the mjs.logging.ILogger interface:
 * which requires the methods included in the standard JavaScript Console API: log, debug, etc.
 * </p>
 *
 * <p>The Styles follow the browser console convention: if %c appears in the log message,
 * the second argument in the message is supposed to contain style information.</p>
 *
 *
 * @author Philip Ford
 */
(function mLogFactory($) {
    /*
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
     *      Return the LoggingFacade
     */
    $.require("mjs/core/strings");
    $.require("mjs/core/arrays");
    $.require("mjs/logging/interfaces");
    $.require("mjs/core/ObjectFactory");
    $.require("mjs/core/ObjectDecorator");
    $.require("mjs/core/oop");
    $.require("mjs/util/DateFormat");
    $.require("mjs/http/Url");


    var $config = $.config || {},                           // The log configuration
        props,                                              // Log configuration properties
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
        defaultDateFormat = 'yyyy/MM/dd HH:mm:ss,SSS',
        DateFormat = $.util.DateFormat,                     // Short name for the DateFormat class
        logging = $.logging,                                // Short name for the logging namespace
        ILogger = logging.ILogger;                          // Short name for the ILogger interface.


    function onModuleLoaded(logger){
        $.config.logging.logger = logger;
    }

    /*
    Gets either the current value of $.config.log or the default properties if the former don't exist.
    This function allows use to set the properties after this file has been loaded.
     */
    function getProperties(){
        if (!props){
            // Adding default log property values if those properties are not set.
            props = $config.logging || {};
            if (props.logger && $.isString(props.logger)){
                $.require(props.logger, { onload: onModuleLoaded });
            } else if (!props.logger){
                $.require("mjs/logging/ConsoleLogger", { onload: onModuleLoaded });
            }
            $.augment(props,{
                pattern: "%d{yyyy/MM/dd HH:mm:ss,SSS} [%M]%l............%m"
            });
            Object.implement(props.logger, ILogger);
        }
        return props;
    }

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
            value: /(%d\{[0-9A-Za-z/\-,\.:\s]+\})|%d/g,
            execute: function(format, logger){
                var dateFormat = format.match(this.value), v = this.value;
                if (dateFormat) {
                    dateFormat.forEach(function(df){
                        df = df.replace(/%d|\{|\}/g, "");
                        format = format.replace(v, DateFormat.format(logger.logEvent.datetime, df || defaultDateFormat));
                    });
                    return format;
                }
                return format;
            }
        },
        NEWLINE: {
            value: /%n/g,
            execute: function(format, logger){
                return format.replace(this.value, "\n");
            }
        },
        FILENAME: {
            value: /%F/g,
            execute: function(format, logger){
                var hits = format.match(this.value);
                if (!hits) return format;
                return format.replace(this.value, logger.fileName);
            }
        }
    };


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
            var level = -1, prop = getProperties()[logger.subject];
            if (prop) {
                level = LOG_LEVELS[prop.toUpperCase()] || -1;
            }
            logger.logLevel = level;
        }
        return logger.logLevel;
    }


    /*
    Replaces the original un-formatted log message with the formatted message.
     */
    function fixArguments(that, args){
        var logEvent = that.logger.logEvent;
        args = $.from(args);
        args.shift(); // Removing the original un-formatted log message from the argument list.

        // Prepending the newly formatted log message to the argument list.
        if (logEvent.data){
            args = [that.format(), logEvent.data].concat(args);
        } else {
            args = [that.format()].concat(args);
        }
        return args;
    }



    /*
     If someone wants to use a different logger implementation, he/she need only provide the code
     he/she is interested in, and this decorator will wrap it within excise code.  That excise code
     checks the log configuration to determine whether the invoked Logger command is enabled for the
     Logger instance's class/function/module.  The excise code currently also injects the log event
     name, the date/time of the log event, and the name (if any) of the calling function, but those
     points may change.

     Note that I leave styling up to the ILogger implementations.  You can argue that the LoggingDecorator
     should remove that burden, in order to make implementing ILogger easier, but some log destinations
     will not support styles (text files, server consoles, alerts), and the implementations that
     use those destinations need to handle messages that contain style information.  The LoggingDecorator
     will be oblivious to the nature of the destination, unless the ILogger provides that information,
     which still gives the implementation one more thing to do.  Also, some destinations, like the
     browser console will handle style information automatically.

     On a separate point, we may or may not want to set styles for entire log levels, but we would
     still want to set them on a statement-by-statement basis as well.
     */
    function LoggingDecorator(logger){
        this.logger = Object.seal(logger);
    }
    LoggingDecorator.prototype = {
        log: function LOG(msg, varargs){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.LOG){
                logger.logEvent = new LogEvent(arguments, LOG, msg);
                logger.log.apply(logger, fixArguments(this, arguments));
            }
            return this;
        },
        info: function INFO(msg, varargs){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.INFO) {
                logger.logEvent = new LogEvent(arguments, INFO, msg);
                logger.info.apply(logger, fixArguments(this, arguments));
            }
            return this;
        },
        error: function ERROR(msg, varargs){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.ERROR){
                logger.logEvent = new LogEvent(arguments, ERROR, msg);
                logger.error.apply(logger, fixArguments(this, arguments));
            }
            return this;
        },
        debug: function DEBUG(msg, varargs){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.DEBUG) {
                logger.logEvent = new LogEvent(arguments, DEBUG, msg);
                logger.debug.apply(logger, fixArguments(this, arguments));
            }
            return this;
        },
        warn: function WARN(msg, varargs){
            var logger = this.logger, logEvent, args;
            if (getLogLevel(logger) >= LOG_LEVELS.WARN) {
                logger.logEvent = new LogEvent(arguments, WARN, msg);
                logger.warn.apply(logger, fixArguments(this, arguments));
            }
            return this;
        },
        /*
        Trace is not required by ILogger interface.
         */
        trace: function TRACE(msg, varargs){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.TRACE && $.isFunction(logger.trace)) {
                logger.logEvent = new LogEvent(arguments, TRACE, msg);
                logger.trace.apply(logger, fixArguments(this, arguments));
            }
            return this;
        },
        /*
         Assert is not required by ILogger interface.
         */
        assert: function ASSERT(msg, varargs){
            var logger = this.logger;
            if (getLogLevel(logger) >= LOG_LEVELS.ASSERT && $.isFunction(logger.assert)) {
                logger.logEvent = new LogEvent(arguments, ASSERT, msg);
                logger.assert(this.format());
            }
            return this;
        },
        dir: function DIR(that){
            var logger = this.logger;
            if ($.isDebugEnabled()){
                /*
                I thought about adding an automatic message using the configured format,
                but it's probably better to let the user add an explicit log statement before
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
            // TODO: Should this method be public?
            // A: It doesn't do any harm, so why not?
            var format = getProperties().pattern,
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
            var loggerInstance = Object.create(getProperties().logger);
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
            var href = document.location.href;
            $.extend(loggerInstance, {
                subject:  (that && that.name) ? that.name : arguments.callee.caller.name,
                fileName: href ? new $.http.Url(href).file : null,
                logLevel: null,
                logEvent: null
            });
            return Object.freeze(new LoggingDecorator(loggerInstance));
        }
    }).build();

    $.extend($.logging, { LogFactory: LogFactory });

})(mjs);