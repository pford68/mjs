/**
 *
 * @author Philip Ford
 */
(function ($) {
    $.require("xp/ObjectFactory");


    var blueprint = {
        equals: function(that){ return this == that; },
        compareTo: function(){}
    };

    $.ObjectX = $.ObjectFactory(blueprint);

})(mjs);