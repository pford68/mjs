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
         * <p>The "pure" flag will fail to eliminate custom "subclass instance" created with a constructor, if an
         * object has been assigned to the prototype of the constructor function, unless that constructor has also
         * been assigned to the constructor property of the prototype (or instance): </p>
         *
         * <code>
         * function Test(){}
         * Test.prototype = {
         *     // instance members
         * }
         * console.log($.isObject(new Test(), true));  // Writes true to the console
         *
         * function NotAPureObject(){}
         * NotAPureObject.prototype = {
         *    ...
         *    constructor: NotAPureObject
         * }
         *
         * console.log($.isObject(new NotAPureObject(), true));  // Writes false to the console
         * </code>
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
            return typeof value === 'boolean';
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


        add: function(prop, value, options){
            Object.defineProperty($public, prop, $public.extend({ value: value }, options || {} ));
            return this;
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
mjs.registerModule('js/mjs.js');




mjs.registerModule('js/mjsConfig.js');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/core/strings");
	/**
 *
 * @author Philip Ford
 */
(function($) {

    var methods = {
        /**
         *
         * @param c
         */
		endsWith: function(c){
			var start = this.length - c.length;
			return (c === this.substr(start, c.length));
		},

        /**
         *
         * @param c
         */
		startsWith: function(c){
			return (c === this.substr(0, c.length));
		},

        /**
         *
         */
        capitalize: function(){
            var str = this.toLowerCase();
            return str.charAt(0).toUpperCase() + str.substring(1);
        },

        /**
         *
         */
        uncapitalize: function(){
            return this.charAt(0).toUpperCase() + this.substring(1);
        },

        /**
         *
         */
        trim: function(){ return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); },
        trimLeft: function(){ return this.replace(/^\s+/g, ""); },
        trimRight: function() { return this.replace(/\s+$/g, ""); },

        /**
         *
         * @param args
         */
		replaceArgs: function(){
			if (arguments.length == 0) return;
			var str = this + "", re, i, len;

			for (i = 0, len = arguments.length; i < len; i++){
				re = new RegExp("\\{" + i + "\\}", "gi");
				str = str.replace(re, arguments[i]);
			}

			return str;
		},

        /**
         *
         * @param args
         */
        applyTemplate: function(args) {
            if (args == null) return;
            var str = this + "", re, i;
            for (i in args) {
                re = new RegExp("\\{" + i + "\\}", "gi");
                str = str.replace(re, args[i]);
            }
            return str;
        },

        /**
         * Requires spaces between intended syllables
         */
        toCamelCase: function(){
            var i, len, s, result = [], instance = this, syllables = instance.split(/\s+/);
            for (i = 0, len = syllables.length; i < len; ++i){
                if (i > 0) s = syllables[i].capitalize();
                else s = syllables[i].toLowerCase();
                result.push(s);
            }
            return result.join("");
        },

        /**
         * Returns true/false for whether the specified string exists within the current string.
         *
         * @param str
         */
        contains: function(str) {
            return this.indexOf(str) != -1;
        },


        /**
         * Returns true if the Strings have equal content, regardless of case.
         *
         * @param value
         * @return {Boolean}
         */
        equalsIgnoreCase: function(value){
            if (!$.isString(value)) return false;
            return this.toLowerCase() == value.toLowerCase();
        },

        /**
         * Converts the string to a boolean <strong>if and only if</strong> the string is eother "true" or "false."
         * Anything else is return as-is.
         *
         * @return {Boolean | String}
         */
        toBoolean: function(){
            if (this.trim() === "true") return true;
            else if (this.trim() === "false") return false;
            else return this;
        },


        /**
         * Returns true if the String has no content, contains only whitespace.
         *
         * @return {Boolean}
         */
        isEmpty: function(){
            return this.trim() === "";
        },

        /**
         * Returns true if the String contains any content other than whitespace.
         * @return {Boolean}
         */
        notEmpty: function(){
            return !this.isEmpty();
        }
        
    };

    $.augment(String.prototype, methods);
    String.prototype.namespace = "String.prototype";
})(mjs);
})(mjs);
mjs.registerModule('mjs/core/strings');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/core/arrays");
	(function($)
{
    /**
     * Custom array functions as well as native array functions that may or may not be supported
     * by the current browser.
     *
     * Many of these are copied from MDC Array functions: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/
     * The exceptions are copy and contains.
     * 
     * @author Philip Ford
     */

    // TODO:  Is this method of adding missing functions truly more efficient than usual methods?

    function validate(list){
        if (!$.isArray(list)) throw new Error("The argument must be an array.");
    }

    var m = {
        /**
         * Copies the contents of the associated array to the specified array.
         * @param {array} a The array to which to copy indices
         * @param {integer} [start] The index at which to start copying indices
         * @param {integer} [count] The number of elements to copy, including the one at index "start"
         * @scope Array.prototype
         */
        copy: function(a, start, count)
        {
            if (arguments.length == 0) return this.concat([]);

            var i, j = 0,
                    _start = (start != null ? start : 0),
                    _count = (count != null ? _start + count - 1 : this.length - 1);
            $.log(_start + ":" + _count);
            for (i = _start; i <= _count; ++i)
            {
                a[j] = this[i];
                ++j;
            }
        },


        /**
         * Inserts new elements and/or removes old elements.  For use in browsers that don't support the native function.
         * @param {integer} startIndex The index at which to start the replacement/deletion/assertion.
         * @param {integer} number  The number of items to delete/replace, starting with and including the element at startIndex, in the array.
         * @scope Array.prototype
         * @return {array} The elements that were removed
         */
        splice: function(startIndex, number, varargs)
        {
            $.log("[Array.prototype.splice] Using custom splice");
            if (number > this.length || startIndex + number > this.length){
                number = this.length - startIndex;
            }

            var i, len, before = [], after = [], splice = [];
            // Creating 3 segments:  the part before the splice, the part after the splice, and the splice.
            if (number > 0) {
                this.copy(before, 0, startIndex);
                this.copy(after, number + 1, this.length);
                this.copy(splice, startIndex, number);
            }
            // Adding new elements to the first segment
            for (i = 2, len = arguments.length; i < len; ++i){
                before.push(arguments[i]);
            }

            // Copying the result to this
            var result = before.concat(after);
            for (i = 0, len = result.length; i < len; ++i){
                this[i] = result[i];
            }

            // Reset the length
            this.length  = result.length;

            // Return the removed elements
            return splice;
        },



        /**
         * @param item
         * @param startIndex
         */
        indexOf: function(item, startIndex)
        {
             var len = this.length >>> 0, from = startIndex || 0;

             from = (from < 0) ? Math.ceil(from) : Math.floor(from);
             if (from < 0)
               from += len;

             for (; from < len; from++)
             {
               if (from in this && this[from] === item)
                 return from;
             }
             return -1;
        },



        /**
         * 
         * @param item
         * @param startIndex
         */
        lastIndexOf: function(item, startIndex)
        {
            var len = this.length;
            if (isNaN(startIndex)) {
                startIndex = len - 1;
            } else {
                startIndex = (startIndex < 0) ? Math.ceil(startIndex) : Math.floor(startIndex);
                if (startIndex < 0) startIndex += len;
                else if (startIndex >= len) startIndex = len - 1;
            }

            for (; startIndex > -1; startIndex--) {
                if (startIndex in this && this[startIndex] === item)
                return startIndex;
            }
            return -1;
        },


        /**
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        forEach: function(callback, thisVal)
        {
            var i, len = this.length;
            for (i = 0; i < len; i++)
                callback.call(thisVal, this[i], i, this);
        },


        /**
         * Creates a new array by performing a transformation function on each item in the original array.
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        map: function(callback, thisVal)
        {
            var i, len = this.length, result = [len];
            for (i = 0; i < len; i++)
                result[i] = callback.call(thisVal, this[i], i, this);
            return result;
        },

        /**
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        filter: function(callback, thisVal)
        {
            var i, val, len = this.length, result = [];
            for (i = 0; i < len; i++)
            {
                val = this[i];
                if (callback.call(thisVal, val, i, this))
                    result[result.length] = val;
            }
            return result;
        },

        /**
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        every: function(callback, thisVal)
        {
            var i, len = this.length;
            for (i = 0; i < len; i++)
                if (!callback.call(thisVal, this[i], i, this))
                    return false;
            return true;
        },

        /**
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        some: function(callback, thisVal)
        {
            var i, len = this.length;
            for (i = 0; i < len; i++)
                if (callback.call(thisVal, this[i], i, this))
                    return true;
            return false;
        },

        contains: function(value)
        {
            for (var i = 0, len = this.length; i < len; ++i)
            {
                if (this[i] === value) return true;
            }
            return false;
        },


        /**
         * This function exists largely so that clients can use arrays without having to know whether
         * they are dealing with arrays.  Clients could test whether the array implements an interface
         * that requires size(), instead of whether the object involved is an array.  This permits the
         * clients to use array-like structures in addition to arrays.
         */
        size: function(){
            return this.length;
        },


        difference: function(list){
            validate(list);

            var instance = this, result;

            // Get the items in this that are not in list.
            result = this.filter(function(item){
                return !list.contains(item);
            });
            // Get the items in list that are not in this, then concatenate them to the result.
            return result.concat(list.filter(function(item){
                return !instance.contains(item);
            }));
        },


        intersection: function(list){
            validate(list);
            return this.filter(function(item){
                return list.contains(item);
            });
        },


        /**
         * Returns a new array containing all of the unique items in both the arrays.  The items in
         * the new array are unique.  When duplicates are found, the first of the duplicates in the
         * one that is retained in the new array.
         *
         * @param varargs
         * @return {*}
         */
        union: function(varargs){
            var list = [];
            for (var i = 0, len = arguments.length; i < len; i++){
                list = list.concat(arguments[i]);
            }
            var result = this.unique();
            return result.concat(list).unique();
        },


        /**
         * Returns a new array with a duplicates removed.  When duplicates are found, the first of the duplicates in the
         * one that is retained in the new array.  Thus, [1,2,4,5,5,4,6].unique() will be [1,2,4,5,6].
         *
         * @return {Array}
         */
        unique: function(){
            var result = [];
            for (var i = 0, len = this.length; i < len; ++i){
                if (!result.contains(this[i])) {
                    result.push(this[i]);
                }
            }
            return result;
        },


        flatten: function(){
            var result = [];
            for (var i = 0, len = this.length; i < len; ++i){
                if ($.isArray(this[i])){
                    result = result.concat(this[i].flatten());
                } else {
                    result[i] = this[i];
                }
            }
            return result;
        },


        /**
         * Inserts an element at the specified index.  Unlike splice(), it does not remove elements.
         *
         * @return this
         */
        insert: function(args){
            var a = [], b = [], result, i, len,
                index = args.index,
                items = args.items;
            if (!$.isArray(items)) items = [items];
            this.copy(a, 0, index);  // The index where we want to insert item is the count for the first segment.
            this.copy(b, index);

            result = a.concat(items).concat(b);
            for (i = 0, len = result.length; i < len; ++i){
                this[i] = result[i];
            }
            this.length = result.length;
            return this;
        },


        /**
         *  Copies array elements to an object, behaving a little like PERL's each(), except this function can't
         *  copy to new variables.
         */
        toEach: function(that){
            var i, index = 0;
            for (i in that) {
                if (that.hasOwnProperty(i)){
                    that[i] = this[index];
                    ++index;
                }
            }
            return that;
        }

    };

    $.augment(Array.prototype, m);
})(mjs);
})(mjs);
mjs.registerModule('mjs/core/arrays');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/core/StringBuilder");
	// TODO (2010/04/13):  In light of new information regarding String performance in modern browsers, re-test StringBuilder's
