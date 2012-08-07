/**
 *
 */

(function($) {
    $.require("mjs/core/strings");
    $.require("mjs/core/StringBuilder");
    $.require("mjs/core/aop");
    $.require("mjs/core/events");
    $.require("mjs/core/oop");
    $.require("mjs/core/interfaces");

    var tests = [], currentTest = null;

    function get(id){
        return document.getElementById(id);
    }

    $.testing = {
        runner: 'mjs-test-runner',
        statusId: 'mjs-test-status',

        runCount: function(){
            return parseInt($.get('mjs-test-runCount').value);
        },

        timer:  function(invocation) {
            var end, start,
                statusNode = get($.testing.statusId),
                resultNode = get(currentTest.id);
            if (statusNode) statusNode.innerHTML = "Running...";
            start = new Date().getTime();
            invocation.proceed();
            end = new Date().getTime() - start;
            if (resultNode) resultNode.innerHTML = end / 1000;
            if (statusNode) statusNode.innerHTML = "Complete";
        },

        add: function(test) {
            tests.push(test);
        },

        time: function(test) {
            Object.implement(test, $.Command);
            $.addAdvice($.testing, "timer").around(test, "execute");
            tests.push(test);
        },

        run: function() {
            for (var i = 0; i < tests.length; ++i) {
                currentTest = tests[i];
                currentTest.execute();
            }
            currentTest = null;
        }
    };

    $.addListener(window, "load", function() {
        var buffer = new $.StringBuilder();
        buffer.append('<div class="').append($.testing.runner).append('">')
                .append(' <div class="mjs-test-form"><label>Runs: <input type="text" id="mjs-test-runCount" value="100"/></label><button id="btnRunTest">Run</button></div>')
                .append('<div class="')
                .append($.testing.statusId)
                .append('">Status: <span id="').append($.testing.statusId).append('"></span></div>')
                .append('<table>')
                .append('<thead><tr><th>Status</th><th>Seconds</th></tr></thead>')
                .append('<tbody>');
        for (var i = 0; i < tests.length; ++i) {
            buffer.append('<tr><td>')
                    .append(tests[i].id.capitalize())
                    .append('</td><td id="').append(tests[i].id).append('"></td></tr>')
        }
        buffer.append('</tbody></table></div>');
        document.body.innerHTML += buffer.toString();

        $.addListener("btnRunTest", "click", $.testing.run);
    });

})(mjs);