(function($)
{
    /**
     * Custom array functions as well as native array functions that may or may not be supported
     * by the current browser.
     *
     * Many of these are copied from MDC Array functions: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/
     * The exceptions are copy and contains.
     * 
     * @author Philip Ford
     */

    // TODO:  Is this method of adding missing functions truly more efficient than usual methods?

    function validate(list){
        if (!$.isArray(list)) throw new Error("The argument must be an array.");
    }

    var m = {
        /**
         * Copies the contents of the associated array to the specified array.
         * @param {Object[]} a The array to which to copy indices
         * @param {Integer} [start] The index at which to start copying indices
         * @param {Integer} [count] The number of elements to copy, including the one at index "start"
         * @scope Array.prototype
         */
        copy: function(a, start, count)
        {
            if (arguments.length == 0) return this.concat([]);

            var i, j = 0,
                    _start = (start != null ? start : 0),
                    _count = (count != null ? _start + count - 1 : this.length - 1);
            $.log(_start + ":" + _count);
            for (i = _start; i <= _count; ++i)
            {
                a[j] = this[i];
                ++j;
            }
        },


        /**
         * Inserts new elements and/or removes old elements.  For use in browsers that don't support the native function.
         * @param {Integer} startIndex The index at which to start the replacement/deletion/assertion.
         * @param {Integer} number  The number of items to delete/replace, starting with and including the element at startIndex, in the array.
         * @scope Array.prototype
         * @return {Object[]} The elements that were removed
         */
        splice: function(startIndex, number, varargs)
        {
            $.log("[Array.prototype.splice] Using custom splice");
            if (number > this.length || startIndex + number > this.length){
                number = this.length - startIndex;
            }

            var i, len, before = [], after = [], splice = [];
            // Creating 3 segments:  the part before the splice, the part after the splice, and the splice.
            if (number > 0) {
                this.copy(before, 0, startIndex);
                this.copy(after, number + 1, this.length);
                this.copy(splice, startIndex, number);
            }
            // Adding new elements to the first segment
            for (i = 2, len = arguments.length; i < len; ++i){
                before.push(arguments[i]);
            }

            // Copying the result to this
            var result = before.concat(after);
            for (i = 0, len = result.length; i < len; ++i){
                this[i] = result[i];
            }

            // Reset the length
            this.length  = result.length;

            // Return the removed elements
            return splice;
        },



        /**
         * @param item
         * @param startIndex
         */
        indexOf: function(item, startIndex)
        {
             var len = this.length >>> 0, from = startIndex || 0;

             from = (from < 0) ? Math.ceil(from) : Math.floor(from);
             if (from < 0)
               from += len;

             for (; from < len; from++)
             {
               if (from in this && this[from] === item)
                 return from;
             }
             return -1;
        },



        /**
         * 
         * @param item
         * @param startIndex
         */
        lastIndexOf: function(item, startIndex)
        {
            var len = this.length;
            if (isNaN(startIndex)) {
                startIndex = len - 1;
            } else {
                startIndex = (startIndex < 0) ? Math.ceil(startIndex) : Math.floor(startIndex);
                if (startIndex < 0) startIndex += len;
                else if (startIndex >= len) startIndex = len - 1;
            }

            for (; startIndex > -1; startIndex--) {
                if (startIndex in this && this[startIndex] === item)
                return startIndex;
            }
            return -1;
        },


        /**
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        forEach: function(callback, thisVal)
        {
            var i, len = this.length;
            for (i = 0; i < len; i++)
                callback.call(thisVal, this[i], i, this);
        },


        /**
         * Creates a new array by performing a transformation function on each item in the original array.
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        map: function(callback, thisVal)
        {
            var i, len = this.length, result = [len];
            for (i = 0; i < len; i++)
                result[i] = callback.call(thisVal, this[i], i, this);
            return result;
        },

        /**
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        filter: function(callback, thisVal)
        {
            var i, val, len = this.length, result = [];
            for (i = 0; i < len; i++)
            {
                val = this[i];
                if (callback.call(thisVal, val, i, this))
                    result[result.length] = val;
            }
            return result;
        },

        /**
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        every: function(callback, thisVal)
        {
            var i, len = this.length;
            for (i = 0; i < len; i++)
                if (!callback.call(thisVal, this[i], i, this))
                    return false;
            return true;
        },

        /**
         * @param callback
         * @param thisVal optional Object scope for the function.
         */
        some: function(callback, thisVal)
        {
            var i, len = this.length;
            for (i = 0; i < len; i++)
                if (callback.call(thisVal, this[i], i, this))
                    return true;
            return false;
        },

        contains: function(value)
        {
            for (var i = 0, len = this.length; i < len; ++i)
            {
                if (this[i] === value) return true;
            }
            return false;
        },


        /**
         * This function exists largely so that clients can use arrays without having to know whether
         * they are dealing with arrays.  Clients could test whether the array implements an interface
         * that requires size(), instead of whether the object involved is an array.  This permits the
         * clients to use array-like structures in addition to arrays.
         */
        size: function(){
            return this.length;
        },


        difference: function(list){
            validate(list);

            var instance = this, result;

            // Get the items in this that are not in list.
            result = this.filter(function(item){
                return !list.contains(item);
            });
            // Get the items in list that are not in this, then concatenate them to the result.
            return result.concat(list.filter(function(item){
                return !instance.contains(item);
            }));
        },


        intersection: function(list){
            validate(list);
            return this.filter(function(item){
                return list.contains(item);
            });
        },


        /**
         * Returns a new array containing all of the unique items in both the arrays.  The items in
         * the new array are unique.  When duplicates are found, the first of the duplicates in the
         * one that is retained in the new array.
         *
         * @param varargs
         * @return {*}
         */
        union: function(varargs){
            var list = [];
            for (var i = 0, len = arguments.length; i < len; i++){
                list = list.concat(arguments[i]);
            }
            var result = this.unique();
            return result.concat(list).unique();
        },


        /**
         * Returns a new array with a duplicates removed.  When duplicates are found, the first of the duplicates in the
         * one that is retained in the new array.  Thus, [1,2,4,5,5,4,6].unique() will be [1,2,4,5,6].
         *
         * @return {Array}
         */
        unique: function(){
            var result = [];
            for (var i = 0, len = this.length; i < len; ++i){
                if (!result.contains(this[i])) {
                    result.push(this[i]);
                }
            }
            return result;
        },


        flatten: function(){
            var result = [];
            for (var i = 0, len = this.length; i < len; ++i){
                if ($.isArray(this[i])){
                    result = result.concat(this[i].flatten());
                } else {
                    result[i] = this[i];
                }
            }
            return result;
        },


        /**
         * Inserts an element at the specified index.  Unlike splice(), it does not remove elements.
         *
         * @return this
         */
        insert: function(args){
            var a = [], b = [], result, i, len,
                index = args.index,
                items = args.items;
            if (!$.isArray(items)) items = [items];
            this.copy(a, 0, index);  // The index where we want to insert item is the count for the first segment.
            this.copy(b, index);

            result = a.concat(items).concat(b);
            for (i = 0, len = result.length; i < len; ++i){
                this[i] = result[i];
            }
            this.length = result.length;
            return this;
        },


        /**
         *  Copies array elements to an object, behaving a little like PERL's each(), except this function can't
         *  copy to new variables.   The "that" parameter is an object.  With "destructuring assignments" coming (or
         *  here), assigning results to arrays of variables in not needed,
         */
        toEach: function(that){
            var i, index = 0;
            for (i in that) {
                if (that.hasOwnProperty(i)){
                    that[i] = this[index];
                    ++index;
                }
            }
            return that;
        },


        clone: function(){
            return this.slice(0);
        },


        remove: function(index){
            var result = this[index];
            this.splice(index, 1);
            return result;
        },


        /**
         * Returns the last item in the array without removing it.
         *
         * @return {*}
         */
        last: function(){
            return this[this.length - 1];
        },


        /**
         * <p>Converts an array of Strings to an object for fast lookup.  Each item in the array becomes
         * both the key and the value for the corresponding item in the resulting object.  Intended for
         * use with String arrays.</p>
         *
         * <p>This is probably only needed if you have to lookup items several times on the same array.  If you
         * only have to do one lookup, just use indexOf(), using the returned index to get the list item.</p>
         *
         * @return {Object} The "set" of Strings, each of which is both a key and a value.
         */
        toSet: function(){
            var that = {};
            this.forEach(function(item){
                var hash = item.hash ? item.hash() : item.valueOf();
                that[hash] = item;
            });
            return that;
        }

    };

    $.augment(Array.prototype, m);
})(mjs);