// performance vis-a-vis string concatenation.
// PF (2010/07/15):  common/oop.js now requires StringBuilder, so this file cannot require or use oop.js.

(function ($)
{
    $.requireIf("mjs/core/arrays", !Array.prototype.splice);

    /**
     * @namespace
     * @description Emulates Java's StringBuilder, concatenating strings more efficiently than the "+" operator.
     * @param {String} [s] An initial base string inserted in the buffer
     * @returns {Object} The StringBuilder object.
     * @author Philip Ford
     */
    function StringBuilder(s)
    {
        this.buffer = [];
        if (s != null) return this.append(s);
        return this;
    }

    StringBuilder.prototype = {

        /**
         * <p>Adds the specified string to the buffer.</p>
         * @name append
         * @param {String} s The string to add to the buffer
         * @memberOf $.StringBuilder
         * @function
         */

        append: function(s)
        {
            var items = this.buffer;
            if (s != null) items[items.length] = s;
            return this;
        },

        /**
         * <p>Inserts a string in the buffer at the specified index (zero-based).</p>
         * @name insert
         * @param {Number} index The index in the buffer at which to insert the specified string.
         * @param {String} s The string to insert
         * @memberOf $.StringBuilder
         * @function
         */
        insert: function(index, s)
        {
            this.buffer.splice(index, 0, s);
        },

        /**
         * <p>Deletes the item in the buffer at the specified index</p>
         * @name deleteAt
         * @param {Number} index The index of the value to be replaced in the buffer.
         * @memberOf $.StringBuilder
         * @function
         */
        deleteAt: function(index)
        {
            this.buffer.splice(index, 1);
        },

        /**
         * <p>Replaces the string in the buffer at the specified index with another string.</p>
         * @name replaceAt
         * @param {Number} index The index of the value to be replaced in the buffer.
         * @param {String} s The replacement
         * @memberOf $.StringBuilder
         * @function
         */
        replaceAt: function(index, s)
        {
            this.buffer.splice(index, 1, s);
        },

        /**
         * <p>Returns the value at the specified index in the buffer</p>
         * @name get
         * @param {Number} index The index of the value to be retrieved from the buffer.
         * @memberOf $.StringBuilder
         * @function
         */
        get: function(index)
        {
            return this.buffer[index];
        },

        /**
         * <p>Builds the finished string and returns it.</p>
         * @name toString
         * @memberOf $.StringBuilder
         * @function
         */
        toString: function()
        {
            return this.buffer.join("");
        },
        

        /**
         * <p>Deletes the contents of the buffer.</p>
         * @name clear
         * @memberOf $.StringBuilder
         * @function
         */
        clear: function()
        {
            this.buffer = [];
        },


        /**
         * <p>Returns the number of items in the buffer.</p>
         * @name length
         * @memberOf $.StringBuilder
         * @function
         */
        length: function()
        {
            return this.buffer.length;
        }
    };

    $.extend({ StringBuilder: StringBuilder });

})(mjs);

})(mjs);
mjs.registerModule('mjs/core/StringBuilder');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/core/utils");
	/**
 *
 * @author Philip Ford
 */
