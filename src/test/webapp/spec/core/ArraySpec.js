describe("Array.prototype", function(){

    var $ = mjs;
    
    $.require("mjs/core/arrays");

    var cities = [ "Denton", "Austin", "Dallas", "Fairfax", "Amsterdam", "Brisbane"];
    var otherCities = ['Denver', 'Amsterdam', 'Calgary', 'Austin', 'Brisbane', 'Denton'];

    function contains(list, value){
        var items = {}, result = {}, i, item;
        for (i = 0; i < list.length; i++){
            item = list[i];
            items[item] = item;
        }
        return items[value] !== undefined;
    }

    describe("copy()", function(){
        it("should copy the contents of the current array to another", function(){
            var result = [];
            cities.copy(result);

            for (var i = 0; i < result.length; ++i){
                expect(result[i]).toEqual(cities[i]);
            }
            expect(result.length).toEqual(cities.length);
        });

        it("should copy the requested slice from the current array to another", function(){
            var result = [];
            cities.copy(result, 2, 3);

            expect(result[0]).toEqual(cities[2]);
            expect(result[1]).toEqual(cities[3]);
            expect(result[2]).toEqual(cities[4]);
            expect(result.length).toEqual(3);
        });

        it("should copy from startIndex to the end of the current array if no copy length is specified", function(){
            var result = [];
            cities.copy(result, 2);

            expect(result[0]).toEqual(cities[2]);
            expect(result[1]).toEqual(cities[3]);
            expect(result[2]).toEqual(cities[4]);
            expect(result[3]).toEqual(cities[5]);
            expect(result.length).toEqual(4);
        });
    });

    describe("contains()", function(){
        var that = { name: "John" };
        var items = [{}, { id: 2 }, that, null];

        it("should return true if the specified element is present in the array", function(){
            expect(cities.contains("Dallas")).toBeTruthy();
        });

        it("should return false if the specified element is not present in the array", function(){
            expect(cities.contains("Denver")).toBeFalsy();
        });

        it("will not check equality of object content", function(){
            expect(items.contains({})).toBeFalsy();
            expect(items.contains({ id: 2 })).toBeFalsy();
        });

        it("will recognize object identity", function(){

            expect(items.contains(that)).toBeTruthy();
        });

        it("will recongize nulls in the array and return true", function(){
            expect(items.contains(null)).toBeTruthy();
        });
    });


    describe("size()", function(){
        it("should return the length of the array", function(){
            expect(cities.size()).toEqual(6);
            expect([].size()).toEqual(0);
        })
    });


    describe("difference()", function(){

        it("should return a new array containing only the elements present either in the current array or the specified one, but not both", function(){
            var result = ["Denver","Dallas","Denton"].difference(["Denver","Dallas"]);
            expect(result.length).toEqual(1);
            expect(result[0]).toEqual("Denton");

            result = [1,2,5,15].difference([2,8]);
            result.sort();
            expect(result.length).toEqual(4);
            expect(contains(result, 15)).toBeTruthy();
            expect(contains(result, 5)).toBeTruthy();
            expect(contains(result, 1)).toBeTruthy();
            expect(contains(result, 8)).toBeTruthy();
            expect(contains(result, 2)).toBeFalsy();
        });

        it("will return all of the current array's elements if the specified array is empty", function(){
            var result = otherCities.difference([]);
            expect(result.length).toEqual(otherCities.length);
            expect(result.pop()).toEqual("Denton");
        });

    });


    describe("intersection()", function(){
        it("should return a new array containing only elements present in both the current array and the specified array", function(){
            var result = [1,2,5.6].intersection([1,7,8,9,15,22]);
            expect(result.length).toEqual(1);
            expect(result[0]).toEqual(1);

            result = [1,2,5,6].intersection([1,2,8,9,6,22]);
            expect(result.length).toEqual(3);
            expect(result.join(",")).toEqual("1,2,6");
        });

        it("should return an empty array if either array in empty", function(){
            var result = [1,2,5.6].intersection([]);
            expect(result.length).toEqual(0);
        })
    });


    describe("union()", function(){
        it("should return a new array containing the unique elements in the current array plus all specified arrays", function(){
            var list = [1,2,4,7];
            var result = list.union([3,4]).sort();
            expect(result.join(",")).toEqual("1,2,3,4,7");

            result = ["Denton","Dallas"].union(["San Antonio","Denton"],["San Antonio", "Dallas", "Denver"]);
            expect(result.join(",")).toEqual("Denton,Dallas,San Antonio,Denver");
        });
    });


    describe("unique()", function(){
        it("should return a new array containing the unique elements in the current array", function(){
            var list = [1,2,4,5,5,4,6];
            var result = list.unique();
            expect(result.join(",")).toEqual("1,2,4,5,6");

            list = ["Denton","Dallas"].concat(["San Antonio","Denton"]).concat(["San Antonio", "Dallas", "Denver"]);
            result = list.unique();
            expect(result.join(",")).toEqual("Denton,Dallas,San Antonio,Denver");
        });
    });

    describe("flatten()", function(){
        var list = [
            ['a','b','c',[0,5,6]],
            [1,2,3,4,5],
            ["Fairfax","Austin","Dallas",[0,3,4]]
        ];
        it("should return a new array condensed to one-dimension", function(){
            var result = list.flatten();
            $.log("flatten").log(result);
            expect(result.length).toEqual(17);
            expect(result.join(",")).toEqual("a,b,c,0,5,6,1,2,3,4,5,Fairfax,Austin,Dallas,0,3,4");
        });
    });

    describe("insert()", function(){
        it("should insert the specified element(s) at the specified index", function(){
            expect([1,2,4,5].insert({ items: 3, index: 2 }).join(",")).toEqual("1,2,3,4,5");
            expect([1,2,4,5].insert({ items: ['a','b','c'], index: 2 }).join(",")).toEqual("1,2,a,b,c,4,5");
        });
    });

    describe("toEach()", function(){
        it("should copy array values to each property in the specified object, in the order in which they are declared.", function(){
            var that = [1,2,4,5].toEach({ id: null, index: null });
            expect(that.id).toEqual(1);
            expect(that.index).toEqual(2);
            expect($.decorate(that).size()).toEqual(2);
        });
    });
});