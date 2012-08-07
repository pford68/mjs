/**
 * Assigns jQuery to mjs namespace, making the mjs library a jQuery plugin.  Instead, mjs and jQuery
 * can be used side-by-side.
 */
(function($){

   mjs = $;
   // If jQuery and mjs contain functions of the same name, override lists mjs functions that take precedence,
   // Otherwise, the jQuery function will take precedence.
   mjs.config = $.extend(mjs.config, {
       override: { "require": true }
   })

})(jQuery);
