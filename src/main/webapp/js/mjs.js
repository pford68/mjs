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
            motModule: /^\.\.\/+/,
            letter: /[a-z]/i
        },
        modulePrefixes = {},                                    // This is largely obsolete:  I no longer support mapping paths to modules, as Dojo does/did.  It is unnecessary
        regex_module = /\.|\//,                                 // Regular expression for modules paths
        $public,                                                // Public members
        debugEnabled = false;                                   // Whether the app is in debug mode (i.e., sends log messages to the console, etc.)


    function readAttributes(tag){
        var debugAttr, errorAttr, $bool = $public.toBoolean;
        debugAttr = tag.getAttribute("data-debugEnabled") || false;
        debugEnabled = $bool(debugAttr);
        $config.locale = tag.getAttribute("data-locale") || "en";
    }

    function configure(){
        /*
         Finding the script root based on the location of the mjs*.js file.
         This works best if mjs*.js is at the root of the script directory.
         TODO:  consider relying on configuration properties (passed in $) to point to the JS src directory.
         NOTE: (2012/07/19) I am considering a "data-jsdir" attribute for script tags that would point me to the js root.
         */
        $.config = $.config || {};

        lib = $.config.baseUrl;
        debugEnabled = $.config.debug || false;

        if (!lib){
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
        }

        if (!lib && !$.config.amd) {
            var fatal = [
                "The script root could not be determined:  ",
                "either the mjs script must have a name in the format /mjs\.*.js/, or ",
                "at least one script tag containing a custom data-context attribute ",
                "which points to the js root directory."
            ];
            throw new Error(fatal.join(""));
        }

        Object.defineProperty($, "config", {
            configurable: false,
            writable: true,
            enumerable: true
        });
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

    function fetchResource(resource, module, options) {
        options = options || {};
        $http.request({
            method: "GET",
            async: false,
            url: resource,
            suppress: options.suppress || false,
            success: function(response) {
                if ($lm[module]) return;      // PF (2011/06/02):  Preventing duplicate evals.  Why they occur is unknown.
                $lm[module] = resource;       // PF (2012/07/24):  Between these first two lines is an opportunity for a module to be executed twice.

                /*
                Wrapping the returned script within a module enables some cool features:
                (1) I can create the namespace specified by the module path automatically,
                    ensuring automatically that the namespace matches the module path.
                (2) I can give the downloaded module access to its name, from the module path, which
                    helps with logging, among other things.
                */
                (function loader($){
                    var mjs = $, result;
                    if (!startsWith(module, "../")) {
                        $.module(module);
                    }

                    result = eval(response.responseText);
                    if ($public.isFunction(options.onload)){
                        options.onload(result);
                    }
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

        /**
         * An object holding configuration properties for mjs.  Created automatically if not
         * created by a config file.  mjs.config properties can be added, deleted, and changed,
         * but mjs.config not deleted: writable is true; configurable is false.
         */
        config: $.config || {}, // Made permanent in configure() above

        isDebugEnabled: function(){
            return debugEnabled;
        },

        setDebugEnabled: function(enabled){
            debugEnabled = enabled;
        },

        log: function(msg, varargs){
            if (debugEnabled && typeof console !== 'undefined'){
                !varargs ? console.log(msg) : console.log.apply(console, arguments);
            }
            return this;
        },

        error: function(src, msg) {
            if (!debugEnabled) return;
            throw new Error(['[', src, '] ', msg].join(''));
        },


        /**
         * Exactly like jQuery's version.  Copies properties from the second object to the first.  This is a
         * memory-efficient way to create new objects because, when we copy the properties, we are copying
         * references to the same values or functions.  Thus, only one copy of each function or object will exist.
         * This does mean, however, that extend() makes a shallow copy, and if you are expecting a clone, and
         * expecting to make changes in one object that do not effect the other, you will be disappointed.
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

            var args = $public.from(arguments);
            if (!props){
                props = that;
                that = $;
                _extend(that, props);
            } else {
                for (var i = 1, len = args.length; i < len; i++){
                    _extend(args[0], args[i]);
                }
            }
            return that;   // For chaining
        },


        /**
         * Returns a deep copy of the specified object
         *
         * @param {Object} that The object to clone
         * @return {Object} The clone
         */
        clone: function(that){
            var clone = {}, prop, i;
            for (i in that){
                if (that.hasOwnProperty(i)){
                    prop = that[i];
                    // If I add clone() to Object.prototype, which I'm considering,
                    // calling Object.clone() within mjs.clone() breaks mj.clone().
                    if ($public.isObject(prop, true)){
                        clone[i] = $public.clone(that[i]);
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
         * Copies properties from the second object to the first object (that) iff the property
         * does not exist in the first or is null.
         */
        augment: function(that, props) {
            if (!props){
                props = that;
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
         * Copies properties from the second object to the first iff the property <strong>exists</strong>
         * in the first.
         */
        override: function(that, props) {
            if (!props){
                props = that;
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
         * @param options
         */
        require: function(n, options) {
            n = n.replace(/\*$/, "__package__"); // 2010-07-21
            if (!$lm[n]) {
                var resource = parsePath(n);
                fetchResource(resource, n, options);
            }
        },


        /**
         * Calls $.require() if only test is true.
         * @param n
         * @param test
         * @param options
         */
        requireIf: function(n, test, options) {
            if (test) $.require(n, options);
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
            return base;
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

        isLetter: function(value){
            return $public.isString(value) && value.length === 1 && value.match(regex.letter);
        },


        isNumber: function(value) {
            return typeof value === 'number';
        },

        /**
         * Tests whether the specified value is an array.
         * @param {*} value
         * @return {Boolean}
         */
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
         * @param {*} value
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


        /**
         * Returns true/false for whether the specified object is a Node.
         * @param that
         * @return {Boolean}
         */
        isNode: function(that){
            return (
                typeof Node === "object" ? that instanceof Node :
                    that && typeof that === "object" && typeof that.nodeType === "number" && typeof that.nodeName==="string"
                );
        },


        /**
         * Returns true/false for whether the specified object is an HTMLElement.
         * @param that
         * @return {Boolean}
         */
        isElement: function(that){
            // typeof HTMLElement === 'object' is false in Chrome, and the condition for evaluating "that"
            // in that case cannot distinguish XML nodes from elements.
            return (
                HTMLElement ? that instanceof HTMLElement : //DOM2
                    that && typeof that === "object" && that.nodeType === 1 && typeof that.nodeName==="string"
                );
        },


        /**
         * Same as global parseInt except that it automatically supplies a radix of 10, thus parses numbers beginning
         * with zeros correctly (e.g., $.parseInt("015") == 15) and returns zero for non-numeric values, instead of NaN.
         * @param {String} str A numeric string
         */
        parseInt: function(str) {
            if (!str) str = "";
            var value = parseInt(str, 10);
            return (isNaN(value) ? 0 : value);
        },


        /**
         * Same as global parseFloat except non-numeric strings return 0.0, instead of NaN.
         * @param {String} str A numeric string
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
         * Converts an Object, not merely a NodeList, to an Array--as one might expect jQuery.makeArray() to do.
         * The values of properties <strong>declared in the object, not inherited,</strong> become elements of the array.
         * Indented for use with "pure" objects, key/value pairs, and may or may not work with subclasses of Object.
         * </p>
         *
         * @param {Object} that A set of key/value pairs
         */
        toArray: function(that) {
            if ($public.isEmpty(that)) return [];  // Return nulls as empty arrays
            if ($public.isArray(that)) return that;   // Return arrays as is.

            var result = [], length = (that.length || 0);
            // Handling the arguments object as well as strings
            if (that.length > 0) {
                return Array.prototype.slice.call(that);
            }

            // Handling all other objects
            if (that != null) {
                for (var i in that) {
                    if (that.hasOwnProperty(i)) result[result.length] = that[i];
                }
            }
            return result;
        },


        /**
         * Returns a standalone function that will be executed in the proper scope, giving "this" the correct
         * meaning within the function.  This was added to JQuery 1.4--i.e. after our current version.
         *
         * @param {Object} that  The object to bind the method to.
         * @param {String | Function} method  The method to be bound.
         */
        proxy: function(that, method) {
            var fcn = $public.isString(method) ? that[method] : method,
                defaults;
            if (!fcn){
                $public.error("$.proxy","fcn is null for method = " + method);     // TODO:  consider externalizing error messages.
            }
            if (arguments.length > 2){
                defaults = $public.toArray(arguments).slice(2);
            }
            return function() {
                return fcn.apply(that, defaults ? defaults.concat($public.from(arguments)) : arguments);
            }
        },


        /**
         * Like Python's range(), returns an array of numbers from the start up to, but not including,
         * the end.  The values are incremented by the specified step:  e.g., $.range(1,5) returns [1,2,3,4].
         * Again, like Python's range(), if you pass only one parameter, you'll get a range from 0 up to, but not
         * including that parameter.  Again, like Python's version, it does not work for floats.
         *
         * @param {Integer} start
         * @param {Integer} end
         * @param {Integer} step
         * @return {Array} An array of integers
         */
        range: function(start, end, step){
            var result = [];
            if (end == null){
                end = start;
                start = 0;
            }
            if ($.isInteger(start) && $.isInteger(end)){
                step = step || 1;
                while(start < end){
                    $.log("range").log(start + ":" + end + ":" + step);
                    result.push(start);
                    start += step;
                }
            }
            return result;
        },


        /**
         * Converts the arguments object to an array.  If a transformer function is provided,
         * it performs the transformer function for each item in the arguments object.
         *
         * @param {Arguments} $arguments The arguments object to convert to an array
         * @param {Function} [transformer] A function for transforming the argument values
         * @return {Array} An array of arguments object's values
         */
        from: function($arguments, transformer){
            var $_ = Array.prototype.slice.call($arguments);
            if ($public.isFunction(transformer)){
                return $_.map(transformer);
            }
            return $_;
        },


        /**
         * Creates a constant by the name specified by k in the specific object scope, or in mjs
         * if no scope is specified.  The constant is immutable and cannot be deleted from its scope.
         *
         * @param {String} k The name of the new constant
         * @param {String | Number | boolean} v The value of the new constant
         * @param {Object} [scope] The object to which the constant belongs.
         */
        constant: function(k, v, scope){
            if ($public.isObject(v)) {
                throw new Error("A constant must be a String or a primitive:  {0}:{1}".replaceArgs(k, v));
            }
            scope = scope || $;
            k = k.toUpperCase();
            Object.defineProperty(scope, k, {
                value: v,
                writable: false,
                enumerable: true,
                configurable: false
            });
        },


        /**
         * Cross-browser function for returning an object's prototype.
         *
         * @param {Object} that The object from which to retrieve the prototype
         * @return {Object} The specified object's prototype
         */
        getPrototype: function(that){
            return that.__proto__ || Object.getPrototypeOf(that);
        }
    };


    //================================================= Activating the framework

    // Add the core functions to the namespace, if they are not already present.
    $public.augment($, $public);

    // Start class loader and set configuration values
    configure();


    //================================================== Imports
    /*
     I think importing "polyfills," and using certain functions that should be present (or even that aren't standard
      but are added to native prototypes) is not unjustified, but minimize this file's dependencies from now on.
      */
    if (!$.config.amd){
        $public.require("mjs/core/shim");
        $public.require("mjs/core/strings");
        $public.require("mjs/i18n/" + $config.locale);
    }
    // TODO:  Prevent core modules from depending on modules in other packages.

})(mjs);