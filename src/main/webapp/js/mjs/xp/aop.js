/**
 *
 * @author Philip Ford
 */
(function($) {
    $.require("mjs/xp/ObjectFactory");
    $.require("mjs/xp/exceptions");

    // TODO:  i18n messages
	
	function weave(type, advised, advisedFunc, aopProxy){
		var f,$execute, standalone = false, adviser = aopProxy.adviser;
        aopProxy.flush();
		
		if (!advisedFunc) {
			standalone = true;
			$execute = arguments[1];
		} else {
			$execute = $.proxy(advised, advisedFunc);
		}
        aopProxy.advised = $execute;
		
		if (type == 'before') {
			f = function(){
				adviser.apply(advised, arguments);					// Invoke the advice.
				return $execute.apply(advised, arguments);			// Call the original function.		
			}
		} else if (type == 'after') {
			f = function(){
				aopProxy.cache = $execute.apply(advised, arguments);	// Call the original function and store the result.
				return adviser.apply(advised, arguments);				// Invoke the advice.
			};
		} else if (type == 'around') {
			var invocation = { 
				proceed: function() {
					return this.method.apply(this, this.args);
				}
			};
			f = function() {
				invocation.args = arguments;
				invocation.method = $execute;
				invocation.name = advisedFunc;
				return adviser(invocation);
			}
		} else {
			$.error("AOP Error", "Unsupported advice type:  " + type);
		}
		
		if (standalone) {
			return advised = f;
		} else {
			return advised[advisedFunc] = f;	
		}
		
	}

    

    //======================================================================== Public methods

    /**
     * To acess there methods, you must call $.aop.add() to return a correct AOP object.
     *
     * @type {Object}
     */
	var blueprint = {

        /**
         * <p>Causes adviser to be executed before every call to advised[advisedFunc].</p>
         * @param {Object} advised
         * @param {String} advisedFunc The name of the function that represents the pointcut
         */
		before: function(advised, advisedFunc) {
			return weave("before", advised, advisedFunc, this);
		},

        /**
         * <p>Causes adviser to be executed after every call to advised[advisedFunc].
         * The result of subsequent calls to advised[advisedFunc] is cached and can be retrieved with
         * $.aop.push()</p>
         *
         * @param {Object} advised
         * @param {String} advisedFunc
         */
		after: function(advised, advisedFunc) {
			return weave("after", advised, advisedFunc, this);
		},

        /**
         * <p>Wraps advised[advisedFunc] within adviser.  In order to work the advising function
         * (adviser) must have a parameter representing an "invocation" and must call invocation.proceed()
         * where the original function should be called.</p>
         * @param {Object} advised
         * @param {String} advisedFunc
         */
		around: function(advised, advisedFunc){
			return weave("around", advised, advisedFunc, this);
		},


        /**
         * Retrieves the result of the original function and clears the cache.
         */
		flush: function() {
			var result = this.cache;
            this.cache = null;
            return result;
		}
	};

    var Advice = $.getFactory(blueprint);


    $.addAdvice = function(adviser, method){
        adviser = method ? $.proxy(adviser, method) : adviser;
        if (!$.isFunction(adviser)) {
            throw new $.IllegalArgumentException("An adviser function is required in mjs.addAdvice", "xp/aop.js");
        }
        var advice = Advice.build();
        advice.adviser = adviser;
        return Object.seal(advice);
    }

})(mjs);