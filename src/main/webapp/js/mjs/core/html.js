/**
 * If you are plugging into JQuery, this file is unnecessary, and you would not
 * include it in your lists of dependencies. For other frameworks, it may or may
 * not be necessary.  It would be useful when mjs is used as a standalone framework.
 *
 * @author Philip Ford
 */
(function($) {

    // From Crockford: http://javascript.crockford.com/memory/leak.html
    function purge(d){
        var a = d.attributes, i, l, n;
        if (a) {
            for (i = a.length - 1; i >= 0; i -= 1) {
                n = a[i].name;
                if (typeof d[n] === 'function') {
                    d[n] = null;
                }
            }
        }
        a = d.childNodes;
        if (a) {
            l = a.length;
            for (i = 0; i < l; i += 1) {
                purge(d.childNodes[i]);
            }
        }
    }

    var $public = {
        /**
         * Takes an HTML string and converts it to an HTML node.
         * @param {String} htmlString The html string to convert to an HTML node.
         * @returns {Node} An HTML node matching the HTML specified in the HTML string.
         */
        toNode: function(htmlString) {
            var node = document.createElement('DIV'), child;
            node.innerHTML = htmlString;
            child = node.firstChild;
            node = null;
            return child;
        },

        /**
         * Destroys the node and destroys all listeners attached to it or to its children.
         *
         * @param node
         */
        destroy: function(node) {
            purge(node);
            $public.remove(node);
            node.innerHTML = "";
            node = null;
        },

        /**
         * Removed the node from the DOM but <strong>does not destroy it</strong>, so listeners
         * are still attached.
         *
         * @param node
         */
        remove: function(node) {
            document.body.removeChild(node);
        },

        /**
         * Inserts a new node after an existing node in the DOM.
         *
         * @param node The existing node after which the new node be inserted
         * @param newNode The node to insert
         */
        insertAfter: function(node, newNode){
            node.parentNode.insertBefore(newNode, node.nextSibling);
        }
    };

    $.extend($public);
})(mjs);