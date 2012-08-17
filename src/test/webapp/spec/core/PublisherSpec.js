describe("Observer (Publish/Subscribe) Framework", function(){

    var $ = mjs,
        publisher, increment, cube, append, prepend,
        result = 2;

    $.require("mjs/core/publish");

    publisher = new $.Publisher();

    beforeEach(function(){
        publisher.subscribers = [];
        increment = function(){ ++result; };
            cube = function(){ result *= 3 };
        append = function(data) { result += data };
        prepend = function(args) { result = args.prefix + result };

        increment.subscribe(publisher);
        cube.subscribe(publisher);
    });

    afterEach(function(){
        result = 2;
        increment.unsubscribe(publisher);
        cube.unsubscribe(publisher);
    });


    describe("Function.prototype.subscribe()", function(){
        it("should be part of the Function.prototype and belong to all functions", function(){
            expect($.isFunction(Function.prototype.subscribe)).toBeTruthy();
        });

        it("should add the current function to the list of subscribers for the specified Publisher", function(){
            expect(publisher.subscribers.length).toEqual(2);    // A control

            function test(){}
            test.subscribe(publisher);
            expect(publisher.subscribers.length).toEqual(3);
        });

        it("should not allow the same function to subscribe more than once", function(){
            expect(publisher.subscribers.length).toEqual(2);    // A control
            cube.subscribe(publisher);
            expect(publisher.subscribers.length).toEqual(2);
        });
    });


    describe("unsubscribe()", function(){
        it("should be part of the Function.prototype and belong to all functions", function(){
            expect($.isFunction(Function.prototype.unsubscribe)).toBeTruthy();
        });

        it("should remove the current function from the list of subscribers for the specified Publisher", function(){
            increment.unsubscribe(publisher);
            expect(publisher.subscribers.length).toEqual(1);

            cube.unsubscribe(publisher);
            expect(publisher.subscribers.length).toEqual(0);
        });
    });


    describe("publish()", function(){
        it("should send its arguments to all subscribers", function(){
            publisher.publish();
            expect(result).toEqual(9);
        });

        it("should be able to send strings to subscribers", function(){
            append.subscribe(publisher);
            publisher.publish("arecibo");
            expect("9arecibo").toEqual(result);
            append.unsubscribe(publisher);
        });

        it("should be able to send objects to subscribers", function(){
            prepend.subscribe(publisher);
            publisher.publish({ prefix: "arecibo" });
            expect("arecibo9").toEqual(result);
            prepend.unsubscribe(publisher);
        });
    });
});
