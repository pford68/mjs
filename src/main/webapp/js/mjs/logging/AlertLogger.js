(function($) {
    $.require("mjs/core/arrays");

    var AlertLogger = {
        log: function(msg){
            alert(msg);
        },
        dir: function(that){
            alert(JSON.stringify(that));
        }
    };
    ['info','warn','debug','error'].forEach(function(item){
        AlertLogger[item] = function(msg){ this.log(msg); }
    });

    return AlertLogger;

})(mjs);