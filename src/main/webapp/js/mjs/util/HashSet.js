
(function($){

    $.require("mjs/core/oop");
    $.require("mjs/core/ObjectDecorator");

    $.util.HashSet = $.Class({

        _items: null,

        initialize: function(){
            this._items = mjs.decorate({});
        },
        add: function(that){
            this._items.add(Object.hash(that), that);
            return this;
        },
        remove: function(that){
            return this._items.remove(that);
        },
        clear: function(){
            this._items.component = {};
        },
        forEach: function(callback){
            this._items.forEach(callback);
            return this;
        },
        contains: function(that){
            return this._items.contains(that);
        }
    });

})(mjs);