(function ($) {
    var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); // chars to use.


    function S4() {
        return { quad: (((1+Math.random())*0x10000)|0).toString(16).substring(1) };
    }

    var utils = {
        GUID: function(){
            return "{quad}{quad}-{quad}-{quad}-{quad}-{quad}{quad}{quad}".applyTemplate(S4());
        },
        UUID: function(){
            var uuid = new Array(36), rnd=0, r;
            for (var i = 0; i < 36; i++) {
                if (i==8 || i==13 ||  i==18 || i==23) {
                    uuid[i] = '-';
                } else if (i==14) {
                    uuid[i] = '4';
                } else {
                    if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
                    r = rnd & 0xf;
                    rnd = rnd >> 4;
                    uuid[i] = CHARS[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
            return uuid.join('');
        },


        fromArguments: function($arguments, map){
            var i, args = {}, len = $arguments.length, key;
            for (i = 0; i < len; i++){
                key = map[i];
                args[key] = $arguments[i];
            }
            return args;
        },


        getCaller: function(callee){
            return callee && callee.caller ? callee.caller.name : "unnamed function";
        }
    };

    $.extend($.core.utils, utils );

})(mjs);
})(mjs);
mjs.registerModule('mjs/core/utils');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/core/oop");
	(function($)
{
    $.require("mjs/core/strings");
    $.require("mjs/core/StringBuilder");
    $.require("mjs/core/utils");

    //============================================================ Private members


    Object.defineProperty(Function.prototype, "methodName", {
        enumerable: false,
        configurable: true,
        writable: true
    });

    // A private object for passing between constructors.
    function inherit(){}

    function $implements(obj, $interface)
    {
        if (!obj.interfaces || !($interface instanceof Interface)) return false;
        if (!$.isArray(obj.interfaces))
        {
            $.error("$implements", "The interfaces property should be an Array:  " + obj.interfaces);
        }

        var i, len = obj.interfaces.length;
        for (i = 0; i < len; i++)
        {
            if (obj.interfaces[i] === $interface) return true;
        }
        return false;
    }

    $.AbstractMethodError = (function(){
        function AbstractMethodError(msg){
            this.message += msg;
        }
        AbstractMethodError.prototype = new Error();
        $.extend(AbstractMethodError.prototype, {
            message: "Not all required methods were implemented:  ",
            name: "AbstractMethodError"
        });
        return AbstractMethodError;
    })();


    //============================================================= Public members

    $.Interface = function()
    {
        var caller = $.core.utils.getCaller(arguments.callee);
        function Interface(a)
        {
            this.methods = {};

            var methods = this.methods, methodName, i, len;
            if (!$.isArray(a) && $.notEmpty(a)) $.error(caller, '$.Interface requires either no arguments or a String array');
            for (i = 0, len = a.length; i < len; i++)
            {
                methodName = a[i];
                if (typeof methodName !== 'string') $.error(caller, "index " + i + " is not a String in $.Interface");
                methods[methodName] = methodName;
            }
            Object.freeze(this.methods);
        }
        Interface.prototype = {
            extend: function(){
                var args = [];
                for (var i = 0; i < arguments.length; i++){
                    args[i] = arguments[i];
                }
                for (var j in this.methods){
                    args.push(this.methods[j]);
                }
                return new Interface(args);
            }
        };

        // A consequence of returning a new Interface here is that no public "Interface" type will exist.
        // This is intentional.
        return Object.freeze(new Interface($.toArray(arguments)));
    };


    /**
     *   <p>Creates a new "class."  Like Java, it ensures that the parameter-less <strong>initializer</strong>
     *   (the term "constructor" would not be quite correct here) of the parent class is called
     *   when the subclass initializer is called.   Unlike Java, no error occurs if the parent
     *   has no parameter-less initializer; however, the parent initializer also will not be invoked.
     *   To call the parent initializer in such cases, insert this.$super(args) in the subclass initializer.
     *   Also note that nothing forces you to make the $super() call the first line of the subclass initializer:
     *   rightly or wrongly, it could be at the end of the subclass initializer or anywhere else within the
     *   subclass initializer.</p>
     *
     *
     *
     *   @param {Function} [superClass] The parent class, if any.
     *   @param {Object} classBody The body of the new class
     *   @param {Array} [interfaces] Any interfaces implemented
     */
    $.Class = function()
    {
        /*
         DESIGN:
         var myClass = function(){};
         if (parent) myClass.prototype = new Parent();
         mixin(myClass.prototype, classBody);
         */
        var args = null,    // The specified class body.
            c = null,       // The new "class," which is also a function.
            $super = null,  // The parent "class," which is also a function.
            init = null;     // The specified initializer or an empty function.


        if (arguments.length >= 2){
            $super = arguments[0];
            args = arguments[1];
        } else if (arguments.length == 1){
            if ($.isObject(arguments[0], true)) args = arguments[0];
        }

        // 2012/08/02:  Transitioning to using constructor instead of initialize.
        if (args.hasOwnProperty("constructor")){
            args.initialize = args.constructor;
        }
        if (args && args.initialize){
            init = args.initialize;
        } else  {
            if (!args) args = {};
            init = args.initialize = function(){}
        }

        // New class
        c = function(){
            var len = arguments.length, $sinit /* Super constructor */;
            /*
             Calling the super class constructor first (if parameter-less), like Java does.
             */
            if ($super && $super.prototype.initialize){
                $sinit = $super.prototype.initialize;
                if ($sinit.length === 0){
                    $sinit.apply(this, arguments);
                }
            }

            /*
            Call initialize(), the class constructor

            Do not call it, however, if the constructor was invoke from within $.Class,
            meaning we are assigning it to a subclass' prototype.  If we allowed that to happen,
            that would violate my own mandate never to invoke a constructor with parameters automatically.

            The strategy of using a totally private object (the inherit method) only worked when inherit
            was declared outside $.Class, though it still has to be within this file's closure to be private.

            It should be impossible for the private inherit() function to be passed to this constructor
            except within $.Class, which happens below as I assign a new instance of the super class, if any,
            to the prototype of the new class.
            */
            if (arguments.length == 0 || arguments[0] !== inherit) init.apply(this, arguments);


            // Abstract classes cannot be instantiated.
            if (this.interfaces) {
                $Object.implement.apply($Object, [this].concat(this.interfaces));
            }

        };

        // Extend the parent class, if any, ensuring that instanceof works as expected for subclasses.
        if (typeof $super === 'function') {
            c.prototype = new $super(inherit);
        }

        c.implement = function(){
            c.prototype.interfaces = $.toArray(arguments);
            return c;
        };

        // Tell each method it's own name.
        for (var i in args){
            if (args.hasOwnProperty(i) && $.isFunction(args[i])){
                args[i].methodName = i;
            }
        }

        // Mixing in the new "class body"
        $.extend(c.prototype, args, {
            constructor: c,
            inherited: function(){
                var p, prop, args;
                if (arguments.length > 0) {
                    args = [];
                    prop = arguments[0];
                    for (var i = 1; i < arguments.length; i++){
                        args.push(arguments[i]);
                    }
                    p = $super.prototype[prop];
                    if (p) {
                        if (typeof p === "function" || p.constructor === Function) {
                            return p.apply(this, args);
                        } else {
                            return p[prop];
                        }
                    } else {
                        // TODO
                    }
                }
            },
            $super: function(){
                $super.prototype.initialize.apply(this, arguments);
            },
            toString: function(){
                return $Object.toString(this);
            }
        });

        return c;
    };


    var $Object = {
        
        isa: function(obj, args)
        {
            // Don't allow an Interface to be the right operand of instanceof:  it will throw an error.
            if (args instanceof $.Interface) return $implements(obj, args);
            return (obj instanceof args);
        },


        /**
         * Checks whether the specified object (yes, object) implements the methods required by the specified interface
         * <strong>Throws an error if the object does not implement the required methods.</strong>
         * 
         * @param obj
         * @param $interface
         */
        implement: function(obj, $interface /* ,... */)
        {
            function _implement(obj, $$interface)
            {
                if (!obj.interfaces) obj.interfaces = []; // TODO:  prevent "interfaces" from being changed from an array.
                var $methods = $$interface.methods, errors = [], i, name;
                for (i in $methods)
                {
                    if ($methods.hasOwnProperty(i)){
                        if ($.isUndefined(obj[i]) || !$.isFunction(obj[i])) {
                            errors.push(i);
                        }
                    }
                }
                if (errors.length > 0) {
                    throw new $.AbstractMethodError(errors.join(", ") + "in " + caller);
                }
                obj.interfaces[obj.interfaces.length] = $$interface; // Adding an array property "interfaces" to obj to store the interfaces implemented.
            }

            var caller = $.core.utils.getCaller(arguments.callee);
            for (var i = 1, len = arguments.length; i < len; i++)
            {
                _implement(obj, arguments[i]);
            }

            return obj;
        },


        toString: function(obj){ 
            var i, str, buffer = new $.StringBuilder();
            for (i in obj){
                if (obj.hasOwnProperty(i)){
                    if (!$.isFunction(obj[i])) {
                            buffer.append(i).append(":  ").append(obj[i]).append(", ");
                    }
                }
            }
            str = buffer.toString().replace(/,\s+$/, "");
            return str;
        }
    };


    /*
     Note that I don't add these methods to Object.prototype below
     because that could have undesirable consequences:  objects that are meant to be empty (e.g., {})
     would not be because they would inherit the methods from the prototype.  This would come up
     when looping through object properties as well.  Instead, I make them "static" methods of Object.
    */
    $.extend(Object, $Object);


    // Why did I do this?
    $.augment(Function.prototype, {
        implement: $Object.implement
    });

    // Aliases
    Object.finalizes = Object.implement;
    Object.fulfills = Object.implement;

})(mjs);

})(mjs);
mjs.registerModule('mjs/core/oop');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/core/publish");
	/**
 * Pub/sub frameworks.  I ported this from JCMS.  For now, the file contains only a topic-based system.
 * I removed JCMS's Publisher class and the require() calls for common/oop.js and common/arrays.js.  Also,
 * I am now mixing topics into jQuery, instead of into jcms.
 *
 * @author: Philip Ford
 */

