/**
 * Provides a way to create a unique ID. This could have uses for DOM objects or even JS objects.
 * Based on Math.uuid.js: http://www.broofa.com/Tools/Math.uuid.js
 *
 * @author Philip Ford
 */
(function($) {

    var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); // chars to use.

    $.UUID = function(){
        var len = 36, uuid = new Array(len), rnd=0, r;
        for (var i = 0; i < len; i++) {
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
    };


})(mjs);