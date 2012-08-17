/**
 * <p>A map that supports using any Object as a key, as long as that Object correctly implements a hash() method,
 * similar to Java's hashCode().  The hash() method must return a unique value, though not necessarily an integer.
 * Ideally the value should be dependent on properties in the Object.</p>
 *
 * <p>Inspired by the solution discussed at StackOverflow.  However, I do not use a doubly-linked list for fast
 * iteration of keys and values, as that solution does.  I felt that was redundant since I already have a separate
 * LinkedList implementation.</p>
 *
 * @see http://stackoverflow.com/questions/368280/javascript-hashmap-equivalent
 *
 * @author Philip Ford
 */
(function($) {

    $.require("mjs/core/oop");
    $.require("mjs/core/interfaces");
    $.require("mjs/core/ObjectDecorator");


    $.util.HashMap = $.Class({

        _items: null,
        _className: "mjs.util.HashMap",

        initialize: function(map){
            this._items = {};
            if (map) this.putAll(map);
        },

        put: function(key, value){
            this._items[Object.hash(key)] = value;
        },

        putAll: function(map){
            var instance = this;
            mjs.decorate(map).forEach(function(item, key){
                instance.put(key, item);
            });
        },

        get: function(key){
            return this._items[Object.hash(key)];
        },

        keys: function(){
            return Object.keys(this._items);
        },

        values: function(){
            var result = [];
            this.forEach(function(item){
                result.push(item);
            });
            return result;
        },

        size: function(){
            return Object.keys(this._items).length;
        },

        forEach: function(callback){
            mjs.decorate(this._items).forEach(callback);
        },

        clear: function(){
            this._items = {};
        }

    }).implement($.Iterable);


})(mjs);