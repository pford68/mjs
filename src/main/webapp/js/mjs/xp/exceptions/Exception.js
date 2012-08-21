/**
 *
 * @author Philip Ford
 */
(function($) {
    $.require("mjs/xp/ObjectFactory");

    $.Exception = $.getFactory(new Error(), {
        name: 'Exception',
        src: {
            get: function(){ return arguments.callee.caller.name }
        },
        message: {
            get: function(){ return ("[" + src + "]" + message); }
        }
    });

    $.IllegalArgumentException = $.Exception.extend({
        name: 'IllegalArgumentException'
    });

})(mjs);