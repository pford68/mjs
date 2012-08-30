/**
 * Event API
 */
(function mEvents($) {

    $.require("mjs/core/utils");
    $.require("mjs/core/html");

    var $public, registry = {},
        regex = {
            on: /^on/
        };


    $public = {

        /**
         *
         */
        Listener: (function () {
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
         * @param src
         * @param evt
         * @param cmd
         * @param scope
         * @return {*}
         */
        addListener: function(src, evt, cmd, scope) {
            var args, listener, ls;
            if (!evt){
                args = src;
                src = $.isString(args.src) ? document.getElementById(args.src) : args.src;
                evt = args.evt || args.event;
                cmd = args.execute || args.callback || function (e) {};
                scope = args.scope;
            }

            evt = evt.replace(regex.on, "");
            cmd = scope ? $.proxy(scope, cmd) : cmd;

            if (window.addEventListener) {
                src.addEventListener(evt, cmd);
            } else if (window.attachEvent) {
                evt = "on" + evt;
                src.attachEvent(evt, cmd);
            } else {
                evt = "on" + evt;
                src[evt] = cmd;
            }
            listener = (args instanceof $public.Listener) ? args : new $public.Listener(src, evt, cmd);
            ls = src.listeners = src.listeners || {};
            ls[listener.id] = listener;
            registry[listener.id] = listener;
            return listener;
        },

        /**
         *
         * @param listener
         */
        removeListener: function(listener) {
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
        removeListeners: function(src) {
            var i, ls = src.listeners;
            for (i in ls) {
                if (ls.hasOwnProperty(i)) $public.removeListener(ls[i]);
            }
        },


        dispatch: function(src, type){
            var event;
            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent(type, true, true);
            } else {
                event = document.createEventObject();
                event.eventType = type;
            }

            //event.eventName = eventName;
            //event.memo = memo || { };

            if (document.createEvent) {
                src.dispatchEvent(event);
            } else {
                src.fireEvent("on" + event.eventType, event);
            }
        }
    };

    $public.addListener(window, "unload", function(e){
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
    });

    $.extend($public);

})(mjs);
