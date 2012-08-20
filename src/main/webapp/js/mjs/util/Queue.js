/**
 *
 * @author Philip Ford
 */
(function ($) {

    $.require("mjs/core/oop");

    $.util.Queue = $.Class({
        _items: null,
        initialize: function(){
            this._items = [];
        },
        enqueue: function(that){
            this._items.push(that);
            return this;
        },
        dequeue: function(){
            return this._items.shift();
        },
        clear: function(){
            this._items = [];
        },
        size: function(){
            return this._items.length;
        },
        peek: function(){
            return this._items[0];
        }
    })
})(mjs);