/**
 *
 * @author Philip Ford
 */
(function ($) {
    $.require("mjs/core/oop");
    $.require("mjs/http/ajax");

    var $config = $.config || { ajax: null };


    //================================================== Public
    $.http.Resource = $.Class({
        adapter: null,
        _config: null,
        _lastRequest: null,
        initialize: function(that){
            if (!that.url) {
                throw new Error("The first argument must have a \"url\" property.");
            }
            this._config = that;
            this.adapter = this.adapter || ($config.ajax ? $config.ajax.adapter : null);
        },
        onSuccess: function(response){},
        onFailure: function(response){},
        evaluate: function(values){
            this._lastRequest = this._config.url.applyTemplate(values);
            return this;
        },
        getUrl: function(values){
            return $.extend({}, this._config.url.applyTemplate(values));
        },
        addAdapter: function(adapter){
            this.adapter = adapter;
        },
        adapt: function(){
            if (this.adapter) this.adapter(this);
            return this;
        },
        build: function(props){
            return $.extend({}, this._config, props || {}, ( this._lastRequest ? { url: this._lastRequest } : {}));
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
        },
        send: function(){
            $.request(this);
        }
    });



    //================================================== Constants
    $.constant("SUCCESS", "success", $.http);
    $.constant("FAILURE", "failure", $.http);
})(mjs);