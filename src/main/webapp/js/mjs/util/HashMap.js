/**
 *
 * @author Philip Ford
 */
(function($) {

    $.require("mjs/core/oop");
    $.require("mjs/core/interfaces");


    $.util.HashMap = $.Class({

        _items: null,

        initialize: function(list){
            if (Array.isArray(list)) {
                this.putAll(list);
            }
        },

        put: function(key, value){
            this.items[Object.hash(key)] = value;
        },

        putAll: function(list){
            list.forEach(function(item){

            })
        },

        get: function(key){
            return this.items[Object.hash(key)];
        },

        keys: function(){
            return Object.keys(this.items);
        },

        values: function(){
            return Object.values(this.items);
        },

        size: function(){
            return this.keys.length;
        },

        forEach: function(callback){
            mjs.decorate(this.items).forEach(callback);
        }

    }).implement($.Iterable);


})(mjs);