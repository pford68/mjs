
describe("Object Namespace functions", function(){
    var $ = mjs;

    describe("Functions from mjs/core/oop.js", function(){

        $.require("mjs/core/oop");

        var that = {
            id: 1239,
            age: 24,
            city: 'Dallas',
            state: 'Texas',
            ssn: '555-55-0001',
            firstName: 'John',
            lastName: 'Smith',
            hash: function(){
                return (this.age + this.id) * 13;
            }
        };

        var Observable = $.Interface('hasChanged', 'notify', 'addObserver', 'clearObservers');
        var Observer = $.Interface('update');

        describe("Object.hash()", function(){
            it("if the input is a String, should simply return the input", function(){
                expect("ssn").toEqual(Object.hash("ssn"));
            });

            it("if the input implements hash(), should return the result of the hash() method", function(){
                expect(16419).toEqual(Object.hash(that));
            });
        });

        describe("Object.implement()", function(){
            var that;

            beforeEach(function(){
                that = {
                    changed: false,
                    observers: [],
                    hasChanged: function(){ return this.changed; },
                    notify: function(args){
                        this.observers.forEach(function(observer){
                            observer.update(args);
                        })
                    },
                    addObserver: function(observer){
                        Object.implement(observer, Observer);
                        this.observers.push(observer);
                    },
                    clearObservers: function(){
                        this.observers = [];
                    }
                }
            });

            it("should return true if the specified object implements the specified interface", function(){
                try {
                    expect(Object.implement(that, Observable)).toBeTruthy();
                } catch(e){
                    this.fail("We should not reach this point.");
                }
            });

            it("should throw an exception if the specified object does not implement the specified interface", function(){
                try {
                    Object.implement(that, Observer);
                    this.fail("We should not reach this point.");
                } catch(e){
                    $.log("[ObjectSpec] The exception was thrown successfully by Object.implement");
                }
            });
        });
    });

});
