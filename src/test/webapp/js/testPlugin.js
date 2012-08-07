(function($) {
    $.log("testPlugin executed.");

    if (!$.loadCount){
        $.loadCount = 0;
    }
    ++($.loadCount);

    var $public = {
        ping: function(){
            return "OK";
        }
    };

    $.extend({test: $public});

})(mjs);