(function($) {
    $.require("mjs/core/arrays");
    $.require("mjs/core/oop");

    var Publisher, topicObject = {};


    Function.prototype.subscribe = function(publisher) {
        if (Object.isa(publisher, $.Publisher)) {
            var instance = this, exists;
            exists = publisher.subscribers.some(function(fn) {
                return (fn === instance);
            });
            if (!exists) {
                publisher.subscribers.push(this);
            }
        }
        return this; // for chaining
    };


    Function.prototype.unsubscribe = function(publisher) {
        if (Object.isa(publisher, $.Publisher)) {
            var instance = this;
            publisher.subscribers = publisher.subscribers.filter(function(fn) {
                if (fn !== instance) {
                    return fn;
                }
            });
        }
        return this;  // for chaining
    };


    Publisher = $.Class({
        subscribers: null,
        initialize: function() {
            this.subscribers = [];
        },
        publish: function() {
            var args = arguments;
            //$.log("publish").log(args);
            this.subscribers.forEach(function(fn) {
                fn.apply(null, args);
            });
            return this; // for chaining
        }
    });

    //========================================= For subscribing/publishing through topics.
    var map = {};

    topicObject = {
        get: function(key){
            return map[key];
        },
        subscribe: function(topicName, func) {
            if (arguments.length > 2) {
                func = $.proxy(arguments[1], arguments[2]);
            }
            if (!map[topicName]) map[topicName] = [];

            var exists = map[topicName].some(function(fn) {
                return (fn === func);
            });
            if (!exists) {
                map[topicName].push(func);
            }
            return this;  //For chaining
        },
        unsubscribe: function(topicName, func) {
            if (arguments.length > 2) {
                func = $.proxy(arguments[1], arguments[2]);
            }
            if (map[topicName]) {   // MFM to prevent error when undefined
                map[topicName] = map[topicName].filter(function(fn) {
                    if (fn !== func) {
                        return fn;
                    }
                });
            }
            return this;  // For chaining
        },
        unsubscribeAll: function(topicName) {
            map[topicName] = [];
        },
        publish: function(topicName, args) {
            if (map[topicName]) {   // MFM to prevent error when undefined
                if ($.isArray(map[topicName])) {
                    map[topicName].forEach(function(fn) {
                        fn(args);
                    })
                }
            }
            return this; //For chaining
        }
    };



    $.extend($, { Publisher: Publisher, topics: topicObject });

})(mjs);
})(mjs);
mjs.registerModule('mjs/core/publish');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/xp/ObjectFactory");
	/**
 *
 * @author Philip Ford
 */
