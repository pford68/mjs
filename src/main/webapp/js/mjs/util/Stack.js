/**
 *
 * @author Philip Ford
 */
(function ($) {

    $.require("mjs/core/oop");
    $.require("mjs/core/arrays");
    $.require("mjs/core/interfaces");

    $.util.Stack = $.Class({
        _items: null,
        initialize: function(){
            this._items = [];
        },
        push: function(that){
            this._items.push(that);
            return this;
        },
        pop: function(){
            return this._items.pop();
        },
        clear: function(){
            this._items = [];
        },
        size: function(){
            return this._items.length;
        },
        peek: function(){
            var items = this._items;
            return items[items.length - 1];
        },
        forEach: function(callback){
            this._items.forEach(callback);
            return this;
        }
    }).implement($.Iterable);
})(mjs);