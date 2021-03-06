/**
 *
 * @author Philip Ford
 */
(function($) {
    $.require("mjs/core/ObjectFactory");

    // TODO:  i18n messages

	function weave(type, advised, advisedFunc, aopProxy){
		var f,$execute, standalone = false,
            transfer = aopProxy.transfer,
            adviser = aopProxy.adviser;

		if (!advisedFunc) {
			standalone = true;
			$execute = arguments[1];
		} else {
			$execute = $.proxy(advised, advisedFunc);
		}
        aopProxy.advised = $execute;
		
		if (type == 'before') {
			f = function(){
				var result = adviser.apply(advised, arguments);		    // Invoke the advice.
                result = result && !transfer ? [result] : null;
				return $execute.apply(advised, result || arguments);	// Call the original function.
			}
		} else if (type == 'after') {
			f = function(){
				var result = $execute.apply(advised, arguments);	// Call the original function and store the result.
                result = result && !transfer ? [result] : null;
                return adviser.apply(advised, result || arguments);				// Invoke the advice.
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
     * To access these methods, you must call $.addAdvice() to return a correct Advice object.
     *
     * @type {Object}
     */
	var blueprint = {

        //transfer: true,     // Whether to pass the function arguments along to the other wrapped function.

        /**
         * <p>Causes the adviser to be executed before every call to advised[advisedFunc].</p>
         * <p>If the adviser returns a result, and you want that result, instead of the parameters,
         * to be passed to the wrapped function, set the transfer parameter is set to "false" when
         * calling addAdvice().  That parameter defaults to true.</p>
         *
         * @param {Object | Function} advised The function to be advised or the object containing method to be advised
         * @param {String} [advisedFunc] The name of the function that represents the pointcut
         */
		before: function(advised, advisedFunc) {
			return weave("before", advised, advisedFunc, this);
		},

        /**
         * <p>Causes adviser to be executed after every call to advised[advisedFunc].</p>
         * <p>If the original function returns a result, and you want that result, instead of the parameters,
         * to be passed to the advising function, set the transfer parameter is set to "false" when
         * calling addAdvice().  That parameter defaults to true.</p>
         *
         * @param {Object | Function} advised The function to be advised or the object containing method to be advised
         * @param {String} [advisedFunc] The name of the function that represents the pointcut
         */
		after: function(advised, advisedFunc) {
			return weave("after", advised, advisedFunc, this);
		},

        /**
         * <p>Wraps advised[advisedFunc] within adviser.  In order to work the advising function
         * (adviser) must have a parameter representing an "invocation" and must call invocation.proceed()
         * where the original function should be called.</p>
         *
         * <p>The transfer parameter has no effect on this method.</p>
         *
         * @param {Object | Function} advised  The function to be advised or the object containing method to be advised
         * @param {String} [advisedFunc] The name of the function that represents the pointcut
         */
		around: function(advised, advisedFunc){
			return weave("around", advised, advisedFunc, this);
		}
	};

    var Advice = $.getFactory(blueprint);


    /**
     * Creates an Advice object with methods for adding advice to another function or object method.
     *
     * @param {Object | Function} adviser The function that will add advice, or the object whose method will do so
     * @param {String | Function} [method] The method, or the name of the method, that will add advice
     * @param {boolean} [transfer] Whether to pass the function arguments, defaults to true.
     */
    $.addAdvice = function(adviser, method, transfer){
        adviser = method ? $.proxy(adviser, method) : adviser;
        if (!$.isFunction(adviser)) {
            throw new TypeError("An adviser function is required in mjs.addAdvice", "mjs/core/aop.js");
        }
        return Object.seal(Advice.build({
            adviser: adviser,
            transfer: transfer != null ? transfer : true
        }));
    }

})(mjs);