(function($) {

    /**
     * Returns a factory for creating objects according to the specified blueprint and configuration.
     * Once a blueprint is set for a Factory, changes to that blueprint will have no impact on
     * subsequent objects based on that blueprint:  the blueprint is cloned internally within
     * ObjectFactory, and the clone is used as the blueprint for new objects.
     *
     *
     * @param blueprint
     * @param config
     * @return {*}
     * @constructor
     */
    $.ObjectFactory = function(blueprint, config){
        config = config || { };
        blueprint = $.clone(blueprint);  // Once the blueprint is set, I don't want people to change it.
                                         // Object.freeze() may work here too.
        if (config.writable != null && (config.set || config.get )){
            $.log("ObjectFactory", "The property descriptors writable and get/set are incompatible; ObjectFactory deleted writable from the configuration.");
        }
        blueprint = config ? Object.create(blueprint, config) : Object.create(blueprint);
        $.log("ObjectFactory", "blueprint:").log(blueprint);

        /**
         * Returns a new object created according to the <strong>initial</strong> blueprint and configuration.
         *
         * @return {Object} An object
         */
        function Factory(){}

        Factory.prototype = {
            /**
             * Returns a new object created according to the <strong>initial</strong> blueprint and configuration.
             *
             * @return {Object} An object
             */
            build: function(args){
                var spec = args ? $.extend({}, blueprint, args) : blueprint;
                return Object.create(spec);
            },

            /**
             * Extends the blueprint of another Factory, and returns a new Factory that will make
             * objects according to the new extended blueprint.
             *
             * @param args
             * @param config
             * @return {*} A new Factory containing the extended blueprint.
             */
            extend: function(args, config){
                return $.ObjectFactory($.extend({}, blueprint, args), config);
            },

            /**
             * In short, returns the specified property from the parent factory's blueprint.  However,
             * the actual returned value will vary depending in the datatype of the parent blueprint
             * property:
             *
             * <ul>
             * <li>If the parent blueprint property is an object, $super returns a clone of that object.</li>
             * <li>If the parent blueprint property is a function, $super returns function when the scope fixed to
             *     the specified scope</li>
             * <li>If the parent blueprint property is a String or a primitive, that value is returned.
             * </ul>
             *
             * @param name
             * @param scope
             * @return {*}
             */
            $super: function(name, scope){
                var p = blueprint[name];
                if ($.isFunction(p)) {
                    if (!scope) $.error("ObjectFactory.$super", "A scope is required when the $super property is a function.");
                    return $.proxy(scope, p);
                }
                if ($.isObject(p, true)) return $.extend({}, p);
                return p;
            }
        };

        return Object.freeze(new Factory());
    };

    Object.defineProperty($, "ObjectFactory", { configurable: false, writable: false });

})(mjs);
})(mjs);
mjs.registerModule('mjs/xp/ObjectFactory');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/xp/exceptions");
	/**
 *
 * @author Philip Ford
 */

