(function($)
{
    $.require("mjs/core/strings");
    $.require("mjs/core/StringBuilder");
    $.require("mjs/core/utils");

    //============================================================ Private

    Object.defineProperty(Function.prototype, "methodName", {
        enumerable: false,
        configurable: true,
        writable: true
    });

    // A private object for passing between constructors.
    function inherit(){}

    /*
    Used to determine whether an object implements an interface, without throwing an error if it doesn't,
    as _implement, hence Object.implement, would do.
    */
    function $implements(that, $interface)
    {
        if (!that._interfaces || !($interface instanceof Interface)) return false;
        if (!$.isArray(that._interfaces))
        {
            $.error("$implements", "The interfaces property should be an Array:  " + obj._interfaces);
        }

        var i, len = that._interfaces.length;
        for (i = 0; i < len; i++)
        {
            if (that._interfaces[i] === $interface) return true;
        }
        return false;
    }

    /*
    Checks whether the object contains all of the specified functions and throws an error if it doesn't.
    Used by Object.implement.
     */
    function _implement(that, $$interface, caller)
    {
        if (!that._interfaces) {
            Object.defineProperty(that, "_interfaces", {
                value: [],
                writable: false,
                configurable: false,
                enumerable: false
            })
        }
        var $methods = $$interface.methods, errors = [], i;
        for (i in $methods)
        {
            if ($methods.hasOwnProperty(i)){
                if ($.isUndefined(that[i]) || !$.isFunction(that[i])) {
                    errors.push(i);
                }
            }
        }
        if (errors.length > 0) {
            throw new $.AbstractMethodError(errors.join(", ") + "in " + caller);
        }
        that._interfaces[that._interfaces.length] = $$interface; // Adding an array property "interfaces" to obj to store the interfaces implemented.
    }


    function contains(that, value){
        for (var i in that){
            if (that[i] == value) return true; // Leaving out hasOwnProperty() purposely for now.
        }
        return false;
    }


    // Creates a private property named k in that.
    function _private(that, k, v, className){
        var _p = v,
            errorMsg = "{0} is accessible only inside the class {1}";
        delete that[k];


        Object.defineProperty(that, k, {
            get: function _getPrivateProperty(){
                var caller = $.getCaller(_getPrivateProperty, arguments);
                if (contains(that, caller)){
                    return _p;
                }
                throw new Error(errorMsg.replaceArgs(k, className || ""));
            },
            set: function _setPrivateProperty(value){
                var caller = $.getCaller(_setPrivateProperty, arguments);
                if (contains(that, caller)){ // Using the "in" operator did not work
                    _p = value;
                } else {
                    throw new Error(errorMsg.replaceArgs(k, className || ""));
                }
            },
            configurable: false,
            enumerable: false
        });

    }

    //----------------------------Interfaces
    function Interface(a, caller)
    {
        this.methods = {};

        var methods = this.methods, methodName, i, len;
        for (i = 0, len = a.length; i < len; i++)
        {
            methodName = a[i];
            if (!$.isString(methodName)){
                $.error(caller, "index " + i + " is not a String in $.Interface");
            }
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
                if (this.methods.hasOwnProperty(j)) {
                    args.push(this.methods[j]);
                }
            }
            return new Interface(args);
        }
    };


    //============================================================= Public

    $.Interface = function _Interface()
    {
        var caller = $.getCaller(_Interface, arguments).name;


        // A consequence of returning a new Interface here is that no public "Interface" type will exist.
        // This is intentional.
        return Object.freeze(new Interface($.toArray(arguments), caller));
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
     *   <p>Class body:
     *   <ul>
     *       <li>Constants:  If a property name is all upper case, it will be turned into a constant. </li>
     *       <li>Private visibility:  If a property name begins with an underscore, it will become private.
     *           <ul>
     *               <li>It will not be accessible outside of methods of the class.
     *                   Any attempt by other classes to access the property will throw an error. </li>
     *               <li>It will not be inherited by subclasses:  e.g., overriding methods will not be able
     *                   to access it.</li>
     *               <li>It will still be accessible in inherited methods. </li>
     *           </ul>
     *       </li>
     *   </ul>
     *   </p>
     *
     *
     *   @param {Function|Object} [superClass] The parent class, if any.
     *   @param {Object} definition The body of the new class
     */
    $.Class = function(superClass, definition)
    {
        /*
         DESIGN:
         var myClass = function(){};
         if (parent) myClass.prototype = new Parent();
         mixin(myClass.prototype, classBody);
         */
        var __class__ = null,       // The new "class," which is also a function.
            init = null;            // The specified initializer or an empty function.

        if (!definition){
            definition = superClass;
            superClass = null;
        }

        // 2012/08/02:  Transitioning to using constructor instead of initialize.
        if (definition.hasOwnProperty("constructor")){
            definition.initialize = definition.constructor;
        }
        if (definition && definition.initialize){
            init = definition.initialize;
        } else  {
            if (!definition) definition = {};
            init = definition.initialize = function(){}
        }

        // New class
        __class__ = function(){
            var len = arguments.length, $sinit /* Super constructor */;
            /*
             Calling the super class constructor first (if parameter-less), like Java does.
             */
            if (superClass && superClass.prototype.initialize){
                $sinit = superClass.prototype.initialize;
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
                $Object.implement.apply($Object, [this].concat(this._interfaces));
            }

        };

        // Extend the parent class, if any, ensuring that instanceof works as expected for subclasses.
        if (typeof superClass === 'function') {
            __class__.prototype = new superClass(inherit);
        }

        // For declaring that the class implements interfaces
        __class__.implement = function(){
            __class__.prototype._interfaces = $.toArray(arguments);
            return __class__;
        };

        // Process the properties stripping out constants and private members.
        var arg,                              // The current property in the loop below
            _p = {},                          // Private members in the definition
            constants = {},                   // Constants found in definition
            args = $.extend({}, definition);  // For iterating while deleting from definition.
        for (var i in args){
            if (args.hasOwnProperty(i)){
                arg = args[i];
                // Handle private properties
                if (i.startsWith("_")){
                    _p[i] = arg;
                    delete definition[i];
                }
                // Tell each method its own name
                else if ($.isFunction(arg)){
                    arg.methodName = i;
                }
                // Handle constants
                else if (i.isUpperCase()){
                    $.constant(i, arg, __class__);
                    constants[i] = arg;
                    delete definition[i];
                }
            }
        }
        definition._interfaces = [];


        // The following mixins are meant to be superseded by
        // (i.e., overridden by) corresponding properties in
        // this class definition.
        $.augment(definition, {
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
        $.extend(__class__.prototype, definition, {
            constructor: __class__,
            inherited: function(){
                var p, prop, args;
                if (arguments.length > 0) {
                    args = [];
                    prop = arguments[0];
                    for (var i = 1; i < arguments.length; i++){
                        args.push(arguments[i]);
                    }
                    p = superClass.prototype[prop];
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
                superClass.prototype.initialize.apply(this, arguments);
            },
            toString: function(){
                return $Object.toString(this);
            },
            getClassName: function(){
                return this._className || "";
            }
        });

        // TODO:  consider adding code to execute a "static initializer" here for customizing the class as a whole:
        // e.g., calling Object.defineProperties().

        // Adding private accessor properties to the prototype.  They have to be added after the
        // public methods are mixed in:  the accessors for the property need to determine whether the function
        // the attempts to access the property is in the prototype.
        for (i in _p){
            if (_p.hasOwnProperty(i)){
                // TODO:  Strip private properties from the prototype here before re-adding them as accessor properties.
                //$.log("className").log(c.prototype._className)
                _private(__class__.prototype, i, _p[i], _p._className);
            }
        }

        // TODO: Do we want to freeze the prototype?  How about the instance?
        // Note:  Freezing the prototype breaks unit tests.
        // The answer to the second question is probably no.

        return __class__;
    };


    var $Object = {
        
        isa: function(obj, args)
        {
            // Don't allow an Interface to be the right operand of instanceof:  it will throw an error.
            if (args instanceof Interface) return $implements(obj, args);
            return (obj instanceof args);
        },


        /**
         * Checks whether the specified object (yes, object) implements the methods required by the specified interface
         * <strong>Throws an error if the object does not implement the required methods.</strong>
         * 
         * @param obj
         * @param $interface
         */
        implement: function _implements(obj, $interface /* ,... */)
        {
            var caller = $.getCaller(_implements, arguments).name;
            for (var i = 1, len = arguments.length; i < len; i++)
            {
                _implement(obj, arguments[i], caller);
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
        },

        hash: function(that){
            return $.isFunction(that.hash) ? that.hash() : ($.isString(that) ? that : that + "");
        },

        /**
         * Makes the specified property private.
         *
         * @param {String} prop  The name of the property to make private.
         * @param {Object} that  The object that the property belongs to.
         * @param {Object} options  Whether to create public getter/setter methods, defaults to false.
         */
        encapsulate: function(prop, that, options){
            options = options || {};
            var value = that[prop] || options.value,
                pName = prop.capitalize(),
                className = that._className || options.className || "anonymous";
            delete that[prop];
            if (options.addSetter === true){
                that["set" + pName.replace(/$_/,"")] = function(value){ that[prop] = value; };
            }
            if (options.addGetter === true){
                that["get" + pName.replace(/$_/,"")] = function(){ return that[prop] };
            }
            _private(that, prop, value, className)
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
    /*
    $.augment(Function.prototype, {
        implement: $Object.implement
    });
    */

    // Aliases
    Object.finalizes = Object.implement;
    Object.fulfills = Object.implement;



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

})(mjs);
