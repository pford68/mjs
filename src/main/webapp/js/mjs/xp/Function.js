/**
 *
 */

(function($){

    $.require("mjs/core/utils");
    $.require("mjs/core/aop");


    // Global variables
    Object.defineProperties(window, {
        $_: {
            configurable: false,
            enumerable: false,
            set: function(callback){
                var caller = arguments.callee.caller,
                    args = caller.arguments,
                    a, i, len, that = {};
                for (i = 0, len = args.length; i < len; ++i){
                    that[i] = callback(args[i], i)
                }
                caller.$_ = that;
            },
            get: function(){
                return arguments.callee.caller.$_;
            }
        }
    });


    /**
     *
     * @param that
     * @return {*}
     */
    Function.prototype.chain = function(that){
        // When the new advised function executes, "this" should be the
        // execution scope.  When chain() executes, "this" should be the
        // original function.
        return $.addAdvice(function(){ return that || this }).after(this);
    }

})(mjs);