(function($) {

    $.Exception = (function(){
        function Exception(msg, fileName, lineNumber){
            this.fileName = fileName;
            this.lineNumber = lineNumber;
            this.message = msg;
        }
        Exception.prototype = new Error();
        $.extend(Exception.prototype, {
            name: "Exception"
        });
        return Exception;
    })();

    $.IllegalArgumentException = (function(){
        function IllegalArgumentException(msg, fileName, lineNumber){
            this.fileName = fileName;
            this.lineNumber = lineNumber;
            this.message = msg;
        }
        IllegalArgumentException.prototype = new $.Exception();
        $.extend(IllegalArgumentException.prototype, {
            name: "IllegalArgumentException"
        });
        return IllegalArgumentException;
    })();


    $.SyntaxError = (function(){
        function SyntaxError(msg, fileName, lineNumber){
            this.fileName = fileName;
            this.lineNumber = lineNumber;
            this.message = msg;
        }
        SyntaxError.prototype = new $.Exception();
        $.extend(SyntaxError.prototype, {
            name: "SyntaxError"
        });
        return SyntaxError;
    })();

})(mjs);
})(mjs);
mjs.registerModule('mjs/xp/exceptions');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/core/aop");
	/**
 *
 * @author Philip Ford
 */
(function($) {
    $.require("mjs/xp/ObjectFactory");
    $.require("mjs/xp/exceptions");

    // TODO:  i18n messages
	
	function weave(type, advised, advisedFunc, aopProxy){
		var f,$execute, standalone = false, adviser = aopProxy.adviser;
        aopProxy.flush();
		
		if (!advisedFunc) {
			standalone = true;
			$execute = arguments[1];
		} else {
			$execute = $.proxy(advised, advisedFunc);
		}
        aopProxy.advised = $execute;
		
		if (type == 'before') {
			f = function(){
				adviser.apply(advised, arguments);					// Invoke the advice.
				return $execute.apply(advised, arguments);			// Call the original function.		
			}
		} else if (type == 'after') {
			f = function(){
				aopProxy.cache = $execute.apply(advised, arguments);	// Call the original function and store the result.
				return adviser.apply(advised, arguments);				// Invoke the advice.
			};
		} else if (type == 'around') {
			var invocation = { 
				proceed: function() {
					return this.method.apply(this, this.args);
				}
			};
			f = function() {
				invocation.args = arguments;
				invocation.method = $execute;
				invocation.name = advisedFunc;
				return adviser(invocation);
			}
		} else {
			$.error("AOP Error", "Unsupported advice type:  " + type);
		}
		
		if (standalone) {
			return advised = f;
		} else {
			return advised[advisedFunc] = f;	
		}
		
	}

    

    //======================================================================== Public methods

    /**
     * To acess there methods, you must call $.aop.add() to return a correct AOP object.
     *
     * @type {Object}
     */
	var blueprint = {

        /**
         * <p>Causes adviser to be executed before every call to advised[advisedFunc].</p>
         * @param {Object} advised
         * @param {String} advisedFunc The name of the function that represents the pointcut
         */
		before: function(advised, advisedFunc) {
			return weave("before", advised, advisedFunc, this);
		},

        /**
         * <p>Causes adviser to be executed after every call to advised[advisedFunc].
         * The result of subsequent calls to advised[advisedFunc] is cached and can be retrieved with
         * $.aop.push()</p>
         *
         * @param {Object} advised
         * @param {String} advisedFunc
         */
		after: function(advised, advisedFunc) {
			return weave("after", advised, advisedFunc, this);
		},

        /**
         * <p>Wraps advised[advisedFunc] within adviser.  In order to work the advising function
         * (adviser) must have a parameter representing an "invocation" and must call invocation.proceed()
         * where the original function should be called.</p>
         * @param {Object} advised
         * @param {String} advisedFunc
         */
		around: function(advised, advisedFunc){
			return weave("around", advised, advisedFunc, this);
		},


        /**
         * Retrieves the result of the original function and clears the cache.
         */
		flush: function() {
			var result = this.cache;
            this.cache = null;
            return result;
		}
	};

    var Advice = $.ObjectFactory(blueprint);


    $.addAdvice = function(adviser, method){
        adviser = method ? $.proxy(adviser, method) : adviser;
        if (!$.isFunction(adviser)) {
            throw new $.IllegalArgumentException("An adviser function is required in mjs.addAdvice", "xp/aop.js");
        }
        var advice = Advice.build();
        advice.adviser = adviser;
        return Object.seal(advice);
    }

})(mjs);
})(mjs);
mjs.registerModule('mjs/core/aop');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/core/__package__");
	(function($){
    $.require("mjs/core/strings");
    $.require("mjs/core/arrays");
    $.require("mjs/core/oop");
    $.require("mjs/core/StringBuilder");
    $.require("mjs/core/publish");
    $.require("mjs/core/aop");
    $.require("mjs/core/utils");
})(mjs);
})(mjs);
mjs.registerModule('mjs/core/__package__');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/http/ext-ajax");
	/**
 *
 * @author Philip Ford
 */
