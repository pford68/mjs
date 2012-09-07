describe("mjs.getFactory()", function(){

    var $ = mjs;

    $.require("mjs/core/ObjectFactory");
    $.require("mjs/core/oop");  // For testing


    function assertObjectX(that){
        expect(typeof that.equals === 'function').toBeTruthy();
        expect(typeof that.compareTo === 'function').toBeTruthy();
    }

    function assertSchema(that){
        expect(typeof that.equals === 'function').toBeTruthy();
        expect(typeof that.compareTo === 'function').toBeTruthy();
        expect(typeof that.marshal === 'function').toBeTruthy();
        expect(typeof that.fields === 'object').toBeTruthy();
        expect('Schema').toEqual(that.type);
    }

    var blueprint = {
        equals: function(that){ return this == that; },
        add: function(arg1, arg2){
            return arg1 + arg2;
        },
        compareTo: function(){},
        toString: function(){
            return "ObjectX";
        }
    };

    $.log("Object.create").log(Object.create(blueprint));


    var schema = {
        compareTo: function(that){

        },
        marshal: function(){

        },
        toString: function(){
            return "Schema";
        },
        fields: {}
    };

    var ObjectX = $.getFactory(blueprint);
    var Schema = ObjectX.extend(schema, {
        type: { value: "Schema", 'writable': false, enumerable: true }
    });

    it("should return a Factory", function(){
        expect(ObjectX.build).toBeDefined();
        expect(ObjectX.$super).toBeDefined();
        expect(ObjectX.extend).toBeDefined();
    });


    describe("The factory returned by getFactory()", function(){

        it("should implement mjs.ObjectFactory", function(){
            try {
                expect(Object.implement(ObjectX, $.ObjectFactory)).toBeTruthy();
            } catch (e){
                this.fail("We should not reach this point:  " + e.message);
            }
        });

        describe("build()", function(){
            it("should produce objects that have the same spec as the blueprint", function(){
                var that = ObjectX.build();
                $.log("objectx").log(that);
                assertObjectX(that);
            });

            it("changes to the blueprint should not affect the objects that it produces", function(){
                var a = {
                    equals: function(that){ return this == that; },
                    compareTo: function(){}
                };
                var ObjectA = $.getFactory(a);
                var first = ObjectA.build();
                a.id = "Huh?";
                delete a.compareTo;

                var second = ObjectA.build();

                assertObjectX(first);
                assertObjectX(second);
                expect(first.id).toBeUndefined();
                expect(second.id).toBeUndefined();
            });

            it("should add properties and methods to the prototype of the object", function(){
                var that = ObjectX.build();
                var proto = $.getPrototype(that);
                expect(proto.compareTo).toBeDefined();
                expect(proto.equals).toBeDefined();
            });


            describe("Private properties", function(){
                var HashMap, SpecialHashMap, map;

                beforeEach(function(){
                    HashMap = $.getFactory({
                        _items: [],
                        _className: "HashMap",
                        put: function(key, value){
                            this._items[key] = value;
                        },
                        get: function(key){
                            return this._items[key];
                        }
                    });
                    map = HashMap.build();

                    SpecialHashMap = HashMap.extend({
                        _className: "SpecialHashMap",
                        clear: function(key, value){
                            this._items = [key, value];
                        }
                    });
                });

                it("properties that begin with underscores should be private, inaccessible outside the object", function(){
                    try{
                        $.log(map._items);
                        this.fail("We should not reach this point.");
                    } catch(e){
                        $.log("[ObjectFactorySpec]The error was successfully thrown:  " + e.message);
                    }
                });

                it("should be accessible inside the object", function(){
                    try {
                        map.put("person", "Philip");
                    } catch (e){
                        this.fail("We should not have thrown an error: " + e.message);
                    }
                    expect(map.get("person")).toEqual("Philip");
                });

                it("should be not accessible by other objects from the same factory", function(){
                    var myGreatMap = HashMap.build({
                        put: function(key, value){
                            map._items = [key, value];
                        }
                    });
                    try {
                        myGreatMap.put("age", 25);
                        this.fail("We should not reach this point");
                    } catch(e){
                        $.log("[ObjectFactorySpec] myGreatMap was successfully prevented from accessing map._items:  " + e.message);
                    }
                });

                it("should be accessible indirectly by inherited methods in objects created by factory subclasses", function(){
                    var special = SpecialHashMap.build();

                    try {
                        special.put("age", 25);
                    } catch(e){
                        this.fail("We should not throw an error");
                    }
                });

                /*
                it("should be inaccessible by new methods in objects created by factory subclasses", function(){
                    var special = SpecialHashMap.build();

                    try {
                        special.clear();
                        this.fail("We should throw an error");
                    } catch(e){
                        $.log("[ObjectFactorySpec]  We successfully caught the instance of the sub-factory " +
                            "trying to access a private property in the parent blueprint:  " + e.message);
                    }
                });*/
            });

        });



        describe("extend()", function(){
            it("should produce objects that have the same spec as its new blueprint", function(){
                var that = Schema.build();
                $.log("schema").log(that);
                assertSchema(that);
                expect(that.toString()).toEqual("Schema");
            });

            it("should produce objects containing methods from the inherited blueprint", function(){
                var that = Schema.build();
                expect(that.add).toBeDefined();
            });

            it("should add properties and methods to the prototype of the object", function(){
                var that = Schema.build();
                var proto = $.getPrototype(that);
                expect(proto.marshal).toBeDefined();
                expect(proto.compareTo).toBeDefined();
                expect(proto.equals).toBeDefined();
                expect(proto.fields).toBeDefined();
            });

            it("should add not properties and methods to the prototype in the original factory", function(){
                var that = ObjectX.build();
                var proto = $.getPrototype(that);
                expect(proto.marshal).toBeUndefined();
                expect(proto.fields).toBeUndefined();
            });

            it("should override methods inherited from the original blueprint without affecting the original", function(){
                var schema = Schema.build();
                var ox = ObjectX.build();
                expect(schema.toString()).toEqual("Schema");
                expect(ox.toString()).toEqual("ObjectX");
            });

        });

        describe("$super()", function(){
            it("should retrieve the specified function of the parent factory's blueprint", function(){
                var that = Schema.build();
                expect(Schema.$super("toString", that).call()).toEqual("ObjectX");
            });
        });
    });


    describe("The objects produced by the returned factory", function(){

        it("should all share the same copies of inherited methods", function(){
            var a = ObjectX.build();
            var b = ObjectX.build();
            expect(a.add === b.add).toBeTruthy();
            expect(a.equals === b.equals).toBeTruthy();
            expect(a.compareTo === b.compareTo).toBeTruthy();
            a.add.defaultValue = 4;
            b.compareTo.defaultValue = "OK";
            expect(b.add.defaultValue).toEqual(4);
            expect(a.compareTo.defaultValue).toEqual("OK");
        })

    });

});

