/**
 * To enable using an IFrame for requests:
 * (1) Simply include this script.
 * (2) Add "args.xss: true" to the map of arguments sent to request().
 */

(function($){
    $.require("mjs/core/aop");
    $.require("mjs/http/ajax");
    $.require("mjs/http/Url");
    $.require("mjs/core/events");


    var xssFrame;

    function createIFrame(src) {
        src = new $.http.Url(window.location.href).build({ file: src });
        var $node = $.toNode('<iframe id="xss-frame" name="xss-frame" src="' +
            src + '" data-defaultSrc="' +
            src + '" height="1" width="1" style="visibility: hidden"></iframe>');
        document.body.appendChild($node);
        return $node[0];
    }

    function useIFrame(invocation){
        $.log("useIFrame").log(invocation);
        var args = invocation.args[0];

        if (args.xss === true) {
            if (!xssFrame) {
                xssFrame = createIFrame(args.url);
            }
            args.params = args.params || {};
            args.context = xssFrame;
            if (args.onComplete) {
                var c = function(e) {
                    args.onComplete(JSON.parse(e.data), e);
                    xssFrame.src = xssFrame.getAttribute("data-defaultSrc");
                };
                // TODO:  as it stands, all message listeners will be notified by every postMessage call.
                // And I don't believe that we want that.  We could fix this by removing the listener at
                // the end of function c above.  The origin could be used, but what if messages intended for
                // different listeners all come from the same origin?  The message event's source, which is
                // a Window object, may have url information that listeners can use to decide whether to accept
                // a posted message--thus, subscribe to a topic, in a sense.
                $.addListener({
                    src: window,
                    evt: "message",
                    execute: c
                });
            }
        } else {
            invocation.proceed();
        }
    }

    $.addAdvice(useIFrame).around($, "request");
})(mjs);