mjs.ajax = Ext.Ajax.request;
})(mjs);
mjs.registerModule('mjs/http/ext-ajax');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/http/ajax");
	/**
 *
 * @author Philip Ford
 */

(function($) {

    $.require("mjs/core/publish");

    var $config = $.config,
        $ajax = $config.ajax,
        $http,
        $public;

    function getFunction(f) {
        return f || function() {}
    }

    // Continuing to support automatic dialog feedback.
    $.showDialog = $.showDialog || function(args){ if (args && args.msg) alert(args.msg) };

    // Default AJAX implementation, if none is provided.
    $http = {
        __request__: null,   // The XMLHTTPRequest object
        queue: [],

        next: function(args) {
            $.log("next");
            $http.queue.shift();  // Remove the current request.
            if ($http.queue.length > 0) {
                $http.queue[0](args);   // Execute the next request, if any.
            }
        },

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
                $public.error('ajax.js', 'Cannot create an XMLHTTP instance');
                return false;
            }
        },

        request: function(args) {
            var requestHandler, req = $http.__request__, async = (args.async != null ? args.async : true);

            requestHandler = function() {
                if (req.readyState == 4) {
                    if ((req.status == 200 || (req.status == 302 && req.allowRedirects !== false)) && args.success) {
                        args.success(JSON.parse(req.responseText));
                    }
                    else if (!args.suppress && args.failure) {
                        args.failure(JSON.parse(req.responseText));
                    }
                }
            };

            req.onreadystatechange = requestHandler;
            req.open(args.method, args.url, async);
            req.send(args.params);
            if (!async) requestHandler();
        }
    };



    $public = {
        /**
         * A wrapper for the request method of whatever AJAX library that we use.  The default HTTP method is POST.
         *
         * Supported HTTP methods include "GET", "POST", "PUT", "DELETE," and "JSONP."
         *
         * @param args
         *
         */
        request: function(args) {
            if (!args.url) {
                $.error("$.request", "A url is required.");
            }

            if (!$.ajax)  $.ajax = $http;

            // Wrap the success handler in common feedback handling
            if (args.success) {
                var f = args.success;
                args.success = function(response) {
                    if (!args.contentType || args.contentType == 'text/json') {
                        if (response && response.responseText) response = Ext.decode(response.responseText);
                    }
                    f(response);
                }
            }
            // Validation
            var assertion = args.assertion;
            if ($.isFunction(assertion) && !assertion()) {
                if ($.isFunction(assertion.onError)) {
                    assertion.onError();
                }
                return;
            }

            $.augment(args, {
                method: 'POST',
                headers: {
                    "Content-Type": 'application/json',
                    accept: 'application/json'
                }
            });

            if (args.queue) {
                var $success = getFunction(args.success),
                    $failure = getFunction(args.failure);
                args.success = function(response) {
                    $success(response);
                    $http.next(args);
                };
                args.failure = function(response) {
                    $failure(response);
                    $http.next(args);
                };
                $http.queue.push(function() {
                    $.ajax(args)
                });
                // Why queue.length == 1 instead of queue.length > 0? We have to start the queue,
                // but we don't want to call first item every time $.request() is called with queue == true.
                if ($http.queue.length == 1) {
                    $http.queue[0]();
                }
            } else {
                $.ajax(args);
            }
        },


        createForm: function(args) {
            var node, params, field, $doc;
            $doc = args.context ? args.context.contentWindow.document : window.document;
            node = $doc.createElement("form");
            node.action = args.url;
            node.method = args.method || 'POST';
            params = args.params;
            for (var i in params) {
                field = $doc.createElement("input");
                field.type = "hidden";
                field.name = i;
                field.value = params[i];
                node.appendChild(field);
            }
            $doc.getElementsByTagName("body")[0].appendChild(node);
            return node;
        }
    };

    $.extend($public);
})(mjs);
})(mjs);
mjs.registerModule('mjs/http/ajax');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("mjs/util/Hashtable");
	

