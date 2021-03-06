/**
 *
 * @author Philip Ford
 */
(function($) {
    $.require("mjs/core/strings");

    var utils = {

        jsVersion: function(){
            var versions = $.range(1.0, 3.0, 0.1),
                i = versions.length, result, last, panel,
                id = new Date().getTime();

            document.write('<div id="' + id + '"></div>');
            panel = document.getElementById(id);

            function execute(item){
                panel.innerHTML += '<script language="' + item + '">version = ' + item + '</script>';
                if (last == item) throw new Error();
                last = item;
            }

            try {
                if (Array.prototype.forEach){
                    versions.forEach(execute);
                } else {
                    versions.reverse();
                    while(i--){
                        execute(versions[i]);
                    }
                }
            } catch(e){
                // Do nothing
            } finally {
                result = version;
                version = null;
                document.body.removeChild(panel);
            }
            return result;
        }
    }
})(mjs);