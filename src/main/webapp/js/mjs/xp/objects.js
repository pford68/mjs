/**
 * Extensions to Object.prototype. These are not enumerable, so some safety concerns are alleviated, though
 * collisions with other libraries would still be possible.
 *
 * @author Philip Ford
 */
(function($) {

    $.augment(Object, {
        keys: function(that){
            var count = 0;
            for (var i in that){
                if (that.hasOwnProperty(i)){
                    ++count;
                }
            }
            return count;
        }
    });


    Object.defineProperties(Object.prototype, {

        type: {
            enumerable: false,
            configurable: false,
            get: function(){
                return this.constructor.name || "Object";
            }
        },



        extend: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(varargs){
                function _extend(a, b){
                    for (var i in b){
                        if (b.hasOwnProperty(i)){
                            a[i] = b[i];
                        }
                    }
                    return a;
                }

                for (var i = 0; i < arguments.length; i++){
                    _extend(this, arguments[i]);
                }
                return this;   // For chaining
            }
        },



        augment: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(that){
                var i;
                for (i in that) {
                    if (that.hasOwnProperty(i))
                        if (this[i] == null) this[i] = that[i];
                }
                return this;   // For chaining
            }
        },



        override: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(that){
                for (var i in that) {
                    if (that.hasOwnProperty(i))
                        if (i in this) this[i] = that[i];
                }
                return this;  // For chaining
            }
        },



        clone: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(){
                var clone = {}, p, i;
                for (i in this){
                    if (this.hasOwnProperty(i)){
                        p = this[i];
                        if ($.isArray(p)) {
                            var c = [];
                            for (var j = 0, len = p.length; j < len; ++j){
                                c = $.clone(p[j]);
                            }
                            clone[i] = c;
                        }
                        else if (p.type === 'Object' || $.isFunction(p.clone)){    // Create an Array.clone()?
                            clone[i] = this.clone(p);
                        }
                        else {
                            clone[i] = p;
                        }
                    }
                }
                return clone;
            }
        },



        /**
         *
         */
        has: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(varargs){
                for (var i = 1, len = arguments.length; i < len; ++i){
                    if (!this[arguments[i]]) return false;
                }
                return true;
            }
        },


        /**
         * Performs an operation for each item in the specified object.
         *
         * @param callback
         */
        forEach: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(callback){
                for (var i in this){
                    if (this.hasOwnProperty(i)){
                        callback(this[i], i, this);
                    }
                }
            }
        },


        /**
         * Creates a new object by performing a transformation on each value in the specified object.
         * @param callback
         */
        map: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(callback){
                var result = {}, instance = this;
                this.forEach(function(item, i){
                    result[i] = callback(item, i, instance);
                });
                return result;
            }
        },


        /**
         *
         * @param callback
         */
        filter: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(callback){
                var result = {}, instance = this;
                this.forEach(function(item, i){
                    if (callback(item, i, instance)){
                        result[i] = item;
                    }
                });
                return result;
            }
        },


        /**
         *
         * @return {Number}
         */
        size: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(){
                return Object.keys(this).length;
            }
        },


        difference: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(that){
                var i, result = {};
                $.extend(result, this);
                for (i in that) {
                    if (that.hasOwnProperty(i)){
                        if (result[i]) delete result[i];
                        else result[i] = that[i];
                    }
                }
                return result;
            }
        },



        intersection: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(that){
                return this.filter(function(item, i, o){
                    return that[i] == o[i];
                });
            }
        },


        hashCode: {
            enumerable: false,
            configurable: false,
            set: function(callback){
                this.hashCode = callback();
            }
        },



        equals: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(that){
                return (this.getType() === that.getType()) &&
                    this.hashCode && that.hashCode &&
                    (this.hashCode === that.hashCode);
            }
        },



        values: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(){
                var result = [];
                this.forEach(function(item){
                    result.push(item);
                });
                return result;
            }
        },



        /**
         * Return a new objects whose keys are sorted.
         */
        sort: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(){
                var result = {},
                    keys = Object.keys(this).sort(),
                    i, key,
                    len = keys.length;
                for (i = 0; i < len; ++i){
                    key = keys[i];
                    result[key] = this[key];
                }
                return result;
            }
        },


        sortValues: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function(){
                return this.values().sort();
            }
        },


        toString: {
            configurable: false,
            value: function(){
                return JSON.stringify(this);
            }
        },


        getSpec: {
            enumerable: false,
            configurable: false,
            value: function(){
                var spec = this;
                return Object.create({
                    like: function(that){
                        for (var i in spec){
                            if (spec.hasOwnProperty(i)){
                                if (typeof spec[i] !== typeof that[i]) return false;
                            }
                        }
                        return true;
                    },
                    equals: function(that){
                        for (var i in that){
                            if (that.hasOwnProperty(i)){
                                if (typeof spec[i] !== typeof that[i]) return false;
                            }
                        }
                        return this.like(that);
                    }
                })
            }
        }
    });

})(mjs);