(function($) {
    $.require("mjs/core/oop");

    /**
     * Converts the specified array into a new Map (Object) whose keys are based on the values of specified keys.
     * In other words, each element of the new array keys gets a key that depends on values of properties
     * within the element.
     */
    $.Hashtable = $.Class({

        key: "",

        initialize: function(items, key)
        {
            this.items = {};

            if (key) {
                if (!$.isString(key)) {
                    // TODO:  throw error
                }
                this.key = key;
                this.addAll(items);
            } else {
                this.key = items;
            }
            Object.seal(this);
        },

        containsKey: function(key)
        {
            return typeof this.items[key] !== 'undefined';
        },

        addAll: function(items){
            if (!items.length) return;
            for (var i = 0, len = items.length; i < len; i++)
            {
                if (!$.isObject(items[i]))
                {
                    throw new Error("[Hashtable.addAll] items must be an array of Objects.");
                }
                this.add(items[i], this.key.applyTemplate(items[i]));
            }
        },

        add: function(obj, key)
        {
            this.items[key] = obj;
         },

        get: function(key)
        {
            return this.items[key];
        },

        remove: function(key)
        {
            var elem = this.items[key];
            delete this.items[key];
            return elem;
        },


        each: function(f)
        {
            var i, items = this.items, instance = this;
            for(i in items)
            {
                if (items.hasOwnProperty(i))
                {
                    f(items[i], i, instance);
                }
            }
        },

        toArray: function(){
            return $.toArray(this.items);
        },

        size: function(){
            return this.toArray().length;
        }
    });


})(mjs);
})(mjs);
mjs.registerModule('mjs/util/Hashtable');



(function($){ 
	var mjs, $this;
	$this = { name: "{0}" }; 
	mjs = $;
	$.module("profiles/mjs-rtrg.js");
	/**
 *  Includes the most basic monterey-js files, plus common/ajax.js
 *
 *  @author Philip Ford
 */
(function($){
    $.require("mjs/core/*");
    $.require("mjs/http/ext-ajax");
    $.require("mjs/http/ajax");
    $.require("mjs/util/Hashtable");
})(mjs);
})(mjs);
mjs.registerModule('profiles/mjs-rtrg.js');



//end merge