

describe("mjs.util.HashMap", function(){

    var $ = mjs, details;
    var that = {
        ssn: "XXX-XX-1111",
        age: 30,
        firstName: 'John',
        lastName: 'Smith'
    };

    $.require("mjs/util/HashMap");


    beforeEach(function(){
        details = new $.util.HashMap();
    });


    it("should allow you to add and retrieve a set key/value pairs with put()/get()", function(){
        var ssn = "XXX-XX-XX90";
        details.put("ssn", ssn);

        expect(ssn).toEqual(details.get("ssn"));
    });


    it("should allow you to add a set of key/value pairs with putAll() and retrieve any of them with get()", function(){
        details.putAll(that);
        expect(that.ssn).toEqual(details.get("ssn"));
        expect(that.age).toEqual(details.get("age"));
        expect(that.firstName).toEqual(details.get("firstName"));
        expect(that.lastName).toEqual(details.get("lastName"));
    });


    it("should support using any Object as a key, as long as that Object correctly implements hash()", function(){
        var key = {
            createDate: new Date().getTime(),
            createdById: 1,
            subjectId: 34,
            hash: function(){
                return (this.createdById * 7) + (this.subjectId * 13) + this.createDate;
            }
        };
        var key2 = {
            hash: function(){
                return (key.createdById * 7) + (key.subjectId * 13) + key.createDate;
            }
        };
        var key3 = {
            hash: function(){
                return 11;
            }
        };

        details.put(key, that);
        expect(that.ssn).toEqual(details.get(key).ssn);
        expect(that.ssn).toEqual(details.get(key2).ssn);
        expect(details.get(key3)).toBeUndefined();
    });


    it("should have a truly private _items property that cannot be accessed outside the class", function(){
       try {
           $.log(details._items);
           this.fail("We should not reach this point.");
       } catch(e){
           $.log("[HashMap._items] " + e.message);
       }
    });



    describe("size()", function(){
        it("should return the correct number of items in the map", function(){
            details.putAll(that);
            expect(4).toEqual(details.size());
            details.put("rating", "A+");
            expect(5).toEqual(details.size());
        });

        it("should return zero for an empty HashMap", function(){
            expect(0).toEqual(new $.util.HashMap().size());
        })
    });


    describe("clear()", function(){
        it("should remove all items in the map", function(){
            details.putAll(that);
            expect(4).toEqual(details.size());  // A control
            details.clear();
            expect(0).toEqual(details.size());
        });
    });


    describe("keys()", function(){
        it("should return an array of the keys in the map", function(){
            details.putAll(that);
            expect(Array.isArray(details.keys())).toBeTruthy();
            expect(4).toEqual(details.keys().length);
            expect(details.keys().contains("ssn")).toBeTruthy();
            expect(details.keys().contains("firstName")).toBeTruthy();
            expect(details.keys().contains("lastName")).toBeTruthy();
            expect(details.keys().contains("age")).toBeTruthy();
        });
    });


    describe("values()", function(){
        it("should return an array of the values in the map", function(){
            details.putAll(that);
            expect(Array.isArray(details.values())).toBeTruthy();
            expect(4).toEqual(details.values().length);
            expect(details.values().contains(that.ssn)).toBeTruthy();
            expect(details.values().contains(that.firstName)).toBeTruthy();
            expect(details.values().contains(that.lastName)).toBeTruthy();
            expect(details.values().contains(that.age)).toBeTruthy();
        });
    });


    describe("forEach()", function(){
        it("should execute a function for each item in the map", function(){
        });
    });
});
