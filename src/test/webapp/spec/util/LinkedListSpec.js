
describe("mjs.util.LinkedList", function(){

    var $ = mjs, list;

    $.require("mjs/util/LinkedList");
    $.require("mjs/fixtures/cars");
    $.require("mjs/core/arrays");   // For help in tests.

    var cars = $.fixtures.cars;

    beforeEach(function(){
        list = new $.util.LinkedList();
        list.add(cars[3]);
        list.add(cars[5]);
    });

    it("should allow me to add an item to the list, with add(), and retrieve it by index using getAt()", function(){
        list.add(cars[1]);
        list.add(cars[6]);
        expect(list.getAt(2)).toEqual(cars[1]);
    });

    it("should allow me to add an item to the list at a certain index, with insertAt(), " +
        "and retrieve any item by its new index using getAt()", function(){
        list.add(cars[1]);
        list.insertAt(1, cars[6]);
        expect(list.getAt(1)).toEqual(cars[6]);
    });

    it("should allow me to remove an item by index from the list, using removeAt()", function(){
        list.add(cars[1]);
        list.add(cars[4]);
        list.add(cars[6]);
        list.removeAt(2);
        expect(list.size()).toEqual(4);
        expect(list.getAt(2)).toEqual(cars[4]);
    });

    describe("getFirst()", function(){
        it("should retrieve the head of the list", function(){
            expect(list.getFirst()).toEqual(cars[3]);
            list.add(cars[7]);
            expect(list.getFirst()).toEqual(cars[3]);
        });
    });

    describe("getLast()", function(){
        it("should retrieve the tail of the list", function(){
            expect(list.getLast()).toEqual(cars[5]);
            list.add(cars[7]);
            expect(list.getLast()).toEqual(cars[7]);
        });
    });


    describe("size()", function(){
        it("should retrieve the number of items in the list", function(){
            expect(list.size()).toEqual(2);
            list.add(cars[4]);
            expect(list.size()).toEqual(3);
        });
    });


    describe("forEach()", function(){
        var iterators = $.iterators.LinkedList;

        afterEach(function(){
            list.setIterator(iterators.Left);
        });

        it("should iterate through the list, using the assigned iterator, executing a function on each item", function(){
            list.add(cars[1]);
            list.add(cars[4]);
            list.add(cars[6]);

            var models = [];
            list.forEach(function(item){
                models.push(item.value.model);
            });
            expect(models.length).toEqual(5);
            expect(models.join(",")).toEqual("328i,Model S,Aventador,335i,Roadster");
        });

        it("should handle empty lists correctly", function(){
            var emptyList = new $.util.LinkedList();
            var count = 0;

            try {
                emptyList.forEach(function(item){
                    ++count;
                    $.log("count: " + count);
                    throw new Error("We should not be here.");
                });
            } catch(e){
                this.fail(e.message)
            }
            expect(count).toEqual(0);
        });

        it("should iterate backwards, if we set the Right iterator", function(){
            list.add(cars[1]);
            list.add(cars[4]);
            list.add(cars[6]);

            var models = [];
            list.setIterator(iterators.Right).forEach(function(item){
                models.push(item.value.model);
            });
            expect(models.length).toEqual(5);
            expect(models.join(",")).toEqual("Roadster,335i,Aventador,Model S,328i");
        });
    });



});
