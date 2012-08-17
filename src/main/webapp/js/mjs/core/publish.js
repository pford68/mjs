/**
 * Pub/sub frameworks.
 *
 * @author: Philip Ford
 */

(function($) {
    $.require("mjs/core/arrays");
    $.require("mjs/core/oop");

    var Publisher, topicObject = {};


    Function.prototype.subscribe = function(publisher) {
        if (Object.isa(publisher, $.Publisher)) {
            var instance = this, exists;
            exists = publisher.subscribers.some(function(fn) {
                return (fn === instance);
            });
            if (!exists) {
                publisher.subscribers.push(this);
            }
        }
        return this; // for chaining
    };


    Function.prototype.unsubscribe = function(publisher) {
        if (Object.isa(publisher, $.Publisher)) {
            var instance = this;
            publisher.subscribers = publisher.subscribers.filter(function(fn) {
                if (fn !== instance) {
                    return fn;
                }
            });
        }
        return this;  // for chaining
    };


    Publisher = $.Class({
        subscribers: null,
        initialize: function() {
            this.subscribers = [];
        },
        publish: function() {
            var args = arguments;
            //$.log("publish").log(args);
            this.subscribers.forEach(function(fn) {
                fn.apply(null, args);
            });
            return this; // for chaining
        }
    });

    //========================================= For subscribing/publishing through topics.
    var map = {};

    topicObject = {
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