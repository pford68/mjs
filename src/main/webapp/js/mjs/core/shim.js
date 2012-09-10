(function($){


    // Ensure that certain new browser features exist.
    $.augment(Object, {
        // Object.keys() is used frequently in the framework.
        keys: function(that){
            var count = 0;
            for (var i in that){
                if (that.hasOwnProperty(i)){
                    ++count;
                }
            }
            return count;
        }
    });

    $.augment(Function.prototype, {
        // Why use this when $.proxy is available?
        bind: function(that){
            var defaults, $this = this;

            if (arguments.length > 2){
                defaults = $.toArray(arguments).slice(2);
            }
            return function() {
                return $this.apply(that, defaults ? defaults.concat($.from(arguments)) : arguments);
            }
        }
    });

})(mjs);