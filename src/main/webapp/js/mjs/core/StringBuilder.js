// TODO (2010/04/13):  In light of new information regarding String performance in modern browsers, re-test StringBuilder's
// performance vis-a-vis string concatenation.
// PF (2010/07/15):  common/oop.js now requires StringBuilder, so this file cannot require or use oop.js.

(function ($)
{
    $.requireIf("mjs/core/arrays", !Array.prototype.splice);

    /**
     * @namespace
     * @description Emulates Java's StringBuilder, concatenating strings more efficiently than the "+" operator.
     * @param {String} [s] An initial base string inserted in the buffer
     * @returns {Object} The StringBuilder object.
     * @author Philip Ford
     */
    function StringBuilder(s)
    {
        this.buffer = [];
        if (s != null) return this.append(s);
        return this;
    }

    $.extend(StringBuilder.prototype, {

        /**
         * <p>Adds the specified string to the buffer.</p>
         * @name append
         * @param {String} s The string to add to the buffer
         * @memberOf $.StringBuilder
         * @function
         */

        append: function(s)
        {
            var items = this.buffer;
            if (s != null) items[items.length] = s;
            return this;
        },

        /**
         * <p>Inserts a string in the buffer at the specified index (zero-based).</p>
         * @name insert
         * @param {Number} index The index in the buffer at which to insert the specified string.
         * @param {String} s The string to insert
         * @memberOf $.StringBuilder
         * @function
         */
        insert: function(index, s)
        {
            this.buffer.splice(index, 0, s);
        },

        /**
         * <p>Deletes the item in the buffer at the specified index</p>
         * @name deleteAt
         * @param {Number} index The index of the value to be replaced in the buffer.
         * @memberOf $.StringBuilder
         * @function
         */
        deleteAt: function(index)
        {
            this.buffer.splice(index, 1);
        },

        /**
         * <p>Replaces the string in the buffer at the specified index with another string.</p>
         * @name replaceAt
         * @param {Number} index The index of the value to be replaced in the buffer.
         * @param {String} s The replacement
         * @memberOf $.StringBuilder
         * @function
         */
        replaceAt: function(index, s)
        {
            this.buffer.splice(index, 1, s);
        },

        /**
         * <p>Returns the value at the specified index in the buffer</p>
         * @name get
         * @param {Number} index The index of the value to be retrieved from the buffer.
         * @memberOf $.StringBuilder
         * @function
         */
        get: function(index)
        {
            return this.buffer[index];
        },

        /**
         * <p>Builds the finished string and returns it.</p>
         * @name toString
         * @memberOf $.StringBuilder
         * @function
         */
        toString: function()
        {
            return this.buffer.join("");
        },
        

        /**
         * <p>Deletes the contents of the buffer.</p>
         * @name clear
         * @memberOf $.StringBuilder
         * @function
         */
        clear: function()
        {
            this.buffer = [];
        },


        /**
         * <p>Returns the number of items in the buffer.</p>
         * @name length
         * @memberOf $.StringBuilder
         * @function
         */
        length: function()
        {
            return this.buffer.length;
        }
    });

    $.extend({ StringBuilder: StringBuilder });

})(mjs);
