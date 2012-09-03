(function ($) {

    $.require("mjs/core/oop");
    $.require("mjs/core/arrays");
    $.require("mjs/core/ObjectFactory");
    $.require("mjs/core/strings");

    //================================================================================ Private

    // A private object for passing between constructors.
    function inherit(){}

    function contains(that, value){
        for (var i in that){
            if (that.hasOwnProperty(i) && that[i] == value) return true;
        }
        return false;
    }

    function _private(that, k, v, className){
        var _p = v,
            errorMsg = "{0} is accessible only inside the class {1}";
        delete that[k];


        Object.defineProperty(that, k, {
            get: function _getPrivateProperty(){
                var caller = $.getCaller(_getPrivateProperty, arguments);
                if (contains(that, caller) || caller == that.constructor){
                    return _p;
                }
                throw new Error(errorMsg.replaceArgs(k, className || ""));
            },
            set: function _setPrivateProperty(value){
                var caller = $.getCaller(_setPrivateProperty, arguments);
                if (contains(that, caller) || caller == that.constructor){ // Using the "in" operator did not work
                    _p = value;
                } else {
                    throw new Error(errorMsg.replaceArgs(k, className || ""));
                }
            },
            configurable: false,
            enumerable: false
        });

    }




    function ClassDefinition(name, definition){
        definition._className = name;
        var parts = name.split(/\.|\//g);
        var className = parts.pop();
        this._config = {
            module:  (parts.length > 0 ? $.module(parts.join(".")) : window),
            shortName: className,
            definition: definition,
            interfaces: [],
            $super: null
        };
    }
    $.extend(ClassDefinition.prototype, {

        /**
         * Bui;ds the class according to the definition built by previous declare(), extend(),
         * and implement() calls.  If the class has a fully-qualified name, and the enclosing
         * "package" or module for the class does not exist, it will be created.  If the class
         * has a short name, the class will be assigned to a global variable by that name.
         *
         * @return void
         */
        create: function(){
            var config = this._config,
                def = config.definition,       // The specified class body.
                c = null,                       // The new "class," which is also a function.
                $super = config.$super,         // The parent "class," which is also a function.
                init = null;                    // The specified initializer or an empty function.



            // 2012/08/02:  Transitioning to using constructor instead of initialize.
            if (def.hasOwnProperty("constructor")){
                def.initialize = def.constructor;
            }
            if (def && def.initialize){
                init = def.initialize;
            } else  {
                if (!def) def = {};
                init = def.initialize = function(){}
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

                 Do not call it, however, if the constructor was invoked from within $.Class,
                 meaning we are assigning it to a subclass' prototype.  If we allowed that to happen,
                 that would violate my own mandate never to invoke a constructor that has parameters
                 automatically.

                 The strategy of using a totally private object (the inherit method) only worked when inherit
                 was declared outside $.Class, though it still has to be within this file's closure to be private.

                 It should be impossible for the private inherit() function to be passed to this constructor
                 except within $.Class, which happens below as I assign a new instance of the super class, if any,
                 to the prototype of the new class.
                 */
                if (arguments.length == 0 || arguments[0] !== inherit) {
                    init.apply(this, arguments);
                }


                // Abstract classes cannot be instantiated.
                if (this._interfaces.length > 0) {
                    Object.implement.apply(Object, [this].concat(this._interfaces));
                }

            };


            // Extend the parent class, if any, ensuring that instanceof works as expected for subclasses.
            if (typeof $super === 'function') {
                c.prototype = new $super(inherit);
            }

            // Adding the private interfaces property:  it will be stripped out below and re-added in _private.
            def._interfaces = config.interfaces;

            var prop, _p = {}, constants = {}, _def = $.extend({}, def);
            for (var i in _def){
                if (_def.hasOwnProperty(i)){
                    prop = _def[i];
                    // Handle private properties
                    if (i.startsWith("_")){
                        _p[i] = prop;
                        delete def[i];
                    }
                    // Tell each method its own name
                    else if ($.isFunction(prop)){
                        prop.methodName = i;
                    }
                    // Handle constants
                    else if (i.isUpperCase()){
                        $.constant(i, prop, c);
                        constants[i] = prop;
                        delete def[i];
                    }
                }
            }


            // The following mixins are meant to be superseded by
            // (i.e., overridden by) corresponding properties in args.
            $.augment(def, {
                /**
                 * Defines how to compare instances of this class.  <strong>Does not require hash().</strong>
                 *
                 * @param that
                 * @return {Boolean}
                 */
                equals: function(that){
                    return this === that;
                },
                /**
                 * Created to support hashtables, though ironically mjs.util.Hashtable class does not use it.
                 * HashMap does, however.
                 *
                 * @return {Object}
                 */
                hash: function(){
                    return $.UUID();  // No, JSON.stringify() is not a solution here:  can't guarantee the order
                }
            });


            // Mixing in the new "class body"
            $.extend(c.prototype, def, {
                constructor: c,
                inherited: function(){
                    var p, prop, args = $.from(arguments);
                    if (arguments.length > 0) {
                        prop = args.shift();
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
                    return Object.toString(this);
                },
                getClassName: function(){
                    return this._className || "";
                }
            });

            // TODO:  consider adding code to execute a "static initializer" here for customizing the class as a whole:
            // e.g., calling Object.defineProperties().

            // Adding private accessor properties to the prototype.  They have to be added after the
            // public methods are mixed in:  the accessors for the property need to determine whether the function
            // that attempts to access the property is in the prototype.
            for (i in _p){
                if (_p.hasOwnProperty(i)){
                    // TODO:  Strip private properties from the prototype here before re-adding them as accessor properties.
                    //$.log("ClassBuilder...className").log(c.prototype._className)
                    _private(c.prototype, i, _p[i], _p._className);
                }
            }

            // TODO: Do we want to freeze the prototype?  How about the instance?
            // Note:  Freezing the prototype breaks unit tests.
            // The answer to the second question is probably no.

            //$.log("ClassBuilder.c").log(c.prototype)
            config.module[config.shortName] = c;
        },


        /**
         * Sets the parent class/classes.  Supports multiple inheritance.  If the class has just one
         * superclass, instanceof will work as expected.  However, with multiple inheritance,
         * instanceof will return false for all parents.
         *
         * @param {Arguments} varargs The list of superclasses
         * @return {ClassDefinition} The Class Definition
         */
        extend: function(varargs){
            var supers = $.from(arguments),
                def = this._config.definition;
            // Multiple inheritance:  mixin the parent prototypes.
            if (supers.length > 1){
                supers.forEach(function($super){
                    $.augment(def, $.isFunction($super) ? $super.prototype : $super);
                });
            }
            // One parent:  assign the parent to the $super so that an instance of it
            // can be assigned to the subclass' prototype later.
            else if (supers.length == 1){
                this._config.$super = supers[0];
            }
            // No parents:  set _config.$super to null.
            else {
                this._config.$super = null;
            }
            return this;
        },


        /**
         * Declares that instances of the class must implement the listed interfaces.  If the class
         * definition does not implement those interfaces, it is abstract, and cannot create instances.
         * The requirement to implement the interfaces is enforced at instantiation.
         *
         * @param {Arguments} varargs
         * @return {ClassDefinition} The Class Definition
         */
        implement: function(varargs){
            this._config.interfaces = $.from(arguments);
            return this;
        }
    });


    //Object.encapsulate("_config", ClassDefinition.prototype);


    //======================================================================================= Public
    /**
     * Possible replacement for $.Class
     */
    $.xp.Class = Object.freeze({


        /**
         * 
         * @param name
         * @param definition
         * @return {*}
         */
        declare: function(name, definition){
            return new ClassDefinition(name, definition);
        }

    });

})(mjs);