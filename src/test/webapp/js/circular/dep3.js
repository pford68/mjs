(function($){
    $.require("circular/dep1");
    $.require("circular/dep2");

    var circ = $.circular;
    circ.dep3 = { values: [ circ.dep1.getValue(), circ.dep2.getValue() ] }

    $.log("circular dep3").log(circ.dep3)
})(mjs);
