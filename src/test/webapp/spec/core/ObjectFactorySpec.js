describe("mjs.getFactory()", function(){

    var $ = mjs;

    $.require("mjs/xp/ObjectFactory");

    function getPrototype(that){
        return that.__proto__ || that.getPrototypeOf();
    }

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
        compareTo: function(){},
        toString: function(){
            return "ObjectX";
        }
    };

    $.log("Object.create").log(Object.create(blueprint));

    var schema = $.extend({}, blueprint, {
        compareTo: function(that){

        },
        marshal: function(){

        },
        toString: function(){
            return "Schema";
        },
        fields: {}
    });

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
                var proto = getPrototype(that);
                expect(proto.compareTo).toBeDefined();
                expect(proto.equals).toBeDefined();
            });
        });



        describe("extend()", function(){
            it("should produce objects that have the same spec as its new blueprint", function(){
                var that = Schema.build();
                $.log("schema").log(that);
                assertSchema(that);
                expect(that.toString()).toEqual("Schema");
            });

            it("should add properties and methods to the prototype of the object", function(){
                var that = Schema.build();
                var proto = getPrototype(that);
                expect(proto.marshal).toBeDefined();
                expect(proto.compareTo).toBeDefined();
                expect(proto.equals).toBeDefined();
                expect(proto.fields).toBeDefined();
            });

            it("should add not properties and methods to the prototype in the original factory", function(){
                var that = ObjectX.build();
                var proto = getPrototype(that);
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

    });

});

