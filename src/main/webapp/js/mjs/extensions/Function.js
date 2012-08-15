/**
 * Extensions to the Function prototype
 *
 * @author Philip Ford
 */
(function($) {

    $.require("mjs/core/aop");

    /**
     *
     * @param that
     * @return {*}
     */
    Function.prototype.chain = function(that){
        // When the new advised function executes, "this" should be the
        // execution scope.  When chain() executes, "this" should be the
        // original function.
        return $.addAdvice(function(){ return that || this }).after(this);
    };

})(mjs);