/**
 *
 * @author Philip Ford
 */
(function($) {
    var m_console;

    if (window.console) m_console = window.console;
    else window.console = {};

    $.testing.MockConsole = {
        start: function(){
            window.console = {
                content:[],
                mock: true,
                log: function(msg){
                    this.content.push(msg)
                }
            };
        },
        stop: function(){
            if (m_console) {
                window.console = m_console;
                console.log("console reset");
            }
        }
    };

})(mjs);