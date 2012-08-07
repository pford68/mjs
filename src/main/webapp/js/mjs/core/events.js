/**
 * Event API
 */
(function mEvents($) {

    $.require("mjs/core/utils");
    $.require("mjs/core/html");

    var $public, registry = {};


    $public = {

        /**
         *
         */
        Listener:(function () {
            /*
            Notes:
            - Holding a reference to the source (in this.src) is dangerous memory-wise, but merely holding the
              ID is too since it can be deleted.
             */
            function Listener(src, evt, func, scope) {
                this.id = $.UUID();
                this.src = src;    //Holding a reference to the source DOM element is dangerous memory-wise,
                                   //but merely holding the ID is too since it can be deleted.
                this.evt = evt;
                this.execute = func;
                this.scope = scope;
            }

            return Listener;
        })(),


        /**
         *
         * @param args
         */
        addListener:function (args) {
            //args = $.isObject(args, true) ? args : $.fromArguments(arguments, { 0: "src", 1: "evt", 2: "callback", 3: "scope"});
            var src = $.isString(args.src) ? document.getElementById(args.src) : args.src,
                evt = args.evt || args.event,
                func = args.execute || args.callback || function (e) {
                },
                scope = args.scope,
                listener, ls;

            evt = evt.replace(regex.on, "");
            func = scope ? $.proxy(scope, func) : func;

            if (window.addEventListener) {
                src.addEventListener(evt, func);
            } else if (window.attachEvent) {
                evt = "on" + evt;
                src.attachEvent(evt, func);
            } else {
                evt = "on" + evt;
                src[evt] = func;
            }
            listener = (args instanceof $public.Listener) ? args : new $public.Listener(src, evt, func);
            ls = src.listeners = src.listeners || {};
            ls[listener.id] = listener;
            registry[listener.id] = listener;
            return listener;
        },

        /**
         *
         * @param listener
         */
        removeListener:function (listener) {
            var src = listener.src;
            delete src.listeners[listener.id];
            delete registry[listener.id];
            if (window.removeEventListener) {
                src.removeEventListener(listener.evt, listener.execute);
            } else if (window.attachEvent) {
                listener = src.detachEvent(listener.evt, listener.execute)
            } else {
                listener = src[listener.evt] = null;     // TODO
            }
        },

        /**
         *
         * @param src
         */
        removeListeners:function (src) {
            var i, ls = src.listeners;
            for (i in ls) {
                if (ls.hasOwnProperty(i)) $public.removeListener(ls[i]);
            }
        },


        addDelegate: function(args){

        }
    };

    $public.addListener({ src: window, evt: "unload", execute: function(e){
        var i, src;
        for (i in registry){
            if (registry.hasOwnProperty(i)){
                src = registry[i].src;
                if ($.isNode(src)) $.destroy(src);
                src = null;
                registry[i] = null;
            }
        }
        registry = null;
    }});

    $.extend($public);

})(mjs);
