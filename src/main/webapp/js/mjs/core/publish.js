/**
 * Pub/sub frameworks.
 *
 * @author: Philip Ford
 */

(function($) {
    $.require("mjs/core/arrays");
    $.require("mjs/core/oop");


    Function.prototype.subscribe = function(publisher) {
        publisher.add(this);
        return this; // for chaining
    };


    Function.prototype.unsubscribe = function(publisher) {
        publisher.remove(this);
        return this;  // for chaining
    };

    var Publisher = $.Class({
        initialize: function(){
            this.clear();
        },
        publish: function() {
            var args = arguments;
            //$.log("publish").log(args);
            this._subscribers.forEach(function(fn) {
                fn.apply(null, args);
            });
            return this; // for chaining
        },
        getSubscribers: function(){
            return this._subscribers;
        },
        clear: function(){
            this._subscribers = [];
            return this;
        },
        add: function(subscriber){
            if (!this._subscribers.contains(subscriber)){
                this._subscribers.push(subscriber);
            }
        },
        remove: function(subscriber){
            this._subscribers = this._subscribers.filter(function(fn) {
                if (fn !== subscriber) {
                    return fn;
                }
            });
        }
    });




    //========================================= For subscribing/publishing through topics.
    var map = {};

    var topicObject = {
        get: function(key){
            return map[key];
        },
        subscribe: function(topicName, func) {
            if (arguments.length > 2) {
                func = $.proxy(arguments[1], arguments[2]);
            }
            if (!map[topicName]) map[topicName] = [];

            var exists = map[topicName].some(function(fn) {
                return (fn === func);
            });
            if (!exists) {
                map[topicName].push(func);
            }
            return this;  //For chaining
        },
        unsubscribe: function(topicName, func) {
            if (arguments.length > 2) {
                func = $.proxy(arguments[1], arguments[2]);
            }
            if (map[topicName]) {   // MFM to prevent error when undefined
                map[topicName] = map[topicName].filter(function(fn) {
                    if (fn !== func) {
                        return fn;
                    }
                });
            }
            return this;  // For chaining
        },
        unsubscribeAll: function(topicName) {
            map[topicName] = [];
        },
        publish: function(topicName, args) {
            if (map[topicName]) {   // MFM to prevent error when undefined
                if ($.isArray(map[topicName])) {
                    map[topicName].forEach(function(fn) {
                        fn(args);
                    })
                }
            }
            return this; //For chaining
        }
    };



    $.extend($, { Publisher: Publisher, topics: topicObject });

})(mjs);