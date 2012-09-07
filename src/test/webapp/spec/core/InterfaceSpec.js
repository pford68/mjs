describe("interface", function(){

    var $ = mjs;

    $.require("mjs/core/oop");

    var List, Map, Observable, Iterable, MyClass, ObservableImpl, methods;

    beforeEach(function(){
        failCalls = [];
        List = $.Interface('add', 'remove', 'addAll');
        Map = $.Interface('put', 'putAll', 'remove');
        Observable = $.Interface('notify', 'changed', 'clearChanged');
        ObservableImpl = new $.Class({
            notify: function(){},
            changed: function(){},
            clearChanged: function(){}
        }).implement(Observable);
        MyClass = new $.Class({});
        methods = {
            notify: function(){},
            changed: function(){},
            clearChanged: function(){},
            add: function(){},
            addAll: function(){},
            put: function(){},
            putAll: function(){},
            remove: function(){}
        };
    });


    it("List should require add(), remove(), and addAll()", function(){
        expect(List.methods.add).toBeDefined();
        expect(List.methods.remove).toBeDefined();
        expect(List.methods.addAll).toBeDefined();
    });

    it("should be extensible, without affecting the original interface",function(){
        var MathList = List.extend("sum", "multiply", "divide");
        expect(MathList.methods.add).toBeDefined();
        expect(MathList.methods.remove).toBeDefined();
        expect(MathList.methods.addAll).toBeDefined();
        expect(MathList.methods.sum).toBeDefined();
        expect(MathList.methods.multiply).toBeDefined();
        expect(MathList.methods.divide).toBeDefined();
        expect(List.methods.divide).toBeUndefined();
    });

    it("should not be configurable once created",function(){
        "use strict"
        try {
            delete List.methods.add;
            delete List.methods;
            this.fail("We should not reach this point.");
        } catch(e){
            $.log("List interface:  the attempt to re-configure was caught.");
        }
        expect(List.methods).toBeDefined();
        expect(List.methods.add).toBeDefined();
    });


    describe("Object.implement()", function(){
        it("should throw an error immediately if the first argument does not have all of the required methods", function(){
            try {
                var c = new MyClass();
                Object.implement(c, List);
                this.fail("We should not have reached this point.");
            } catch(e){

            }
        });
    });

    describe("mjs.Class.implement()", function(){
        it("should throw an error immediately during initialization if the instance does not implement the required methods", function(){
            var MyNextClass = $.Class({
                toString: function(){ return List.methods.join(",") }
            }).implement(List);
            try {
                var c = new MyNextClass();
                this.fail("We should not have reach this point.");
            } catch(e){

            }
        });

         it("should NOT throw an error immediately during initialization if the instance implements the required methods", function(){
            var MyNextClass = $.Class(methods).implement(List);
            try {
                var c = new MyNextClass();
            } catch(e){
                this.fail("We should not have reach this point.");
            }
        });
    });
});