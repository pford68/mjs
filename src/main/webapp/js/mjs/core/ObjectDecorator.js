/**
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


        augment: function(that){
            var i, cmp = this.component;
            for (i in that) {
                if (that.hasOwnProperty(i))
                    if (cmp[i] == null) cmp[i] = that[i];
            }
            return this;   // For chaining
        },



        override: function(that){
            var cmp = this.component;
            for (var i in that) {
                if (that.hasOwnProperty(i))
                    if (i in cmp) cmp[i] = that[i];
            }
            return this;  // For chaining
        },


        /**
         *
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
         *
         * @return {Number}
         */
        size: function(){
            return Object.keys(this.component).length;
        },


        /**
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
         *
         * @param that
         * @return {*}
         */
        intersection: function(that){
            return this.filter(function(item, i, o){
                return that[i] == o[i];
            });
        },

        /*
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
        },  */



        values: function(){
            var result = [];
            if (this.component){
                this.forEach(function(item){
                    result.push(item);
                });
            }
            return result;
        },



        serialize: function(){
            return JSON.stringify(this.component);
        },

        toString: function(){
            return "[object ObjectDecorator]";
        },


        getSpec: function(){
            var spec = this.component;
            return Object.create({
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
        }
    });


    mjs.decorate = function(that){
        return new ObjectDecorator(that);
    }

})(mjs);