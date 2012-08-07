(function($){
    $.require("circular/dep1");

    var value = 3;
    $.circular = $.circular || { };
    $.circular.dep2 = {
        init: function(){ return $.circular.dep1.getValue() + value },
        getValue: function(){ return value; }
    }
})(mjs);