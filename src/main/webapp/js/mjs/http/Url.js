/**
 *
 * @author Philip Ford
 */

(function($) {

    $.require("mjs/core/strings");
    $.require("mjs/core/arrays");

    var $re,
        $config = $.config,
        defaults = {
            format: "{protocol}://{hostname}:{port}/{context}/{pathinfo}/{file}{search}"
        };

    $re = {
        queryStringStart: /^\?/,
        beforeQueryString: /^.+\?/,
        portFormat: /:\{port\}/,
        slashes: /\//g,
        doubleSlashes: /\/{2,}/g,
        protocolClose: /:\//,
        fullProtocolClose: /:\/\//,
        extension: /\.[a-zA-Z]{2,6}$/
    };

    function stripDblSlashes(url){
        return url.replace($re.doubleSlashes, "/").replace($re.protocolClose, "://");
    }

    /*
    Unlike Url.getItems(), this replaces null values with empty strings.
     */
    function getItems(that){
        return {
            protocol:       that.protocol || "",
            hostname:       that.hostname || "",
            port:           that.port || "",
            file:           that.file || "",
            context:        that.context || "",
            pathinfo:       that.pathinfo || "",
            search:         that.search || "",
            query:          that.query || ""
        }
    }


    /**
     * <p>Parses a url into an object with the following properties:
     *     <ul>
     *          <li>protocol:  does <b>not</b> end with a colon</li>
     *          <li>hostname</li>
     *          <li>port:  defaults to 80</li>
     *          <li>file:  either the file name (plus extension) in the url, or null if no file name exists</li>
     *          <li>context:  the URL sections immediately following the host (and port), or null if no such section exists</li>
     *          <li>pathinfo:  the sections of the path between the context and the file.  If no such sections exist, <b> it is an empty string.</b></li>
     *          <li>query:  the query string, if any, or null</li>
     *          <li>search:  either "?" + the querystring (like location.search) or an <b>empty string</b></li>
     *     </ul>
     * </p>
     * @param s
     */
    function Url(s){
        if (!s) return;

        // While this implementation seemingly has a few more steps than using a regular expression,
        // fixing the regular expression result to get the port number, if any, as well as the "context"
        // (as I call it here) ended up having as many steps.  Thus, for now, this implementation seems simpler.
        // However, I have not considered the relative performances yet.
        var qs, parts, host, protocol, pathinfo;
        s = stripDblSlashes(s);
        parts = s.split("?");
        qs = parts.length > 1 ? parts[1] : null;
        parts = parts[0].split("/");
        if (s.contains("://")){
            protocol = parts[0];
            parts.shift();
            if (parts[0].trim() == "") parts.shift();
        }
        host = parts[0].split(":").toEach({ name: "", port: ""});
        parts.shift();
        $.extend(this, {
            protocol:       protocol.replace(":",""),
            hostname:       host.name,
            port:           $.notEmpty(host.port) ? $.parseInt(host.port) : null,
            file:           $re.extension.test(parts[parts.length - 1]) ? parts.pop() : null,
            context:        $.notEmpty(parts[0]) ? parts[0] : null,
            pathinfo:       (pathinfo = parts.slice(1).join("/")).notEmpty() ? pathinfo : null,
            search:         qs ? "?" + qs : null,
            query:          qs,
            current:        s
        });
    }

    Object.defineProperties(Url.prototype, {
        protocol:       { enumerable: true, writable: true, configurable: false },
        hostname:       { enumerable: true, writable: true, configurable: false },
        port:           { enumerable: true, writable: true, configurable: false },
        file:           { enumerable: true, writable: true, configurable: false },
        context:        { enumerable: true, writable: true, configurable: false },
        pathinfo:       { enumerable: true, writable: true, configurable: false },
        search:         { enumerable: true, writable: true, configurable: false },
        query:          { enumerable: true, writable: true, configurable: false },
        current:        { enumerable: true, writable: true, configurable: false }
    });

    // TODO:  add with defineProperties()
    $.extend(Url.prototype, {
        /**
         * Returns the entire internal URL before the "context":  the protocol, hostname, and port, if any:
         * e.g., http://www.mydomain.com/.  The returned domain includes the trailing forward slash.  This
         * useful with postMessage():
         *
         * e.g., parent.postMessage("Hello!", new Url(window.location.href).getDomain()).
         *
         * @param options
         * @return {*}
         */
        getDomain: function(options){
            return [this.protocol, "://", this.hostname, ( this.port ? ":" + this.port : ""),"/"].join("");
        },


        /**
         * Builds a new url by replacing elements of the internal url with properties from the specified object.
         *
         * @param options
         * @return {*}
         */
        build: function(options){
            var location, href, format;
            options = options || {};
            format = options.format || (defaults.format + '');
            location = $.override(getItems(this), options);
            location.file = location.file ? location.file.replace(/^\/+/, "") : "";
            if (!location.port){
                format = format.replace($re.portFormat, "");
            }
            $.log("location").log(location);
            return stripDblSlashes(format.applyTemplate(location));
        },


        /**
         *
         * @param url
         * @param options
         */
        redirect: function(url, options){
            options = options || {};
            (options.scope || window).location = stripDblSlashes(url);
        },

        /**
         *
         */
        exit: function(){
            window.location = $.build({ file: $config.home || '' });
        },

        /**
         * Parses the query string of the internal url into an object containing the key/value pairs.
         *
         * @return {*} An object containing the key/value pairs.
         */
        parseQuery: function(){
            return Url.parseQuery(this);
        },

        /**
         * Returns the elements of the internal url as key/value pairs.
         *
         * @return {Object}
         */
        getItems: function(){
            return {
                protocol:       this.protocol,
                hostname:       this.hostname,
                port:           this.port,
                file:           this.file,
                context:        this.context,
                pathinfo:       this.pathinfo,
                search:         this.search,
                query:          this.query
            }
        }
    });

    $.extend(Url, {
        /**
         * Returns the query string of the specified url.
         *
         * @return {*} An object containing the key/value pairs.
         */

        getQuery: function(url) {
            return url ? url.replace($re.beforeQueryString, "") : null;
        },

        /**
         * Parses the query string of the specified url into an object containing the key/value pairs.
         *
         * @return {*} An object containing the key/value pairs.
         */
        parseQuery: function(url) {
            // TODO:  decode url
            var result = {}, pair,
                parts = (url.query || Url.getQuery(url) || "").split("&");
            parts.forEach(function (item) {
                pair = item.split("=");
                result[pair[0].trim()] = pair[1].trim();
            });
            return result;
        },
        /**
         * Returns the domain for the current page.  Shorter and lighter than Url.prototype.getDomain()
         * for use with postMessage().
         */
        getDomain: function(){
            var loc = window.location;
            return [loc.protocol, "://", loc.hostname, ( loc.port ? ":" + loc.port : ""),"/"].join("");
        }
    });


    $.extend($.http, { Url : Url });

})(mjs);