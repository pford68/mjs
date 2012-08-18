
(function($) {
    $.require("mjs/core/oop");
    $.require("mjs/core/interfaces");

    /**
     * <p>Converts an array of objects into an internal hash map whose keys are based on the values of specified keys.
     * In other words, each element of the new array keys gets a key that depends on values of properties
     * within the element.</p>
     *
     * <p>It requires a key template, of the type used by String.prototype.applyTemplate(). That template is
     * used internal to form each entry's hash from property values contained in the entry.</p>
     *
     * <p>The difference between this class and the Hash<ap is the way the hash is created, and who is responsible
     * for creating it.  The HashMap requires that the objects used for keys already have their own strategy for
     * creating a hash, if they aren't Strings.  For the Hashtable, however, keys are created on the fly, using
     * properties of the items in the table.</p>
     *
     * <p>Inspired by an idea in <em>JavaScript & DHTML Cookbook</em> by Danny Goodman.
     * The implementation is my own.</p>
     */
    $.util.Hashtable = $.Class({

        _key: "",       // Private
        _items: null,   // Private,
        _className: 'mjs.util.Hashtable', // Private

        /**
         * Takes an array of objects and a template for forming the hashes and produces a hashtable.
         *
         * @param {String} key A template of the form accepted by String.applyTemplate()
         * @param {Array} [items] An array of objects to convert to a hashtable
         */
        initialize: function(key, items)
        {
            this._items = {};

            this._key = key;
            if (items) {
                this.addAll(items);
            }

            if (!$.isString(this._key)){
                throw new Error("A key template is required.", this._className);
            }
        },

        /**
         * Returns true/false for whether the specified key exists in hashtable.
         *
         * @param {String} key
         * @return {Boolean}
         */
        containsKey: function(key)
        {
            return typeof this._items[key] !== 'undefined';
        },


        /**
         * Adds an array of objects to the hashtable.
         *
         * @param {Array} items
         */
        addAll: function(items){
            if (!items.length) return;
            for (var i = 0, len = items.length; i < len; i++)
            {
                this.add(items[i]);
            }
        },

        /**
         * Adds an item to the hashtable.
         *
         * @param {Object} that
         */
        add: function(that)
        {
            this._items[this._key.applyTemplate(that)] = that;
         },


        /**
         * Retrieves an item from the table by its key.
         *
         * @param {String} key
         * @return {*}
         */
        get: function(key)
        {
            return this._items[key];
        },


        /**
         * Removes the item with the specified key from the table.
         *
         * @param {String} key
         * @return {*}
         */
        remove: function(key)
        {
            var elem = this._items[key];
            delete this._items[key];
            return elem;
        },


        /**
         * Executes a function for each item in the table.  That function can take the following
         * parameters:
         * <ol>
         *     <li>the current item (required)</li>
         *     <li>the current key</li>
         *     <li>the hsshtable</li>
         * </ol>
         *
         *
         * @param {Function} f
         */
        forEach: function(f)
        {
            var i, items = this._items, instance = this;
            for (i in items)
            {
                if (items.hasOwnProperty(i))
                {
                    f(items[i], i, instance);
                }
            }
        },


        /**
         * Converts the table to an array.
         *
         * @return {*}
         */
        toArray: function(){
            return $.toArray(this._items);
        },


        /**
         * Returns the size of the table.
         *
         * @return {Number}
         */
        size: function(){
            return Object.keys(this._items).length;
        }

    }).implement($.Iterable);


})(mjs);