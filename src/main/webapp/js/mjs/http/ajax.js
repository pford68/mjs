/**
 *
 * @author Philip Ford
 */

(function($) {

    $.require("mjs/core/publish");

    var $config = $.config || {},
        $ajax = $config.ajax,
        $http,
        $public;

    function getFunction(f) {
        return f || function() {}
    }

    // Continuing to support automatic dialog feedback.
    $.showDialog = $.showDialog || function(args){ if (args && args.msg) alert(args.msg) };

    // Default AJAX implementation, if none is provided.
    $http = {
        __request__: null,   // The XMLHTTPRequest object
        queue: [],

        next: function(args) {
            $.log("next");
            $http.queue.shift();  // Remove the current request.
            if ($http.queue.length > 0) {
                $http.queue[0](args);   // Execute the next request, if any.
            }
        },

        init: function() {
            if (window.XMLHttpRequest) {
                $http.__request__ = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                try {
                    $http.__request__ = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        $http.__request__ = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (e) {
                    }
                }
            }

            if (!$http.__request__) {
                $public.error('ajax.js', 'Cannot create an XMLHTTP instance');
                return false;
            }
        },


        request: function(args) {
            var requestHandler, req = $http.__request__, async = (args.async != null ? args.async : true);

            requestHandler = function() {
                $.log("Using internal AJAX");
                var response;
                if (req.readyState == 4) {
                    if (!args.contentType || args.contentType == 'text/json'){
                        response = JSON.parse(req.responseText);
                    } else {
                        response = req.responseText;
                    }
                    if ((req.status == 200 || (req.status == 302 && req.allowRedirects !== false)) && args.success) {

                        args.success(response);
                    }
                    else if (!args.suppress && args.failure) {
                        args.failure(response);
                    }
                }
            };

            req.onreadystatechange = requestHandler;
            req.open(args.method, args.url, async);
            req.send(args.params || JSON.stringify(args.data));
            if (!async) requestHandler();
        }
    };



    $public = {
        /**
         * A wrapper for the request method of whatever AJAX library that we use.  The default HTTP method is POST.
         * The expected arguments:
         * <ul>
         *    <li>url</li>
         *    <li>method</li>
         *    <li>params</li>
         *    <li>data</li>
         *    <li>success</li>
         *    <li>failure</li>
         *    <li>queue</li>
         *    <li>contentType</li>
         *    <li>headers</li>
         *    <li>assertion</li>
         * </ul>
         *
         * Supported HTTP methods include "GET", "POST", "PUT", "DELETE," and "JSONP."
         *
         * @param args
         *
         */
        request: function(args) {
            if (!args.url) {
                $.error("$.request", "A url is required.");
            }

            if (!$.ajax)  {
                $http.init();
                $.ajax = $http.request;
            }

            // Wrap the success handler in common feedback handling
            if (args.success) {
                var f = args.success;
                args.success = function(response) {
                    if (!args.contentType || args.contentType == 'text/json') {
                        if (response && response.responseText) response = Ext.decode(response.responseText);
                    }
                    f(response);
                }
            }
            // Validation
            var assertion = args.assertion;
            if ($.isFunction(assertion) && !assertion()) {
                if ($.isFunction(assertion.onError)) {
                    assertion.onError();
                }
                return;
            }

            if (!args.failure){
                args.failure = function(response){
                    $.log("request failed").log(response).log("arguments").log(args);
                }
            }

            $.augment(args, {
                method: 'POST',
                headers: {
                    "Content-Type": 'application/json',
                    accept: 'application/json'
                }
            });

            if (args.queue) {
                var $success = getFunction(args.success),
                    $failure = getFunction(args.failure);
                args.success = function(response) {
                    $success(response);
                    $http.next(args);
                };
                args.failure = function(response) {
                    $failure(response);
                    $http.next(args);
                };
                $http.queue.push(function() {
                    $.ajax(args)
                });
                // Why queue.length == 1 instead of queue.length > 0? We have to start the queue,
                // but we don't want to call first item every time $.request() is called with queue == true.
                if ($http.queue.length == 1) {
                    $http.queue[0]();
                }
            } else {
                $.ajax(args);
            }
        },


        createForm: function(args) {
            var node, params, field, $doc;
            $doc = args.context ? args.context.contentWindow.document : window.document;
            node = $doc.createElement("form");
            node.action = args.url;
            node.method = args.method || 'POST';
            params = args.params;
            for (var i in params) {
                field = $doc.createElement("input");
                field.type = "hidden";
                field.name = i;
                field.value = params[i];
                node.appendChild(field);
            }
            $doc.getElementsByTagName("body")[0].appendChild(node);
            return node;
        }
    };

    $public.request.getProperties = function(){
        return {
            url: null,
            method: 'POST',
            xss: false,
            assertion: null,
            success: null,
            failure: null,
            contentType: "text/json",
            headers: {
                "Content-Type": 'application/json',
                accept: 'application/json'
            },
            data: null,
            params: null
        }
    };

    $.extend($public);
})(mjs);