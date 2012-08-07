(function($){
    $.require("circular/dep2");

    var value = 1;
    $.circular = $.circular || { };
    $.circular.dep1 = {
        getValue: function(){ return 1; },
        init: function(){ return $.circular.deps2.getValue() + 1; }
    };
})(mjs);
