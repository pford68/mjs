describe("mjs.getFactory()", function(){

    var $ = mjs;

    $.require("mjs/xp/ObjectFactory");

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
        compareTo: function(){}
    };

    $.log("Object.create").log(Object.create(blueprint));

    var schema = $.extend({}, blueprint, {
        compareTo: function(that){

        },
        marshal: function(){

        },
        fields: {}
    });

    var ObjectX = $.getFactory(blueprint);
    var Schema = $.getFactory(schema, {
        type: { value: "Schema", 'writable': false, enumerable: true }
    });

    it("should return a Factory", function(){
        expect(ObjectX.build).toBeDefined();
        expect(ObjectX.$super).toBeDefined();
        expect(ObjectX.extend).toBeDefined();
    });


    describe("The factory returned by getFactory()", function(){
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

        describe("extend()", function(){
            it("should produce objects that have the same spec as its new blueprint", function(){
                var that = Schema.build();
                $.log("schema").log(that);
                assertSchema(that);
            });
        });
    });


    describe("The objects produced by the returned factory", function(){

    });

});

