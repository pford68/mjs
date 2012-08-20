/**
 *
 * @author Philip Ford
 */
(function($) {

    var ObjectDecorator = function(that){
        this.component = that;
    };


    Object.defineProperties(ObjectDecorator.prototype, {
        component: {
            enumerable: false,
            configurable: false,
            writable: true         // Writable defaults to false in Firefox, preventing me from writing to it later.
        }
    });



    $.extend(ObjectDecorator.prototype, {

        /**
         * Mixes the properties of the arguments into the component.
         *
         * @param varargs
         * @return {*}
         */
        extend: function(varargs){
            function _extend(a, b){
                for (var i in b){
                    if (b.hasOwnProperty(i)){
                        a[i] = b[i];
                    }
                }
                return a;
            }

            for (var i = 0; i < arguments.length; i++){
                _extend(this.component, arguments[i]);
            }
            return this;   // For chaining
        },

        /**
         * Mixes the properties of the specified object into the component, but only properties that do not already
         * exist in the component.  In other words, existing properties are not overridden in the component.
         *
         * @param that
         * @return {*}
         */
        augment: function(that){
            var i, cmp = this.component;
            for (i in that) {
                if (that.hasOwnProperty(i))
                    if (cmp[i] == null) cmp[i] = that[i];
            }
            return this;   // For chaining
        },


        /**
         * Adds the properties of the specified object to the component if and only if the component already
         * has properties of the same name.
         *
         * @param that
         * @return {*}
         */
        override: function(that){
            var cmp = this.component;
            for (var i in that) {
                if (that.hasOwnProperty(i))
                    if (i in cmp) cmp[i] = that[i];
            }
            return this;  // For chaining
        },


        /**
         * Checks whether all of the arguments are properties of the component.
         */
        has: function(varargs){
            var cmp = this.component;
            for (var i = 1, len = arguments.length; i < len; ++i){
                if (!cmp[arguments[i]]) return false;
            }
            return true;
        },


        /**
         * Performs an operation for each item in the specified object.
         *
         * @param callback
         */
        forEach: function(callback){
            var cmp = this.component;
            for (var i in cmp){
                if (cmp.hasOwnProperty(i)){
                    callback(cmp[i], i, cmp);
                }
            }
            return this;
        },


        /**
         * Creates a new object by performing a transformation on each value in the specified object.
         * @param callback
         */
        map: function(callback){
            var result = {};
            this.forEach(function(item, i, cmp){
                result[i] = callback(item, i, cmp);
            });
            return result;
        },


        /**
         * Returns an object of component key/value pairs that passed the filter.  The filter requires a callback
         * function that takes the following parameters:  (1) the value of the current property, the name of the
         * current property, and the component.  That function must return true/false.
         *
         * @param callback
         */
        filter: function(callback){
            var result = {}, cmp = this.component,
                i, item;
            this.forEach(function(item, i, cmp){
                if (callback(item, i, cmp) === true){
                    result[i] = item;
                }
            });
            return result;
        },


        /**
         * Returns the number of key/value pairs in the object.
         *
         * @return {Number}
         */
        size: function(){
            return Object.keys(this.component).length;
        },


        /**
         * Returns an object containing the differences between the component and the specified object--differences
         * being different properties, or properties with the same name but different values.
         *
         * @param that
         * @return {Object}
         */
        difference: function(that){
            var i, result = {};
            $.extend(result, this.component);
            for (i in that) {
                if (that.hasOwnProperty(i)){
                    if (result[i] && result[i] === that[i]) delete result[i];
                    else result[i] = that[i];
                }
            }
            return result;
        },


        /**
         * Returns an object containing the properties that match (same name and value) between the component and
         * the specified object.
         *
         * @param that
         * @return {*}
         */
        intersection: function(that){
            return this.filter(function(item, i, o){
                return that[i] == o[i];
            });
        },


        /**
         * Returns an array of the values in the component.
         *
         * @return {Array}
         */
        values: function(){
            var result = [];
            if (this.component){
                this.forEach(function(item){
                    result.push(item);
                });
            }
            return result;
        },


        /**
         * Converts the component to JSON.  Little more than syntactic sugar since it
         * merely calls JSON.stringify().
         *
         * @return {*}
         */
        serialize: function(){
            return JSON.stringify(this.component);
        },


        /**
         * Returns "[object ObjectDecorator]," identifying the class.
         *
         * @return {String}
         */
        toString: function(){
            return "[object ObjectDecorator]";
        },


        /**
         * Returns a "Specification" object that can be used to compare the spec for the component to
         * the spec for another object.  Used for duck-typing.
         */
        getSpec: function(){
            var spec = this.component;
            return Object.create({
                /**
                 * Returns true/false for whether the specified object has all of the properties in the component.
                 * and whether the types of the corresponding properties match.
                 *
                 * @param that
                 * @return {Boolean}
                 */
                like: function(that){
                    $.log("like start").log(that);
                    for (var i in spec){
                        if (spec.hasOwnProperty(i) && spec[i] !== null){
                            if (that[i] !== null && (typeof spec[i] !== typeof that[i])) {
                                $.log("like").log(i);
                                return false;
                            }
                        }
                    }
                    return true;
                },
                /**
                 * Returns true/false for whether the specs of the component and the specified object match exactly,
                 * sharing all of the same properties, and whether the types of the corresponding properties match.
                 *
                 * @param that
                 * @return {Boolean}
                 */
                equals: function(that){
                    for (var i in that){
                        if (that.hasOwnProperty(i) && that[i] !== null){
                            if (spec[i] !== null && (typeof spec[i] !== typeof that[i])) {
                                $.log("equals").log(i);
                                return false;
                            }
                        }
                    }
                    return this.like(that);
                }
            });
        },



        /**
         * Returns true/false for whether the specified value is contained in the object.
         *
         * @param that
         * @return {Boolean}
         */
        contains: function(that){
            function compare(a, b){
                if ($.isFunction(a.equals)){
                    return a.equals(b)
                }
                return false;
            }
            var cmp = this.component;
            for (var i in cmp){        // Intentionally not using hasOwnProperty for now.
                if (cmp[i] == that || ($.isObject(cmp[i] && compare(cmp[i], that)))) {
                    return true;
                }
            }
            return false;
        },


        add: function(key, value){
            this.component[key] = value;
            return this;
        },

        remove: function(key){
            var result = this.component[key];
            delete this.component[key];
            return result;
        },

        getComponent: function(){
            return this.component;
        }
    });


    mjs.decorate = function(that){
        return new ObjectDecorator(that);
    }

})(mjs);