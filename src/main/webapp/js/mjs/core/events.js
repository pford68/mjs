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
    /*
    Notes:
    (1) I have considered adding a Delegate constructor/function, but in retrospect,
        $.Publisher already is one.  For example:

        var clickDelegate = new $.Publisher();
        someFunction.subscribe(clickDelegate);
        ... // Adding more subscribers
        $.addListener(document.body, "click", "publish", clickDelegate);
     */
    $public = {

        Event: (function(){
            function NormalizedEvent(){

            }
            NormalizedEvent.prototype = new Event();
            $.augment(NormalizedEvent.prototype, {

            });
            return NormalizedEvent;
        })(),


        /**
         *
         */
        Listener: (function () {
            /*
            Notes:
            (1) Holding a reference to the source (in this.src) is dangerous memory-wise, but merely holding the
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
         * Adds an event listener to an HTMLElement, an Object, or a function.  In the case of Objects or
         * Functions, say, that an Object (that) has a dataLoaded property, with a $.Publisher assigned to it,
         * then you can add a listener with $.addListener(that, "dataLoaded", function(e){..}).
         *
         * @param {Object|HTMLElement|Function|mjs.Listener} src The source of the event
         * @param {String} evt The event type:  e.g., "click"
         * @param {Function|String} cmd The function to execute when the event occurs
         * @param {Object} [scope] The object scope of cmd.
         * @return {mjs.Listener} An mjs.Listener object.
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
            declared the property and having assigned a publisher assigned to it.
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
         * Un-registers an event handler with its source and removes the listener from the internal
         * listener registry.
         *
         * @param {mjs.Listener} listener The listener to remove.
         */
        removeListener: function(listener) {
            var src = listener.src,
                evt = src[listener.evt];

            /*
            Merging with the $.Publisher API.
            If the event is a Publisher, un-subscribe and return.
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
        },


        Delegate: (function(){
            function Delegate(src, evt){
                this.src = src;
                this.evt = evt;
                this.listener = new $.Publisher();
                $public.addListener(src, evt, "publish", this.listener);
            }
            $.extend(Delegate.prototype, {
                add: function(key, cmd, scope){
                    cmd = scope ? $.proxy(scope, cmd) : cmd;
                    this.listener.add(function(){
                        if (e.target.id === key) cmd.apply(null, arguments);
                    });
                },
                dispatch: function(e){
                    this.listener.publish(e.data);
                }
            });
            return Delegate;
        })()
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
