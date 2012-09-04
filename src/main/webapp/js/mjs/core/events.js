/**
 * Event API
 */
(function mEvents($) {

    $.require("mjs/core/utils");
    $.require("mjs/core/html");
    $.require("mjs/core/publish");
    $.require("mjs/core/oop");

    //============================================================= Private
    var $public, registry = {},
        regex = {
            on: /^on/
        };



    //=========================================================== Public
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
            var args, // If a config object was passed, it is assigned to args
                listener,               // The resulting listener object returned by addListener
                ls,                     // The src's list of listeners
                se,                     // The src event,
                usePublisher = false;   // Flag to indicate that we will use the $.Publisher API

            if (!evt){
                args = src;
                src = $.isString(args.src) ? document.getElementById(args.src) : args.src;
                evt = args.evt || args.event;
                cmd = args.execute || args.callback || function (e) {};
                scope = args.scope;
            }

            evt = evt.replace(regex.on, "");
            cmd = scope ? $.proxy(scope, cmd) : cmd;

            se = src[evt];

            /*
            Merging the pub-sub API with Events

            Note: I am NOT creating a new Publisher if the Publisher property does
            not exist.  In other words, the src must support the event by already having
            a declared publisher.
             */
            if (Object.isa(se, $.Publisher)){
                cmd.subscribe(se);
                usePublisher = true;
            }
            else {
                if (window.addEventListener) {
                    src.addEventListener(evt, cmd);
                } else if (window.attachEvent) {
                    evt = "on" + evt;
                    src.attachEvent(evt, cmd);
                } else {
                    evt = "on" + evt;
                    src[evt] = cmd;
                }
            }

            listener = (args instanceof $public.Listener) ? args : new $public.Listener(src, evt, cmd);
            if (!usePublisher){
                ls = src.listeners = src.listeners || {};
                ls[listener.id] = listener;
                registry[listener.id] = listener;
            }
            return listener;
        },


        /**
         *
         * @param {$.Listener} listener
         */
        removeListener: function(listener) {
            var src = listener.src,
                evt = src[listener.evt];

            /*
            Merging with the $.Publisher API.
            If the event is a Publisher, unsubsrcibe and return.
             */
            if (Object.isa(evt, $.Publisher)){
                listener.execute.unsubscribe(evt);
                 return;
            }

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
         * @param {HTMLElement} src
         */
        removeListeners: function(src) {
            if (!$.isElement(src)){
                throw new Error("[$.removeListeners] The src must be an HTMLElement.");
            }
            var i, ls = src.listeners;
            for (i in ls) {
                if (ls.hasOwnProperty(i)) $public.removeListener(ls[i]);
            }
        },


        /**
         *
         * @param src
         * @param type
         * @param content
         */
        dispatch: function(src, type, content){
            var se = src[type],  // The src event property
                event;

            if (Object.isa(se, $.Publisher)){
                se.publish(content);
                return;
            }

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
                if ($.isElement(src)) {
                    $.destroy(src);    // Calls Crockford's purge.
                }
                src = null;
                registry[i] = null;
            }
        }
        registry = null;
    });

    $.extend($public);

})(mjs);
