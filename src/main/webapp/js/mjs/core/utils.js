/**
 *
 * @author Philip Ford
 */
(function ($) {
    $.require("mjs/core/arrays");

    var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); // chars to use.


    var utils = {
        /**
         * Generates a close facsimile of a GUID.
         *
         * @see http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
         * @return {*}
         * @constructor
         */
        GUID: function(){
            function S4() {
                return { quad: (((1+Math.random())*0x10000)|0).toString(16).substring(1) };
            }

            return "{quad}{quad}-{quad}-{quad}-{quad}-{quad}{quad}{quad}".applyTemplate(S4());
        },


        /**
         *
         * @see http://www.broofa.com/Tools/Math.uuid.js
         *
         * @return {String}
         * @constructor
         */
        UUID: function(){
            var uuid = new Array(36), rnd=0, r;
            for (var i = 0; i < 36; i++) {
                if (i==8 || i==13 ||  i==18 || i==23) {
                    uuid[i] = '-';
                } else if (i==14) {
                    uuid[i] = '4';
                } else {
                    if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
                    r = rnd & 0xf;
                    rnd = rnd >> 4;
                    uuid[i] = CHARS[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
            return uuid.join('');
        },


        getAlphabet: function(){
            return CHARS.slice(-26);
        },



        getCaller: function(callee){
            return callee && callee.caller ? callee.caller.name : "unnamed function";
        }
    };

    $.extend(utils);

})(mjs);