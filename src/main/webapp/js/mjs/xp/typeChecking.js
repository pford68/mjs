/**
 *
 * @author Philip Ford
 */
(function ($) {
    $.require("mjs/core/oop");


    // Function extensions
    $.extend(Function.prototype, {
        assert: function _assert(func, msg){
            if (!$.isDebugEnabled()) return this;   // For chaining strings of addException() calls.
            if (!this.assertions) {
                var $this = this, f;
                Object.encapsulate("assertions", this, false);
                this.assertions = [];
                f = function(){
                    if (!$.isDebugEnabled()) return;
                    var i, len, assertion;
                    for (i = 0, len = $this.assertions.length; i < len; ++i){
                        assertion = $this.assertions[i];
                        if (!assertion.execute.apply($this, $.toArray(arguments))) {
                            $.error($this.name || "", assertion.msg);
                        }
                    }
                    return $this.apply(this, arguments);   // Fixing the scope: setting to back to the original method's object.
                };
            }
            this.assertions.push({ execute: func, msg: msg });

            return f;  // For chaining strings of assert() calls.
        }
    });


})(mjs);