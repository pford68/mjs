/**
 *
 * @author Philip Ford
 */
(function($) {
    $.require("mjs/core/oop");
    $.require("mjs/core/strings");
    $.require("mjs/core/publish");
    $.require("mjs/core/aop");

    var $config = $.config || { ajax: null };

    $.http.RequestBuilder = $.Class({
        QUEUE_NOT_FOUND: "The queue does not exist.",
        _resource: null,
        attributes: null,
        state: null,
        adapter: null,
        initialize: function(resource){
            if (!resource.url) throw new Error("The resource must have a url property.");
            this._resource = resource;
            this.attributes = {
                method: resource.method || 'POST',
                url: resource.url
            };
            this.onSuccess = new $.Publisher();
            this.onFailure = new $.Publisher();
            this.adapter = this.adapter || ($config.ajax ? $config.ajax.adapter : null);
        },
        buildUrl: function(values){
            this.attributes.url = this._resource.url.applyTemplate(values);
            return this;
        },
        addListener: function(queue, listener){
            queue = this["on" + queue.capitalize()];
            if (!queue) throw new Error(this.QUEUE_NOT_FOUND);
            listener.subscribe(this[queue]);
            return this;
        },
        removeListener: function(queue, listener){
            queue = this["on" + queue.capitalize()];
            if (!queue) throw new Error(this.QUEUE_NOT_FOUND);
            listener.unsubscribe(this[queue]);
            return this;
        },
        build: function(args){
            $.extend(this.attributes, args);
            return this;
        },
        send: function(){
            $.request($.override(this, this.attributes));
            return this;
        },
        success: function(response){
            this.state = response;
            this.success.publish(response);
            return this;
        },
        failure: function(response){
            this.state = response;
            this.failure.publish(response);
            return this;
        },
        addAdapter: function(adapter){
            this.adapter = adapter;
        },
        adapt: function(){
            if (this.adapter) this.adapter(this);
            return this;
        },
        enqueue: function(evt, callback){
            var channel = "on" + evt.capitalize();
            if (this[channel]){
                var f = this[channel];
                this[channel] = function(response){
                    f(response);
                    callback(response);
                }
            }
            return this;
        }
    });

    //================================================== Constants
    $.constant("SUCCESS", "success", $.http);
    $.constant("FAILURE", "failure", $.http);

})(mjs);