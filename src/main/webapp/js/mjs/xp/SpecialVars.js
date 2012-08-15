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
                var caller = arguments ? arguments.callee.caller : null,
                    args = caller.arguments,
                    a, i, len, that = {};
                if (!caller) return;
                for (i = 0, len = args.length; i < len; ++i){
                    that[i] = callback(args[i], i)
                }
                //$.log("set").log(that);
                caller.$_ = that;
            },
            get: function(){
                var caller = arguments.callee.caller,
                    args = caller.$_;
                if (!caller.$_) return Array.prototype.slice.call(caller.arguments);
                return args;
            }
        }
    });





})(mjs);
