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


    function contains(that, value){
        for (var i in that){
            if (that[i] == value) return true;
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
     *   @param {Function} [superClass] The parent class, if any.
     *   @param {Object} classBody The body of the new class
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
        if (typeof $super === 'function') {
            c.prototype = new $super(inherit);
        }

        c.implement = function(){
            c.prototype._interfaces = $.toArray(arguments);
            return c;
        };

        var arg, _p = {}, constants = {}, _args = $.extend({}, args);
        for (var i in _args){
            if (_args.hasOwnProperty(i)){
                arg = _args[i];
                // Handle private properties
                if (i.startsWith("_")){
                    _p[i] = arg;
                    delete args[i];
                }
                // Tell each method its own name
                else if ($.isFunction(arg)){
                    arg.methodName = i;
                }
                // Handle constants
                else if (i.isUpperCase()){
                    $.constant(i, arg, c);
                    constants[i] = arg;
                    delete args[i];
                }
            }
        }
        args._interfaces = [];


        // The following mixins are meant to be superseded by
        // (i.e., overridden by) corresponding properties in args.
        $.augment(args, {
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
                _private(c.prototype, i, _p[i], _p._className);
            }
        }

        // TODO: Do we want to freeze the prototype?  How about the instance?
        // Note:  Freezing the prototype breaks unit tests.
        // The answer to the second question is probably no.

        return c;
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
                that["set" + pName] = function(value){ that[prop] = value; };
            }
            if (options.addGetter === true){
                that["get" + pName] = function(){ return that[prop] };
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
    $.augment(Function.prototype, {
        implement: $Object.implement
    });

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
