/**
 *
 * @author Philip Ford
 */

(function($) {

    $.Exception = (function(){
        function Exception(msg, fileName, lineNumber){
            this.fileName = fileName;
            this.lineNumber = lineNumber;
            this.message = msg;
        }
        Exception.prototype = new Error();
        $.extend(Exception.prototype, {
            name: "Exception"
        });
        return Exception;
    })();

    $.IllegalArgumentException = (function(){
        function IllegalArgumentException(msg, fileName, lineNumber){
            this.fileName = fileName;
            this.lineNumber = lineNumber;
            this.message = msg;
        }
        IllegalArgumentException.prototype = new $.Exception();
        $.extend(IllegalArgumentException.prototype, {
            name: "IllegalArgumentException"
        });
        return IllegalArgumentException;
    })();


    $.SyntaxError = (function(){
        function SyntaxError(msg, fileName, lineNumber){
            this.fileName = fileName;
            this.lineNumber = lineNumber;
            this.message = msg;
        }
        SyntaxError.prototype = new $.Exception();
        $.extend(SyntaxError.prototype, {
            name: "SyntaxError"
        });
        return SyntaxError;
    })();

})(mjs);