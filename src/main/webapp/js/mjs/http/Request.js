/**
 *
 * @author Philip Ford
 */
(function($) {
    $.require("mjs/core/oop");
    $.require("mjs/core/strings");
    $.require("mjs/core/publish");
    $.require("mjs/core/aop");

    var URL, Request;

    var spec = { url: "", method: ""};

    function getQueueName(queue, obj){
        var name = "on" + queue.capitalize();
        if (!obj[name]) return null;
        return name;
    }

    $.Request = $.Class({
        QUEUE_NOT_FOUND: "The queue does not exist.",
        initialize: function(config){
            var instance = this;
            this.config = $.augment(config, {
                onSuccess: function(response){
                    instance.state = response;
                    instance.onSuccess.publish(response);
                },
                onFailure: function(response){
                    instance.state = response;
                    instance.onFailure.publish(response);
                }
            });
            this.onSuccess = $.Publisher();
            this.onFailure = $.Publisher();
            this.state = {};
            Object.defineProperty(this, "QUEUE_NOT_FOUND", { writable: false });
        },
        addListener: function(queue, listener){
            queue = getQueueName(this, queue);
            if (!queue) throw new Error(this.QUEUE_NOT_FOUND);
            listener.subscribe(this[queue]);
        },
        removeListener: function(queue, listener){
            queue = getQueueName(this, queue);
            if (!queue) throw new Error(this.QUEUE_NOT_FOUND);
            listener.unsubscribe(this[queue]);
        },
        send: function(args){
            $.request($.extend({}, this.config, args));
        }
    });

})(mjs);