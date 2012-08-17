describe("MJS Core Functions", function(){

    var $ = mjs, frameLoaded = false;
    
    beforeEach(function(){
        $.setDebugEnabled(true);
    });

    afterEach(function(){
        delete $.id;
        delete $.name;
    });


    describe("setDebugEnabled()", function(){
        var _log;

        beforeEach(function(){
            if (typeof console === 'undefined') {
                console = {};
            } else if (!_log){
                _log = console.log;
            }
            $.extend(console, {
               content:[],
               log: function(msg){
                   this.content.push(msg)
               }
            });
        });

        it("should allow console logging when the argument is 'true'", function(){
            $.setDebugEnabled(true);
            expect($.isDebugEnabled()).toBeTruthy();

            $.log("A");
            expect($.isDebugEnabled()).toBeTruthy();
            expect(console.content.length).toEqual(1);
            expect(console.content[0]).toEqual("A");
        });

        it("should prevent console logging when the argument is 'false'", function(){
            $.setDebugEnabled(false);
            expect($.isDebugEnabled()).toBeFalsy();
            $.log("B");
            expect(console.content.length).toEqual(0);

            if (_log) console.log = _log;
            console.log("console reset");
        });
    });



    describe("log()", function(){
        it("should not throw an error when the console is closed", function(){
            $.setDebugEnabled(true);
            try {
                $.log("Hello, from $.log!");
            } catch (e) {
                fail("An exception should not have been thrown.");
            }
        })
    });



    describe("error()", function(){
        it("should throw an error", function(){
            $.setDebugEnabled(true);
            try {
                $.error("Hello, from $.error!");
                fail("We should not have reached this point.");
            } catch(e) {
                $.log("$.error() passed.");
            }
        })
    });



    describe("extend()", function(){
        afterEach(function(){
            delete $.author;
        });

        it("should mix the second argument into the first argument", function(){
            var obj = { id: 3 };
            var obj2 = {author: "Philip Ford"};
            $.extend(obj, obj2);
            expect(obj.author).toBe("Philip Ford");
            expect(obj2.id).toBeUndefined();
        });

        it("should mix all arguments, after the first argument, into the first argument", function(){
            var obj = { id: 3 };
            var obj2 = {author: "Philip Ford"};
            var obj3 = {copyright: "July 2012"};
            $.extend(obj, obj2, obj3);
            expect(obj.author).toBe("Philip Ford");
            expect(obj.copyright).toBe("July 2012");
            expect(obj2.copyright).toBeUndefined();
        });

        it("should mix the first argument into mjs when only one argument is passed", function(){
            $.extend({ author: "Philip Ford"});
            expect($.author).toBe("Philip Ford");
        });

        it("if the arguments length equals 1, should return mjs for chaining", function(){
            expect($.extend({id: 3, name: "John"})).toBe(mjs);
        });

        it("if the arguments length is greater than 1, should return arguments[0]", function(){
            var that = {};
            expect($.extend(that, {id: 3, name: "John"})).toBe(that);
        });
    });



    describe("augment()", function(){
        var theObject,
            mixin = {
                id: 'mixin',
                bgColor: 'red',
                rank: '99%',
                active: true,
                getAge: function(){
                    return 23;
                },
                execute: function(){
                    return "Hello!";
                },
                getBgColor: function(){
                    return this.bgColor;
                }
            };

        beforeEach(function(){
            theObject = {
                id: 'test',
                active: false,
                bgColor: null,
                getAge: function(){
                    return 21;
                }
            };
        });

        it("should add new properties to an object", function(){
            $.augment(theObject, mixin);
            expect(theObject.bgColor).not.toBeNull();
            expect(theObject.bgColor).toEqual('red');
            expect(theObject.rank).toEqual('99%');
            expect(theObject.getBgColor()).toEqual('red');
            expect(theObject.execute()).toEqual('Hello!');
        });

        it("should not override existing properties, even if they are null or false", function(){
            $.augment(theObject, mixin);
            expect(theObject.id).toEqual('test');
            expect(theObject.getAge()).toEqual(21);
            expect(theObject.active).toBeFalsy();
        });

        it("should not remove any existing properties", function(){
            $.augment(theObject, mixin);
            expect(theObject.id).not.toBeNull();
            expect(theObject.getAge).not.toBeNull();
            expect(theObject.bgColor).not.toBeNull();
            expect(theObject.active).not.toBeNull();

            expect(theObject.id).toBeDefined();
            expect(theObject.getAge).toBeDefined();
            expect(theObject.bgColor).toBeDefined();
            expect(theObject.active).toBeDefined();
        });

        it("if the arguments length equals 1, should return mjs for chaining", function(){
            expect($.augment({id: 3, name: "John"})).toBe(mjs);
        });

        it("if the arguments length is greater than 1, should return arguments[0]", function(){
            var that = {};
            expect($.augment(that, {id: 3, name: "John"})).toBe(that);
        });
    });



    describe("override()", function(){
        var theObject,
            mixin = {
                id: 'mixin',
                bgColor: 'red',
                rank: '99%',
                active: true,
                getAge: function(){
                    return 23;
                },
                execute: function(){
                    return "Hello!";
                },
                getBgColor: function(){
                    return this.bgColor;
                }
            };

        beforeEach(function(){
            theObject = {
                id: 'test',
                active: false,
                bgColor: null,
                getAge: function(){
                    return 21;
                }
            };
        });

        it("should not add new properties an object", function(){
            $.override(theObject, mixin);
            expect(theObject.rank).not.toBeDefined();
            expect(theObject.getBgColor).not.toBeDefined();
            expect(theObject.execute).not.toBeDefined();
        });

        it("should override any corresponding existing properties, even if they are null or false", function(){
            $.override(theObject, mixin);
            expect(theObject.bgColor).toEqual('red');
            expect(theObject.id).toEqual('mixin');
            expect(theObject.getAge()).toEqual(23);
            expect(theObject.active).toBeTruthy();
        });

        it("should not remove any existing properties", function(){
            $.override(theObject, mixin);
            expect(theObject.id).not.toBeNull();
            expect(theObject.getAge).not.toBeNull();
            expect(theObject.bgColor).not.toBeNull();
            expect(theObject.active).not.toBeNull();

            expect(theObject.id).toBeDefined();
            expect(theObject.getAge).toBeDefined();
            expect(theObject.bgColor).toBeDefined();
            expect(theObject.active).toBeDefined();
        });

        it("if the arguments length equals 1, should return mjs for chaining", function(){
            expect($.override({id: 3, name: "John"})).toBe(mjs);
        });

        it("if the arguments length is greater than 1, should return the first argument", function(){
            var that = {};
            expect($.override(that, {id: 3, name: "John"})).toBe(that);
        });
    });



    describe("require()", function(){
        $.require("testPlugin");

        afterEach(function(){
            if ($.redux) delete $.redux;
        });

        it("should import the required file", function(){
            expect($.test.ping()).toEqual("OK");
            expect($.loadCount).toEqual(1);
        });

        it("should not import a required file more than once, and should not execute it more than once", function(){
            $.require("testPlugin");
            $.require("testPlugin");
            $.require("testPlugin");
            expect($.loadCount).toEqual(1);
        });

        it("should not import a file once it is registered", function(){
            $.registerModule("blank");
            expect($.blankLoaded).not.toBeDefined(); // A control
            $.require("blank");
            expect($.blankLoaded).not.toBeDefined();
        });

        it("should be able to find any .js file path relative to the js path", function(){
            expect($.flash).not.toBeDefined(); // A control
            expect($.lib).not.toBeDefined(); // A control
            $.require("reverse/flash");
            expect($.flash).toBeDefined();
            $.require("../lib/raphael.js");
            expect($.lib.name).toEqual("Raphael");
        });

        it("should support the wildcard syntax, pulling in all files in __package__.js", function(){
            expect($.redux).not.toBeDefined(); // A control
            $.require("redux/*");
            $.log("/redux/*").log($.redux.items);
            expect($.redux.items.length).toEqual(4);
        });

        it("should import all files required by a required file...you know, recursively", function(){
            expect($.model).not.toBeDefined(); // A control
            expect($.reverse).not.toBeDefined(); // A control
            $.require("uncommon/model/TrainingEvent");
            expect($.model).toBeDefined();
            expect($.model.TrainingEvent).toBeDefined();
            expect($.reverse.ajax).toBeDefined();
        });

        it("should support circular dependencies", function(){
            $.require("circular/dep3");
            expect($.circular.dep3.values[0]).toEqual(1);
            expect($.circular.dep3.values[1]).toEqual(3);
        });

        it("should throw an error if the resource is not found", function(){
            try {
                $.require("ux/notThere");
                this.fail("We should not reach this point");
            } catch(e) {
                $.log("Resource Not Found error thrown successfully.")
            }
        });
    });



    describe("toArray()", function(){
        it("should convert any Object to an Array of its property values", function(){
            expect($.toArray({}).constructor === Array).toBeTruthy();
            expect($.toArray({ 0: "A", 1: "B" }).constructor === Array).toBeTruthy();
            expect($.toArray({ initValue: "A", getValue: function(){ return this.initValue; } }).constructor === Array).toBeTruthy();
            expect($.toArray(new Date()).constructor === Array).toBeTruthy();
            expect($.toArray([]).constructor === Array).toBeTruthy();
        })
    });



    describe("isObject()", function(){
        function Test(){

        } /*  This will cause $.isObject(new Test(), true) to return true, when we'd probably expect it to be false.
        Test.prototype = {
            add: function(){ return 2+2; }
        };  */
        //Test.prototype.add = function(){ return 2 + 2; };  // This works fine with $.isObject(new Test(), true).
        $.extend(Test.prototype, {
            add: function(){ return 2+2; }
        });


        it("should correctly identify an object created in the current window", function(){
            expect($.isObject({})).toBeTruthy();

            var a = new Object();
            expect($.isObject(a)).toBeTruthy();
            expect($.isObject({ id: 34, test: function(){} }, true)).toBeTruthy();
            expect($.isObject([])).toBeTruthy();
            expect($.isObject(new Array(100))).toBeTruthy();
        });

        it("should correctly identify an object created in another window/frame", function(){
            var resume = false;

            runs(function(){
                setTimeout(function(){
                    resume = true;
                }, 1500)
            });

            waitsFor(function(){
                return resume;
            }, "", 5000);

            runs(function(){
                expect($.isObject(window.frames[0].map, true)).toBeTruthy();
            });
        });

        it("should correctly identify that literals are not objects", function(){
            expect($.isObject(true)).toBeFalsy();
            expect($.isObject(3)).toBeFalsy();
        });

        it("should correctly identify that nulls are not objects", function(){
            expect($.isObject(null)).toBeFalsy();
            expect($.isObject(undefined)).toBeFalsy();
            expect($.isObject(null, true)).toBeFalsy();
            expect($.isObject(undefined, true)).toBeFalsy();
        });

        it("should correctly identify that instances of subclasses are objects, if pure is false", function(){
            expect($.isObject(new Date())).toBeTruthy();
            $.log("string instanceof Object").log("gfhg" instanceof Object);
            $.log("new String() instanceof Object").log(new String("gfhg") instanceof Object);
            expect($.isObject(new String("fjdgkfdg"))).toBeTruthy();    // A String literal will be false
            expect($.isObject(new Number(3))).toBeTruthy();
            expect($.isObject(new function(){})).toBeTruthy();
            expect($.isObject(new Test())).toBeTruthy();
        });

        it("should correctly identify that instances of subclasses are not objects, if pure is true", function(){
            expect($.isObject(new Date(), true)).toBeFalsy();
            expect($.isObject("fjdgkfdg", true)).toBeFalsy();
            expect($.isObject(new String("fjdgkfdg"), true)).toBeFalsy();
            expect($.isObject(new Number(3), true)).toBeFalsy();
            expect($.isObject(new function(){}, true)).toBeFalsy();
            expect($.isObject(new Test(), true)).toBeFalsy();
        });

        it("should correctly identify that instances of Object instance when pure is true", function(){
            expect($.isObject({}, true)).toBeTruthy();
            expect($.isObject({ id: 34, test: function(){} }, true)).toBeTruthy();
            expect($.isObject(new Object(), true)).toBeTruthy();
        });
    });



    describe("isString()", function(){
        it("should return true if the value is a String", function(){
            expect($.isString("fjdgkfdg")).toBeTruthy();
            expect($.isString(new String("ghfdjg"))).toBeTruthy();
        });
        it("should return false if the value is not a String", function(){
            expect($.isString(3)).toBeFalsy();
            expect($.isString(true)).toBeFalsy();
            expect($.isString(false)).toBeFalsy();
            expect($.isString({})).toBeFalsy();
            expect($.isString([])).toBeFalsy();
        });
    });



    describe("isInteger()", function(){
        it("should return true if the value is an integer", function(){
            expect($.isInteger(3)).toBeTruthy();
            expect($.isInteger(0)).toBeTruthy();
            expect($.isInteger(-1)).toBeTruthy();
            expect($.isInteger(parseInt("3"))).toBeTruthy();
        });
        it("should return false if the value is not an integer", function(){
            expect($.isInteger("3")).toBeFalsy();
            expect($.isInteger(3.3)).toBeFalsy();
            expect($.isInteger(true)).toBeFalsy();
            expect($.isInteger(false)).toBeFalsy();
            expect($.isInteger({})).toBeFalsy();
            expect($.isInteger([])).toBeFalsy();
        });
    });



    describe("isNumber()", function(){
        it("should return true if the value is a number", function(){
            expect($.isNumber(3)).toBeTruthy();
            expect($.isNumber(0)).toBeTruthy();
            expect($.isNumber(-1)).toBeTruthy();
            expect($.isNumber(parseInt("3"))).toBeTruthy();
            expect($.isNumber(3.4)).toBeTruthy();
        });
        it("should return false if the value is not a number", function(){
            expect($.isNumber("3")).toBeFalsy();
            expect($.isNumber(true)).toBeFalsy();
            expect($.isNumber(false)).toBeFalsy();
            expect($.isNumber({})).toBeFalsy();
            expect($.isNumber([])).toBeFalsy();
        });
    });



    describe("isBoolean()", function(){
        it("should return true if the value is a boolean", function(){
            expect($.isBoolean(true)).toBeTruthy();
            expect($.isBoolean(false)).toBeTruthy();
            expect($.isBoolean(new Boolean(true).valueOf())).toBeTruthy();
        });
        it("should return false if the value is not a boolean", function(){
            expect($.isBoolean("3")).toBeFalsy();
            expect($.isBoolean(3.3)).toBeFalsy();
            expect($.isBoolean("true")).toBeFalsy();
            expect($.isBoolean("false")).toBeFalsy();
            expect($.isBoolean({})).toBeFalsy();
            expect($.isBoolean([])).toBeFalsy();
            expect($.isBoolean(null)).toBeFalsy();
            expect($.isBoolean(undefined)).toBeFalsy();
        });
        it("should return false for a Boolean object", function(){
            expect($.isBoolean(new Boolean(true))).toBeFalsy();
        });
    });



    describe("toBoolean()", function(){
        it("should convert the word \"true\" to true", function(){
            expect($.toBoolean("true") === true).toBeTruthy();
            expect($.toBoolean("true   ") === true).toBeTruthy();
            expect($.toBoolean("   true") === true).toBeTruthy();
            expect($.toBoolean("  true   ") === true).toBeTruthy();
        });
        it("should convert all other values as false", function(){
            expect($.toBoolean("false") === true).toBeFalsy();
            expect($.toBoolean("trtre") === true).toBeFalsy();
            expect($.toBoolean(3) === true).toBeFalsy();
            expect($.toBoolean({ value: true }) === true).toBeFalsy();
            expect($.toBoolean(null) === true).toBeFalsy();
            expect($.toBoolean(undefined) === true).toBeFalsy();
            expect($.toBoolean(0) === true).toBeFalsy();
        })
    });



    describe("isArray()", function(){
        it("should correctly identify an array created in the current window", function(){
            expect($.isArray([])).toBeTruthy();

            var a = new Array(100);
            expect($.isArray(a)).toBeTruthy();
        });

        it("should correctly identify an array created in another window/frame", function(){ /*
         expect($.isArray([])).toBeTruthy();

         var a = new Array(100);
         expect($.isArray(a)).toBeTruthy();*/
        });

        it("should correctly identify that literals are not arrays", function(){
            expect($.isArray("hfkdgldfsg")).toBeFalsy();
            expect($.isArray("object Array")).toBeFalsy();
            expect($.isArray(true)).toBeFalsy();
            expect($.isArray(3)).toBeFalsy();
        });

        it("should correctly identify that nulls are not arrays", function(){
            expect($.isArray(null)).toBeFalsy();
            expect($.isArray(undefined)).toBeFalsy();
        });

        it("should correctly identify that other objects are not arrays", function(){
            expect($.isArray({})).toBeFalsy();
            expect($.isArray(new Date())).toBeFalsy();
        });
    });



    describe("isEmpty()", function(){
        it("should return true if the value is \"\", null, undefined or 0", function(){
            expect($.isEmpty("")).toBeTruthy();
            expect($.isEmpty("   ")).toBeTruthy();
            expect($.isEmpty("")).toBeTruthy();
            expect($.isEmpty(0)).toBeTruthy();
            expect($.isEmpty(null)).toBeTruthy();
            expect($.isEmpty(undefined)).toBeTruthy();
        });

        it("should return false otherwise", function(){
            expect($.isEmpty(NaN)).toBeFalsy();
            expect($.isEmpty("0")).toBeFalsy();
            expect($.isEmpty(false)).toBeFalsy();
            expect($.isEmpty({})).toBeFalsy();
            expect($.isEmpty([])).toBeFalsy();
        });
    });

    describe("notEmpty()", function(){
        it("should return false if the value is \"\", null, undefined or 0", function(){
            expect($.notEmpty("")).toBeFalsy();
            expect($.notEmpty("   ")).toBeFalsy();
            expect($.notEmpty("")).toBeFalsy();
            expect($.notEmpty(0)).toBeFalsy();
            expect($.notEmpty(null)).toBeFalsy();
            expect($.notEmpty(undefined)).toBeFalsy();
        });
        it("should return true otherwise", function(){
            expect($.notEmpty(NaN)).toBeTruthy();
            expect($.notEmpty("0")).toBeTruthy();
            expect($.notEmpty(false)).toBeTruthy();
            expect($.notEmpty({})).toBeTruthy();
            expect($.notEmpty([])).toBeTruthy();
        });


    });


    describe("parseInt()", function(){
        it("should work like the native parseInt but compensate for opening zeros in the numeric string", function(){
            expect($.parseInt("2") === 2).toBeTruthy();
            expect($.parseInt("02") === 2).toBeTruthy();
            expect($.parseInt("002") === 2).toBeTruthy();
            expect($.parseInt("0002") === 2).toBeTruthy();
        });
        it("should convert floats strings to ints", function(){
            expect($.parseInt("2.2") === 2).toBeTruthy();
        });
        it("should return 0 for non-numeric strings", function(){
            expect($.parseInt("yrujytj") === 0).toBeTruthy();
        });
    });


    describe("parseFloat()", function(){
        it("should work like the native parseFloat", function(){
            expect($.parseFloat("2.2") === 2.2).toBeTruthy();
        });
        it("should convert integer strings to floats", function(){
            expect($.parseFloat("2") === 2.0).toBeTruthy();
        });
        it("should return 0.0 for non-numeric strings", function(){
            expect($.parseFloat("yrujytj") === 0.0).toBeTruthy();
        });
    });


    describe("isUndefined()", function(){
        it("should return true if the value is undefined", function(){
            expect($.isUndefined(undefined)).toBeTruthy();
            var obj = {};
            expect($.isUndefined(obj.value)).toBeTruthy();
        });
        it("should return false if the value is null or anything else but undefined", function(){
            var obj = { value: null };
            expect($.isUndefined(obj.value)).toBeFalsy();
            expect($.isUndefined(null)).toBeFalsy();
            expect($.isUndefined("3")).toBeFalsy();
            expect($.isUndefined(3.3)).toBeFalsy();
            expect($.isUndefined("true")).toBeFalsy();
            expect($.isUndefined("false")).toBeFalsy();
            expect($.isUndefined({})).toBeFalsy();
            expect($.isUndefined([])).toBeFalsy();
        });
    });


    describe("module()", function(){
        afterEach(function(){
            delete window.legacy;
            delete window.testing
        });

        it("should create a namespace from a path", function(){
            expect(window.legacy).toBeUndefined(); // A control;
            $.module("legacy/api/oop");
            expect(legacy.api.oop).toBeDefined();
            try {
                legacy.api.oop = { create: function(){}};
            } catch (e){
                this.fail("This should not throw an error;")
            }
        });

        it("should create a namespace from an object path", function(){
            expect(window.legacy).toBeUndefined(); // A control;

            $.module("testing.procedures.theEarlyYears");
            expect(testing.procedures.theEarlyYears).toBeDefined();
            try {
                testing.procedures.theEarlyYears = { create: function(){}};
            } catch (e){
                this.fail("This should not throw an error;")
            }
        });

        it("should not create a namespace if that namespace already exists", function(){
            var test1 = { api: { fixtures: [ "test1" ] }};
            $.module("test1/api/fixtures");
            expect(test1.api.fixtures[0]).toBe("test1");
        });
    });



    describe("isNode()", function(){

    });


    describe("isElement()", function(){

    });


    describe("proxy()", function(){
        //document.body.appendChild()
    });

    describe("clone()", function(){
        var blueprint = {
            id: "0012-000-000-003844",
            initialize: function(){},
            items: [3,4],
            map: {
                teams: [ "Rangers", "Cowboys"],
                cities: ["Austin", "Dallas", "Faifax"]
            }
        };
        it("should make a separate copy of an object", function(){
            var copy = $.clone(blueprint);
            expect(copy.id).toEqual("0012-000-000-003844");
        });
    });

    describe("isFunction()", function(){
        it("should return true for any function", function(){
            function test(){}
            expect($.isFunction(test)).toBeTruthy();
        });

        it("should return false for anything else, including null and undefined", function(){
            expect($.isFunction(null)).toBeFalsy();
            expect($.isFunction(undefined)).toBeFalsy();
            expect($.isFunction(3)).toBeFalsy();
            expect($.isFunction({})).toBeFalsy();
            expect($.isFunction("")).toBeFalsy();
        });
    });


    describe("constant()", function(){
        it("should create an immutable key/value pair", function(){
            var my = {};
            $.constant("__CLASSNAME__", "MyGreatClass", my);
            my.__CLASSNAME__ = "OK";
            expect("MyGreatClass").toEqual(my.__CLASSNAME__);
        });

        it("should create an key/value pair that can't be deleted from its object scope", function(){
            var my = {};
            $.constant("__CLASSNAME__", "MyGreatClass", my);

            delete my.__CLASSNAME__;
            expect("MyGreatClass").toEqual(my.__CLASSNAME__);
        });

        it("should convert the key to upper case if it is not already upper case", function(){
            var my = {};
            $.constant("some_Name", "Roger", my);
            expect(my.SOME_NAME).toBeDefined();
            expect(my.some_Name).toBeUndefined();
        });
    });


    describe("isLetter()", function(){
        it("should return true if the specified value is a letter", function(){
            expect($.isLetter("p")).toBeTruthy();
            expect($.isLetter("A")).toBeTruthy();
        });

        it("should return false if the specified value is a multi-character string", function(){
            expect($.isLetter("pr")).toBeFalsy();
        });

        it("should return false if the specified value is a number or other character or other value", function(){
            expect($.isLetter("0")).toBeFalsy();
            expect($.isLetter("_")).toBeFalsy();
            expect($.isLetter("*")).toBeFalsy();
            expect($.isLetter("")).toBeFalsy();
            expect($.isLetter(" ")).toBeFalsy();
            expect($.isLetter(null)).toBeFalsy();
            expect($.isLetter(8)).toBeFalsy();
        });
    });


    describe("range", function(){
        it("should return an array of integers between the start and end", function(){
            var result = $.range(1, 10);
            expect(result.length).toEqual(9);
            expect(result.join(",")).toEqual("1,2,3,4,5,6,7,8,9");
        });

        it("should return an array of integers incremented by the specified step", function(){
            var result = $.range(0, 21, 5);
            expect(result.join(",")).toEqual("0,5,10,15,20");
        });

        it("should work for negative numbers", function(){
            var result = $.range(-5, 0);
            expect(result.join(",")).toEqual("-5,-4,-3,-2,-1");
            result = $.range(-5,1);
            expect(result.join(",")).toEqual("-5,-4,-3,-2,-1,0");
        });
    })
});