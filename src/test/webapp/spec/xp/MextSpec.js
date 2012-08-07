describe("Object.mext (Macedon Extensions)", function(){

    var $ = mjs;

    $.require("mjs/xp/mext");

    beforeEach(function(){
        $.setDebugEnabled(true);
    });


    describe("Object.mext.extend()", function(){
        afterEach(function(){
            delete $.author;
        });

        it("should mix the second argument into the first argument", function(){
            var obj = { id: 3 };
            var obj2 = {author: "Philip Ford"};
            obj.mext.extend(obj2);
            expect(obj.author).toBe("Philip Ford");
            expect(obj2.id).toBeUndefined();
        });

        it("should mix all arguments, after the first argument, into the first argument", function(){
            var obj = { id: 3 };
            var obj2 = {author: "Philip Ford"};
            var obj3 = {copyright: "July 2012"};
            obj.mext.extend(obj2, obj3);
            expect(obj.author).toBe("Philip Ford");
            expect(obj.copyright).toBe("July 2012");
            expect(obj2.copyright).toBeUndefined();
        });

    });



    describe("Object.mext.augment()", function(){
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
            theObject.mext.augment(mixin);
            expect(theObject.bgColor).not.toBeNull();
            expect(theObject.bgColor).toEqual('red');
            expect(theObject.rank).toEqual('99%');
            expect(theObject.getBgColor()).toEqual('red');
            expect(theObject.execute()).toEqual('Hello!');
        });

        it("should not override existing properties, even if they are null or false", function(){
            theObject.mext.augment(mixin);
            expect(theObject.id).toEqual('test');
            expect(theObject.getAge()).toEqual(21);
            expect(theObject.active).toBeFalsy();
        });

        it("should not remove any existing properties", function(){
            theObject.mext.augment(mixin);
            expect(theObject.id).not.toBeNull();
            expect(theObject.getAge).not.toBeNull();
            expect(theObject.bgColor).not.toBeNull();
            expect(theObject.active).not.toBeNull();

            expect(theObject.id).toBeDefined();
            expect(theObject.getAge).toBeDefined();
            expect(theObject.bgColor).toBeDefined();
            expect(theObject.active).toBeDefined();
        });
    });



    describe("Object.mext.override()", function(){
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
            theObject.mext.override(mixin);
            expect(theObject.rank).not.toBeDefined();
            expect(theObject.getBgColor).not.toBeDefined();
            expect(theObject.execute).not.toBeDefined();
        });

        it("should override any corresponding existing properties, even if they are null or false", function(){
            theObject.mext.override(mixin);
            expect(theObject.bgColor).toEqual('red');
            expect(theObject.id).toEqual('mixin');
            expect(theObject.getAge()).toEqual(23);
            expect(theObject.active).toBeTruthy();
        });

        it("should not remove any existing properties", function(){
            theObject.mext.override(mixin);
            expect(theObject.id).not.toBeNull();
            expect(theObject.getAge).not.toBeNull();
            expect(theObject.bgColor).not.toBeNull();
            expect(theObject.active).not.toBeNull();

            expect(theObject.id).toBeDefined();
            expect(theObject.getAge).toBeDefined();
            expect(theObject.bgColor).toBeDefined();
            expect(theObject.active).toBeDefined();
        });
    });




    describe("Object.mext.difference()", function(){
        it("should return a map properties present one of, but not both of, two objects", function(){
            var obj1 = { id: 3, name: "John" };
            var obj2 = { id: 4, value: 45 };
            var diff = obj1.mext.difference(obj2);
            $.log("difference").log(diff);
            expect(diff.id).toBeUndefined();
            expect(diff.name).toBe("John");
            expect(diff.value).toBe(45);
        })
    });


    describe("Object.mext.size()", function(){
        it ("should return the number of properties in the specified object", function(){
            var obj = { id: "45hgfd", name: "John", age: 26 };
            expect(obj.mext.size()).toBe(3);
            expect({}.mext.size()).toBe(0);
        });
    });



    describe("Object.mext.clone()", function(){
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
            var copy = blueprint.mext.clone();
            expect(copy.id).toEqual("0012-000-000-003844");
        });
    });


});