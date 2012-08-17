/**
 *
 * @author Philip Ford
 */
(function($) {

    var methods = {
        /**
         *
         * @param c
         */
		endsWith: function(c){
			var start = this.length - c.length;
			return (c === this.substr(start, c.length));
		},

        /**
         *
         * @param c
         */
		startsWith: function(c){
			return (c === this.substr(0, c.length));
		},

        /**
         *
         */
        capitalize: function(){
            var str = this.toLowerCase();
            return str.charAt(0).toUpperCase() + str.substring(1);
        },

        /**
         *
         */
        uncapitalize: function(){
            return this.charAt(0).toUpperCase() + this.substring(1);
        },

        /**
         *
         */
        trim: function(){ return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); },
        trimLeft: function(){ return this.replace(/^\s+/g, ""); },
        trimRight: function() { return this.replace(/\s+$/g, ""); },

        /**
         *
         * @param args
         */
		replaceArgs: function(){
			if (arguments.length == 0) return;
			var str = this + "", re, i, len;

			for (i = 0, len = arguments.length; i < len; i++){
				re = new RegExp("\\{" + i + "\\}", "gi");
				str = str.replace(re, arguments[i]);
			}

			return str;
		},

        /**
         *
         * @param args
         */
        applyTemplate: function(args) {
            if (args == null) return;
            var str = this + "", re, i;
            for (i in args) {
                re = new RegExp("\\{" + i + "\\}", "gi");
                str = str.replace(re, args[i]);
            }
            return str;
        },

        /**
         * Requires spaces between intended syllables
         */
        toCamelCase: function(){
            var i, len, s, result = [], instance = this, syllables = instance.split(/\s+/);
            for (i = 0, len = syllables.length; i < len; ++i){
                if (i > 0) s = syllables[i].capitalize();
                else s = syllables[i].toLowerCase();
                result.push(s);
            }
            return result.join("");
        },

        /**
         * Returns true/false for whether the specified string exists within the current string.
         *
         * @param str
         */
        contains: function(str) {
            return this.indexOf(str) != -1;
        },


        /**
         * Returns true if the Strings have equal content, regardless of case.
         *
         * @param value
         * @return {Boolean}
         */
        equalsIgnoreCase: function(value){
            if (!$.isString(value)) return false;
            return this.toLowerCase() == value.toLowerCase();
        },

        /**
         * Converts the string to a boolean <strong>if and only if</strong> the string is eother "true" or "false."
         * Anything else is return as-is.
         *
         * @return {Boolean | String}
         */
        toBoolean: function(){
            if (this.trim() === "true") return true;
            else if (this.trim() === "false") return false;
            else return this;
        },


        /**
         * Returns true if the String has no content, contains only whitespace.
         *
         * @return {Boolean}
         */
        isEmpty: function(){
            return this.trim() === "";
        },

        /**
         * Returns true if the String contains any content other than whitespace.
         * @return {Boolean}
         */
        notEmpty: function(){
            return !this.isEmpty();
        },


        /**
         * Returns true/false for whether the String is all uppercase.
         * @return {Boolean}
         */
        isUpperCase: function(){
            return this.toUpperCase() == this;
        }
        
    };

    $.augment(String.prototype, methods);
    String.prototype.namespace = "String.prototype";
})(mjs);