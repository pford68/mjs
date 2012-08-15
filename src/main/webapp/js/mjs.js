/**
 * <p>The basic mjs library.  This is the uncompressed version for debugging and for development.
 * It plays nice with other libraries and is meant to augment them with my own code.</p>
 *
 * @author Philip Ford
 */

var mjs = mjs || {};

(function($){

    if (Object.isSealed){
        [Object, String, Function, Array, Array.prototype, String.prototype, Function.prototype].forEach(function(item){
            if (Object.isSealed(item)) throw new Error(item.name || item.toString() + " is sealed.");
        });
    }

    /*

    Note that I cannot disallow any properties other than "config" in $ because
    I want this framework to be to plug in to other frameworks.  I had considered removing
    all properties other than "config" form $.

    This file has one dependency (breaking my own rule):  mjs/core/strings.

    Conventions:
    (1) An Object parameter is referred to as "that."
    (2) A String parameter is referred to as "value."
    */

    // ================================================================== Private
    var $lm = {},
        $pending = {},                                          // Modules currently requested, prevents "too much recursion" caused by circular dependencies.
        $config = $.config || {},
        scripts = document.getElementsByTagName("script"),      // All script elements on the page.  Below we find the one containing this script.
        lib = null,                                             // The main JavaScript directory
        //images = "",                                          // The image directory
        regex = {
            on: /^on/,
            motModule: /^\.\.\/+/
        },
        modulePrefixes = {},                                    // This is largely obsolete:  I no longer support mapping paths to modules, as Dojo does/did.  It is unnecessary
        regex_module = /\.|\//,                                 // Regular expression for modules paths
        $public,                                                // Public members
        debugEnabled = false,                                   // Whether the app is in debug mode (i.e., sends log messages to the console, etc.)
        reportErrors = true;

    function readAttributes(tag){
        var debugAttr, errorAttr, $bool = $public.toBoolean;
        debugAttr = tag.getAttribute("data-debugEnabled") || false;
        debugEnabled = $bool(debugAttr);
        reportErrors = $bool(errorAttr);
        $config.locale = tag.getAttribute("data-locale") || "en";
    }

    function configure(){
        /*
         Finding the script root based on the location of the mjs*.js file.
         This works best if mjs*.js is at the root of the script directory.
         TODO:  consider relying on configuration properties (passed in $) to point to the JS src directory.
         NOTE: (2012/07/19) I am considering a "data-jsdir" attribute for script tags that would point me to the js root.
         */
        for (var i = 0, len = scripts.length; i < len; i++) {
            var script = scripts[i];
            if (lib = script.getAttribute("data-jspath")){
                modulePrefixes['mjs'] = lib;
            }/* else if (script.src.search(/mjs.*\.js/) != -1) {
                var context, src = script.getAttribute("src");
                context = src.replace(/js.*\.js$/, "");
                modulePrefixes['mjs'] = lib = context + "js";
            } */
            if (modulePrefixes['mjs']) {
                readAttributes(script);
                break;
            }
        }
        if (!lib) {
            var fatal = [
                "The script root could not be determined:  ",
                "either the mjs script must have a name in the format /mjs\.*.js/, or ",
                "at least one script tag containing a custom data-context attribute ",
                "which points to the js root directory."
            ];
            throw new Error(fatal.join(""));
        }
    }



    function writeLogMessage(src, msg) {
        return ['[', src, '] ', msg].join('');
    }

    function startsWith(str, c){
        return (c === str.substr(0, c.length));
    }


    function endsWith(str, c){
        var start = str.length - c.length;
        return (c === str.substr(start, c.length));
    }

    // Every path sent to the resource loader by require() is relative to the script root.
    // Module prefixes is currently obsolete (2012/07/31).
    function parsePath(path) {
        var m = path.split("/")[0], p = modulePrefixes[m];
        if (!endsWith(path, ".js")) path += ".js";
        return (p || lib) + "/" + path;
    }

    function isObjectEmpty(that){
        for (var i in that){
            if (that.hasOwnProperty(i)) return false;
        }
        return false;
    }




    // Begin AJAX setup
    /*
     * <p>Accessing XMLHttpRequest directly in some cases because (1) Ext.Ajax.request does not allow synchronous requests,
     * and (2) jQuery's $.ajax inhibits the debugger statement.</p>
     *
     * @private
     */
    var $http = {
        __request__: null,   // The XMLHTTPRequest object
        queue: [],

        init: function() {
            if (window.XMLHttpRequest) {
                $http.__request__ = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                try {
                    $http.__request__ = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        $http.__request__ = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (e) {
                    }
                }
            }

            if (!$http.__request__) {
                $public.error('mjs.js', 'Cannot create an XMLHTTP instance');
                return false;
            }
        },

        request: function(args) {
            var requestHandler, req = $http.__request__, async = (args.async != null ? args.async : true);

            requestHandler = function() {
                if (req.readyState == 4) {
                    if ((req.status == 200 || (req.status == 302 && req.allowRedirects !== false)) && args.success) args.success(req);
                    else if (!args.suppress && args.failure) args.failure(req);
                }
            };

            req.onreadystatechange = requestHandler;
            req.open(args.method, args.url, async);
            req.send(args.params);
            if (!async) requestHandler();
        }
    };

    function fetchResource(resource, module, suppress) {

        $http.request({
            method: "GET",
            async: false,
            url: resource,
            suppress: suppress,
            success: function(response) {
                if ($lm[module]) return;      // PF (2011/06/02):  Preventing duplicate evals.  Why they occur is unknown.
                $lm[module] = resource;       // PF (2012/07.24):  Between these first two lines is an opportunity for a module to be executed twice.

                /*
                Wrapping the returned script within a module enables some cool features:
                (1) I can create the namespace specified by the module path automatically,
                    ensuring automatically that the namespace matches the module path.
                (2) I can give the downloaded module access to its name, from the module path, which
                    helps with logging, among other things.
                */
                (function($){
                    var mjs, $this;  // Note: $this will be available to imported modules iff they take a $this parameter.
                    $this = {
                        name: module
                    };
                    mjs = $;
                    if (!startsWith(module, "../")) {
                        $.module(module);
                    }

                    eval(response.responseText);
                })(mjs);
                //eval(response.responseText);
            },
            failure: function(response) {
                $public.error("mjs.js", module + " not found");
            }
        });
    }

    $http.init();
    // End AJAX setup



    //===================================================================================== Public
    $public = {

        isDebugEnabled: function(){
            return debugEnabled;
        },

        setDebugEnabled: function(enabled){
            debugEnabled = enabled;
        },

        log: function(msg, obj){
            if (debugEnabled && typeof console !== 'undefined'){
                console.log(msg);
                if (obj) console.dir(obj);
            }
            return this;
        },

        error: function(src, msg) {
            if (!debugEnabled) return;
            var $msg = writeLogMessage(src, msg);
            throw new Error($msg);
        },


        /**
         * Adds properties from props to obj.
         */
        extend: function(that, props) {
            function _extend(obj1, obj2){
                for (var i in obj2){
                    if (obj2.hasOwnProperty(i)){
                        obj1[i] = obj2[i];
                    }
                }
                return obj1;
            }

            if (arguments.length == 1){
                props = arguments[0];
                that = $;
                _extend(that, props);
            } else {
                for (var i = 1; i < arguments.length; i++){
                    _extend(arguments[0], arguments[i]);
                }
            }
            return that;   // For chaining
        },


        /**
         * Returns a deep copy of the specified object
         * @param args
         * @return {Object}
         */
        clone: function(args){
            var clone = {}, prop, i;
            for (i in args){
                if (args.hasOwnProperty(i)){
                    prop = args[i];
                    // If I add clone() to Object.prototype, which I'm considering,
                    // calling Object.clone() within mjs.clone() breaks mj.clone().
                    if ($public.isObject(prop, true)){
                        clone[i] = $public.clone(args[i]);
                    }
                    else if ($public.isArray(prop)) {
                        var c = [];
                        for (var j = 0, len = prop.length; j < len; ++j){
                            c = $public.clone(prop[j]);
                        }
                        clone[i] = c;
                    }
                    else {
                        clone[i] = prop;
                    }
                }
            }
            return clone;
        },


        /**
         * Adds properties from props to obj iff the property does not exist in obj or is null.
         */
        augment: function(that, props) {
            if (arguments.length == 1){
                props = arguments[0];
                that = $;
            }

            var i;
            for (i in props) {
                if (props.hasOwnProperty(i))
                    if (that[i] == null) that[i] = props[i];
            }
            return that;
        },


        /**
         * Adds properties from props to obj iff the property <strong>exists</strong> in obj.
         */
        override: function(that, props) {
            if (arguments.length == 1){
                props = arguments[0];
                that = $;
            }
            for (var i in props) {
                if (props.hasOwnProperty(i))
                    if (i in that) that[i] = props[i];
            }
            return that;
        },


        /**
         * <p>Loads a required resource, such as another script file.  Paths are relative to the configured script root.
         * Doesn't reload scripts that are already loaded.  The specified module is registered once loaded,
         * thus not reloaded.</p>
         *
         * <p>While jQuery.getScript also imports files through XMLHttpRequest, it does not do so
         * synchronously, which is what we need during development.  (Given that mjs.require() is
         * synchronous, and calls eval(), it should be used only during development, not in production.)
         * In addition, jQuery.getScript() does not have a mechanism to prevent a script from being downloaded,
         * through AJAX again once it has already been downloaded.</p>
         *
         * <p>Supports wildcard syntax:  i.e., common/ux/*.</p>
         *
         * @param n The path, relative to the script root, of the file to load.
         */
        require: function(n) {
            n = n.replace(/\*$/, "__package__"); // 2010-07-21
            if (!$lm[n]) {
                var resource = parsePath(n);
                fetchResource(resource, n);
            }
        },


        /**
         * Calls $.require() if only test is true.
         * @param n
         * @param test
         */
        requireIf: function(n, test) {
            if (test) $.require(n);
        },


        /**
         * <p>Similar to a package declaration, declaring the file to belong to the specified namespace or module,
         * and creating that namespace if it does not exist. The entire namespace produced is added to the window
         * object.  Thus, for example, if you want to add a namespace "logging" to jQuery, you would
         * call $.module("jQuery/logging").  The parts of the namespace can be separated either
         * with forward slashes, as in a path, or with periods, as in a package.</p>
         *
         * <p>This function relates to creating namespaces only.  It does not register a module
         * to prevent it from being imported by $.require() and has no bearing on $.require().
         * The relationship between a file and module, though this library often uses the terms
         * interchangeably, is tenuous.  Multiple files can be parts of the same module.  A module
         * is really analogous to a package, not to a file, which is more analogous to a class.</p>
         *
         * @param ns [String] The namespace to create if it does not already exist.
         */
        module: function(ns) {
            var parts = ns.split(regex_module), base = window, len = parts.length, i;
            for (i = 0; i < len; ++i){
                base[parts[i]] = base[parts[i]] || {};
                base = base[parts[i]];
            }
            return ns;
        },


        /**
         * Adds a key to the internal map of loaded modules, preventing $.require() from re-fetching the module.
         * @param module
         */
        registerModule: function(module) {
            $lm[module] = parsePath(module);
        },


        isFunction: function(value){
            return typeof value !== "undefined" && value != null && (typeof value === 'function' || value.constructor == Function);
        },


        isInteger: function(value) {
            var n = parseInt(value);
            return !isNaN(n) && ( value === parseInt(value));
        },


        isString: function(value) {
            return (typeof value !== "undefined" && value !== null && (typeof value === "string" || value.constructor == String));
        },


        isNumber: function(value) {
            return typeof value === 'number';
        },


        isArray: function(value) {
            // The last condition (...|| value.constructor + '' == Array + '') is needed to test arrays from other frames/windows accurately.
            return (typeof value !== 'undefined' && value !== null
                && (value.constructor + '' === Array + '' || Object.prototype.toString.apply(value) === '[object Array]'));
        },



        /**
         * <p>Returns true/false for whether the specified value is an Object, and works for Objects created in other
         * frames as well.  If the "pure" flag is "true" then isObject() should return true only if the value belongs
         * exclusively to the Object type, not to any sub-type.</p>
         *
         * @param value
         * @param {boolean} [pure] Whether to restrict the objects to the Object type.
         */
        isObject: function(value, pure) {
            // The last condition, which uses String.match to find "function Object ()" is needed to test objects from other frames/windows accurately.
            if (value == null) return false;
            if (pure) return ( value.constructor && value.constructor.name === 'Object');
            return (typeof value === 'object' || value.constructor === Object);
        },


        isBoolean: function(value) {
            return value === true || value === false;
        },

        /**
         * Converts the word "true" to true.  Anything else is converted to false. That last point may be surprising,
         * but if the function is going to a return a Boolean, as the name implies, it has to be that way.
         *
         * @param value
         * @return {Boolean}
         */
        toBoolean: function(value) {
            return (value != null && ((typeof value == 'string' && value.toLowerCase().trim() == "true") || value === true));
        },


        isUndefined: function(value) {
            return typeof value === 'undefined';
        },


        isNode: function(o){
            return (
                typeof Node === "object" ? o instanceof Node :
                    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
                );
        },

        isElement: function(o){
            return (
                typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                    o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName==="string"
                );
        },


        /**
         * Same as global parseInt except that it automatically supplies a radix of 10, thus parses numbers beginning
         * with zeros correctly (e.g., $.parseInt("015") == 15) and returns zero for non-numeric values, instead of NaN.
         * @param str
         */
        parseInt: function(str) {
            if (!str) str = "";
            var value = parseInt(str, 10);
            return (isNaN(value) ? 0 : value);
        },


        /**
         * Same as global parseFloat except non-numeric strings return 0.0, instead of NaN.
         * @param str
         */
        parseFloat: function(str) {
            if (!str) str = "";
            var value = parseFloat(str);
            return (isNaN(value) ? 0.0 : value);
        },


        /**
         * Returns true if value is null, undefined, "", {}, or zero.
         * @param value
         */
        isEmpty: function(value) {
            return (value === 0 ||
                value === null ||
                typeof value === "undefined" ||
                ($public.isObject(value, true) && isObjectEmpty(value)) ||
                ($public.isString(value) && value.isEmpty()));
        },


        /**
         * Returns false if value is null, undefined, "", or zero.
         * @param value
         */
        notEmpty: function(value) {
            return !$public.isEmpty(value);
        },


        /**
         * <p>
         * Converts an Object, not merely a NodeList, to an Array--as one might expect $.makeArray() to do.
         * The values of properties <strong>declared in the object, not inherited,</strong> become elements of the array.
         * </p>
         *
         * @param obj A pure Object
         */
        toArray: function(obj) {
            if (!obj) return [];  // Return nulls as empty arrays
            if ($.isArray(obj)) return obj;   // Return arrays as is.

            var result = [], length = (obj.length || 0);
            // Handling the arguments object as well as strings
            if (length > 0) {
                result = new Array(length);
                while (length--) result[length] = obj[length];
                return result;
            }

            // Handling all other objects
            if (obj != null) {
                for (var i in obj) {
                    if (obj.hasOwnProperty(i)) result[result.length] = obj[i];
                }
            }
            return result;
        },


        /**
         * Returns a standalone function that will be executed in the proper scope, giving "this" the correct
         * meaning within the function.  This was added to JQuery 1.4--i.e. after our current version.
         *
         * @param obj
         * @param method
         */
        proxy: function(obj, method) {
            var fcn = obj[method];
            if (!fcn){
                $public.error("$.proxy","fcn is null for method = " + method);     // TODO:  consider externalizing error messages.
            }
            return function() {
                return fcn.apply(obj, arguments);
            }
        },


        range: function(start, end, step){
            var result = [];
            if ($.isNumber(start) && $.isNumber(end)){
                step = step || 1;
                while(start + step <= end){
                    result.push(start += step);
                }
            } else {

            }
            return result;
        },


        /**
         * Converts the arguments object to an array.  If a transformer function is provided,
         * it performs the transformer function for each item in the
         * @param $arguments
         * @param transformer
         * @return {Object}
         */
        from: function($arguments, transformer){
            var $_ = Array.prototype.slice.call($arguments);
            if ($public.isFunction(transformer)){
                $_.forEach(transformer);
            }
            return $_;
        }
    };

    $public.augment($, $public);

    //================================================== Start class loader and set configuration values
    configure();


    //================================================== Imports
    $public.require("mjs/core/strings");     // Minimize this file's dependencies from now on.
    $public.require("mjs/i18n/" + $config.locale);
    // TODO:  Prevent core modules from depending on modules in other packages.

})(mjs);