/**
 *
 * @author Philip Ford
 */
(function(my, lib) {

    var f = lib.ajax;
    my.ajax = function(args){
        args.error = args.failure;
        args.data = args.params || args.data;
        delete args.failure;
        delete args.data;
        f(args);
    };

})(mjs, jQuery);