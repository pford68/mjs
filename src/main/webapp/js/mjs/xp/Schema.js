/**
 *
 * @author Philip Ford
 */
(function($) {
    $.require("mjs/xp/ObjectX");

    $.Schema = $.ObjectX.extend({
        compare: function(that){
            var spec = Object.keys(this), prop;
            for (var i = 0, len = spec.length; i < len; ++i){
                prop = spec[i];
                if (typeof that[prop] !== typeof this[prop]){
                    return false;
                }
            }
            return true;
        }
    })

})(mjs);