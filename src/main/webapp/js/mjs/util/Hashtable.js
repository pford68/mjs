

(function($) {
    $.require("mjs/core/oop");
    $.require("mjs/core/interface");

    /**
     * Converts an array of objects into an internal hash map whose keys are based on the values of specified keys.
     * In other words, each element of the new array keys gets a key that depends on values of properties
     * within the element.
     */
    $.Hashtable = $.Class({

        key: "",

        /**
         * Takes an array of objects and a key.
         *
         * @param items
         * @param key
         */
        initialize: function(items, key)
        {
            this.items = {};

            if (key) {
                if (!$.isString(key)) {
                    // TODO:  throw error
                }
                this.key = key;
                this.addAll(items);
            } else {
                this.key = items;
            }
            Object.seal(this);
        },

        containsKey: function(key)
        {
            return typeof this.items[key] !== 'undefined';
        },

        addAll: function(items){
            if (!items.length) return;
            for (var i = 0, len = items.length; i < len; i++)
            {
                if (!$.isObject(items[i]))
                {
                    throw new Error("[Hashtable.addAll] items must be an array of Objects.");
                }
                this.add(items[i], this.key.applyTemplate(items[i]));
            }
        },

        add: function(obj, key)
        {
            this.items[key] = obj;
         },

        get: function(key)
        {
            return this.items[key];
        },

        remove: function(key)
        {
            var elem = this.items[key];
            delete this.items[key];
            return elem;
        },

        forEach: function(f)
        {
            var i, items = this.items, instance = this;
            for(i in items)
            {
                if (items.hasOwnProperty(i))
                {
                    f(items[i], i, instance);
                }
            }
        },

        toArray: function(){
            return $.toArray(this.items);
        },

        size: function(){
            return this.toArray().length;
        }
    }).implement($.Iterable);


})(mjs);