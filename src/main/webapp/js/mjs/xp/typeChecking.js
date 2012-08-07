/**
 *
 * @author Philip Ford
 */
(function ($) {

    function validateFunction(){
        if (!$.isDebugEnabled() || !this.exceptions) return;
        var i, len, ex, src,
            $A = Array.prototype.slice,
            args = $A.call(arguments);
        for (i = 0, len = this.exceptions.length; i < len; ++i){
            ex = this.exceptions[i];
            if (!ex.assertion.apply(this, args)) {
                src = (this.$scope && this.$scope.namespace) ? this.$scope.namespace + "." + this.name : this.name;
                $.error(src || "", ex.msg);
            }
        }
    }


    // Function extensions
    $.extend(Function.prototype, {
        addException: function(msg, func){
            if (!$.isDebugEnabled()) return this;   // For chaining strings of addException() calls.
            if (!$.isString(msg)) $.error("Function.addException", "The first argument must be a string.");
            if (!$.isFunction(func)) $.error("Function.addException", "The second argument must be a function.");
            if (!this.exceptions) this.exceptions = [];
            this.exceptions.push({ assertion: func, msg: msg });

            var $this = this, $A = Array.prototype.slice, f;
            f = function(){
                var args = $A.call(arguments);
                validateFunction.apply($this, args);
                return $this.apply(this, args);   // Fixing the scope: setting to back to the original method's object.
            };

            if (this.$scope && this.name){
                return this.$scope[this.name] = f;   // For chaining strings of addException() calls.
            }
            return f;  // For chaining strings of addException() calls.
        },

        declare: function(name, scope){
            this.name = name;
            this.$scope = scope;
            return this;   // For chaining
        }
    });



    /**
     * Usage:  $.Spec({ id: 3, owner: 'pford' }).like(data);
     * @type {*}
     */
    $.Spec = function(spec){
        spec = Object.freeze(spec);
        return Object.create({
            /**
             * Returns true/false for whether the specified object has all of the properties
             * in spec.  Both the property names and property data types must match.
             *
             * @param that
             * @return {*}
             */
            like: function(that){
                for (var i in spec){
                    if (spec.hasOwnProperty(i)){
                        if (typeof spec[i] !== typeof that[i]) return false;
                    }
                }
                return true;
            },
            /**
             * Returns true/false for whether the specified object has exactly the same properties as the spec--
             * no more, no less--thus matching the blueprint's spec exactly.  Both the property names and property
             * data types must match.
             *
             * @param that
             * @return {*}
             */
            equals: function(that){
                for (var i in that){
                    if (that.hasOwnProperty(i)){
                        if (typeof spec[i] !== typeof that[i]) return false;
                    }
                }
                return this.like(that);
            }
        });
    }

})(mjs);