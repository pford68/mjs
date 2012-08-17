describe("Topics (Part of Publish/Subscribe Framework)", function(){

    var $ = mjs,
        publisher, increment, cube, append, prepend,
        result = 2;

    $.require("mjs/core/publish");

    publisher = new $.Publisher();

    beforeEach(function(){
        increment = function(){ ++result; };
            cube = function(){ result *= 3 };
        append = function(data) { result += data };
        prepend = function(args) { result = args.prefix + result };

        $.topics.unsubscribeAll("/jsunit");
        $.topics.subscribe("/jsunit", increment);
        $.topics.subscribe("/jsunit", cube);
    });

    afterEach(function(){
        result = 2;
        $.topics.unsubscribe("/jsunit", increment);
        $.topics.unsubscribe("/jsunit", cube);
    });


    describe("subscribe()", function(){

        it("should add the current function to the list of subscribers for the specified topic", function(){
            expect($.topics.get("/jsunit").length).toEqual(2);    // A control

            function test(){}
            $.topics.subscribe("/jsunit", test);
            expect($.topics.get("/jsunit").length).toEqual(3);
        });

        it("should not allow the same function to subscribe more than once", function(){
            expect($.topics.get("/jsunit").length).toEqual(2);    // A control
            $.topics.subscribe("/jsunit", cube);
            expect($.topics.get("/jsunit").length).toEqual(2);
        });
    });


    describe("unsubscribe()", function(){

        it("should remove the current function from the list of subscribers for the specified topic", function(){
            $.topics.unsubscribe("/jsunit", increment);
            expect($.topics.get("/jsunit").length).toEqual(1);

            $.topics.unsubscribe("/jsunit", cube);
            expect($.topics.get("/jsunit").length).toEqual(0);
        });

        it("should not throw an error on non-subscribers", function(){
            function test(){}
            try {
                $.topics.unsubscribe("/jsunit", test);
            } catch(e){
                this.fail("We should not have thrown an error.");
            }
        });
    });


    describe("publish()", function(){
        it("should send its arguments to all subscribers", function(){
            $.topics.publish("/jsunit");
            expect(result).toEqual(9);
        });

        it("should be able to send strings to subscribers", function(){
            $.topics.subscribe("/jsunit", append);
            $.topics.publish("/jsunit", "arecibo");
            expect("9arecibo").toEqual(result);
            $.topics.unsubscribe("/jsunit", append);
        });

        it("should be able to send objects to subscribers", function(){
            $.topics.subscribe("/jsunit", prepend);
            $.topics.publish("/jsunit", { prefix: "arecibo" });
            expect("arecibo9").toEqual(result);
            $.topics.unsubscribe("/jsunit", prepend);
        });

        it("should not throw an error when publishing to nulls", function(){
            $.topics.subscribe("/jsunit", prepend);
            prepend = null;

            try {
                $.topics.publish("/jsunit", { prefix: "arecibo" });
                expect("arecibo9").toEqual(result);
            } catch(e) {
                this.fail("An error should not have occurred.")
            }
        });
    });
});
