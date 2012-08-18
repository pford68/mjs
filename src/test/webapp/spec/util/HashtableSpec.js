

describe("mjs.util.Hashtable", function(){

    var $ = mjs,
        recordArray,
        records;

    $.require("mjs/util/Hashtable");


    recordArray = [
        { make: "Lamborghini", model: "Countach", year: 1989, color: "black" },
        { make: "Lamborghini", model: "Aventador", year: 1989, color: "silver" },
        { make: "Pontiac", model: "Solstice", year: 2006, color: 'silver' },
        { make: "BMW", model: "328i", year: 2012, color: "black" },
        { make: "BMW", model: "335i", year: 2011, color: "silver" },
        { make: "Tesla", model: "Model S", year: 2012, color: "black" },
        { make: "Tesla", model: "Roadster", year: 2012, color: "magenta" },
        { make: "Porsche", model: "Boxster", year: 2012, color: 'silver' }
    ];

    beforeEach(function(){
        records = new $.util.Hashtable("{make}/{model}", recordArray);
    });


    it("should convert an array of objects to a hashtable, allowing items to be retrieved by hashes", function(){
        expect(records.get("BMW/328i")).toEqual(recordArray[3]);
        expect(records.get("BMW/335i")).toEqual(recordArray[4]);
        expect(records.get("Porsche/Boxster")).toEqual(recordArray[7]);
    });

    it("should allow us to add one item at a time to the table and to retrieve it later", function(){
        var bentley = { make: 'Bentley', model: 'Continental', color: 'Midnight Green', year: 2012 };
        records.add(bentley);
        expect(records.size()).toEqual(9);
        expect(records.get("Bentley/Continental").color).toEqual("Midnight Green");
        expect(records.get("Bentley/Continental")).toEqual(bentley);
    });


    describe("The constructor", function(){
        it("should require a key template", function(){
           var t = null;
           try {
               t = new $.util.Hashtable();
               this.fail("We should not reach this point");
           } catch(e){
               $.log("[Hashtable constructor] The exception was caught.");
               expect(t).toBeNull();
           }
        });
    });



    describe("forEach()", function(){
        it("should execute the specified function for each item in the table", function(){
            records.forEach(function(item, i){
                item.electric = i.match(/^Tesla/);
            });
            expect(records.get("Tesla/Roadster").electric).toBeTruthy();
            expect(records.get("Tesla/Model S").electric).toBeTruthy();
            expect(records.get("BMW/328i").electric).toBeFalsy();
        });

        it("should make the current item, the current key, and the hashtable available to the function", function(){
            records.forEach(function(item){
                if (item.make == 'BMW' && item.model == "328i"){
                    expect(arguments[1]).toEqual("BMW/328i");
                }
                expect(arguments[2]).toEqual(records);
            })
        });
    });


    describe("size()", function(){
        it("should return the number items in the Hashtable", function(){
            expect(records.size()).toEqual(8);

            var t = new $.util.Hashtable("{male}/{model}");
            expect(t.size()).toEqual(0);
            t.add({ make: 'Chevrolet', model: "Impala", year: 2010, color: 'red'});
            expect(t.size()).toEqual(1);
        })
    });

    describe("toArray()", function(){
        it("should return the items in the table as an array", function(){
            var list = records.toArray();
            expect(Array.isArray(list)).toBeTruthy();
            expect(list.length).toEqual(8);
        })
    });


    describe("remove", function(){
        it("should remove an item from the table", function(){
            records.remove("BMW/335i");
            expect(records.size()).toEqual(7);
            records.remove("Lamborghini/Countach");
            expect(records.size()).toEqual(6);
        })
    });


    describe("containsKey", function(){
        it("should return true if the specified key is present in the table", function () {
            expect(records.containsKey("BMW/335i")).toBeTruthy();
        });

        it("should return false if the key is not present in the table", function () {
            expect(records.containsKey("BMW/336i")).toBeFalsy();
        });
    });

});                                                                             