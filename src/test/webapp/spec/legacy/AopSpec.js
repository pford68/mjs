describe("mjs/core/aop", function(){

    var $ = mjs;

    $.require("mjs/legacy/aop");

    describe("before()", function(){
        it("should add new behavior to the original function", function(){
            var advised, adviser, result;
            advised = {add: function(increment){this.left += increment; }, id: 'test', left: 32, top: 43};
            adviser = {override: function(increment){ advised.left = increment; }};

            $.aop.before(advised, "add", adviser, "override");
            advised.add(2);

            expect(advised.left).toEqual(4);
        });

        it("should work with standalone functions too", function(){
            var obj = {id :3};
            var advised = function(){
                return obj.id - 2;
            };
            var adviser = function(){
                obj.id = 11;
            };
            advised = $.aop.before(advised, adviser);
            expect(advised()).toEqual(9);
        });

    });

    describe("after()", function(){
        it("should add new behavior to the orignal function", function(){
            var advised, adviser, result;
            advised = {add: function(increment){this.left += increment; }, id: 'test', left: 32, top: 43};
            adviser = {override: function(increment){ advised.left = increment; }};

            $.aop.after(advised, "add", adviser, "override");
            advised.add(2);

            expect(advised.left).toEqual(2);
        });
    });

    describe("around()", function(){
        it("should add new behavior to the orignal function", function(){
            var advised, adviser, result;
            advised = {add: function(increment){this.left += increment; }, id: 'test', left: 32, top: 43};
            adviser = {override: function(invocation){
                advised.left += 5; // 37
                invocation.proceed(); // 39
                advised.left -= 9;
            }};

            $.aop.around(advised, "add", adviser, "override");
            advised.add(2);

            expect(advised.left).toEqual(30);
        });
    });

    describe("getCachedResult()", function(){
        it("should return the result of the original function, executed before the after advice", function(){
            var advised, adviser, result = 0;
            advised = {add: function(value, increment){ return value + increment; }, id: 'test', left: 32, top: 43};
            adviser = {override: function(value, increment){ advised.left = increment * 3; }};

            $.aop.after(advised, "add", adviser, "override");
            result = advised.add(16, 2);

            expect(result).toBeUndefined();
            expect(advised.left).toEqual(6);
            expect($.aop.getCachedResult(advised, "add")).toEqual(18);
        });
    });
});
