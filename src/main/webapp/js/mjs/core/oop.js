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
        var caller = $.getCaller(arguments.callee);
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
                    if (this.methods.hasOwnProperty(j)) {
                        args.push(this.methods[j]);
                    }
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
                Object.defineProperty(this, "_hash", {
                    value: $.UUID(),
                    writable: false,
                    configurable: false,
                    enumerable: false
                });
            }


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
        var arg, re_private = /^_/, prop;
        for (var i in args){
            if (args.hasOwnProperty(i)){
                arg = args[i];
                // TODO:  handle private members:  name starts with "_"
                if ($.isFunction(arg)){
                    arg.methodName = i;
                }
                else if (arg.startsWith("_")){
                    prop = i.replace(re_private, "");
                    Object.defineProperty(c.prototype, prop, {
                        enumerable: false,
                        configurable: false,
                        set: function(value){
                            if (arguments.callee.caller in this){
                                this[prop] = value;
                            }
                        },
                        get: function(){

                        }
                    })
                }
            }
        }

        // The following mixins are meant to be superseded by
        // (i.e., overridden by) corresponding properties in args.
        $.augment(args, {
            equals: function(that){
                return this === that;
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
            hash: function(){
                return this._hash;
            }
        });

        // TODO: Do we want to freeze the prototype?  How about the instance?

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

            var caller = $.getCaller(arguments.callee);
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
