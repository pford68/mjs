/**
 *
 * @author Philip Ford
 */
(function($) {	
	
	
	function weave(type, advised, advisedFunc, adviser, adviserFunc){	
		var f,$execute, standalone = false;
		
		if (!advisedFunc) {
			$.error("$.aop:  weave", "Insufficient number of arguments.");
		} else if (!adviser) {
			standalone = true;
			adviser = arguments[2];
			$execute = arguments[1];
		} else if (!adviserFunc) {
			$execute = $.proxy(advised, advisedFunc);				
		} else {
			adviser = $.proxy(adviser, adviserFunc);	
			$execute = $.proxy(advised, advisedFunc);
		}
		
		if (type == 'before') {
			f = function(){
				adviser.apply(advised, arguments);					// Invoke the advice.
				return $execute.apply(advised, arguments);			// Call the original function.		
			}
		} else if (type == 'after') {
			f = function(){
				f.cachedResult = $execute.apply(advised, arguments);	// Call the original function and store the result.									
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
			$.error("$.aop: weave", "Unsupported advice type:  " + type);
		}
		
		if (standalone) {
			return advised = f;
		} else {
			return advised[advisedFunc] = f;	
		}
		
	}

    

    //======================================================================== Public methods
	var methods = {
        /**
         * <p>Causes adviser[adviserFunc] to be executed before every call to advised[advisedFunc].</p>
         * @param {Object} advised
         * @param {String} advisedFunc The name of the function that represents the pointcut
         * @param {Object} adviser
         * @param {String} adviserFunc
         */
		before: function(advised, advisedFunc, adviser, adviserFunc) {
			return weave("before", advised, advisedFunc, adviser, adviserFunc);
		},

        /**
         * <p>Causes adviser[adviserFunc] to be executed after every call to advised[advisedFunc].
         * The result of subsequent calls to advised[advisedFunc] is cached and can be retrieved with
         * $.aop.getResult(advised, advisedFunc, [index])</p>
         *
         * @param {Object} advised
         * @param {String} advisedFunc
         * @param {Object} adviser
         * @param {String} adviserFunc
         */
		after: function(advised, advisedFunc, adviser, adviserFunc) {
			return weave("after", advised, advisedFunc, adviser, adviserFunc);
		},

        /**
         * <p>Wraps advised[advisedFunc] within adviser[adviserFunc].  In order to work the advice function
         * (adviserFunc) must have a parameter representing an "invocation" and must call invocation.proceed()
         * where the original function should be called.</p>
         * @param {Object} advised
         * @param {String} advisedFunc
         * @param {Object} adviser
         * @param {String} adviserFunc
         */
		around: function(advised, advisedFunc, adviser, adviserFunc){
			return weave("around", advised, advisedFunc, adviser, adviserFunc);
		},


        /**
         * Retrieves the result of the original function.
         * 
         * @param {Object} advised
         * @param {String} advisedFunc
         * @param {Integer} [index]
         */
		getCachedResult: function(advised, advisedFunc) {
			var f;
			if (advisedFunc) {
				f = advised[advisedFunc];
			} else {
				f = advised;	
			}
			return f.cachedResult;
		}
	};

	$.extend($, {"aop": methods});
})(mjs);