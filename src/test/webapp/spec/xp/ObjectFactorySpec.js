describe("mjs.ObjectFactory", function(){

    var $ = mjs;

    $.require("mjs/xp/ObjectFactory");


    var blueprint = {
        equals: function(that){ return this == that; },
        compareTo: function(){}
    };

    var ObjectX = $.ObjectFactory(blueprint);

    it("should return a Factory", function(){
        expect(ObjectX.build).toBeDefined();
        expect(ObjectX.$super).toBeDefined();
        expect(ObjectX.extend).toBeDefined();
    });

    describe("The Factory returned by ObjectFactory", function(){
        it("should have the same spec as the blueprint", function(){
            var that = ObjectX.build();
            $.log("objectx").log(that);
            expect(typeof that.equals === 'function').toBeTruthy();
            expect(typeof that.compareTo === 'function').toBeTruthy();
        })
    });
});

