
describe("mjs.util.LinkedList", function(){

    var $ = mjs, list;

    $.require("mjs/util/LinkedList");
    $.require("mjs/fixtures/cars");

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

    describe("LinkedList.iterator.forEach()", function(){

    });

    describe("LinkedList.rightIterator.forEach()", function(){

    })
});
