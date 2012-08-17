

describe("Object Namespace functions from mjs/core/oop.js", function(){

    var $ = mjs;

    $.require("mjs/core/oop");

    var that = {
        id: 1239,
        age: 24,
        city: 'Dallas',
        state: 'Texas',
        ssn: '555-55-0001',
        firstName: 'John',
        lastName: 'Smith',
        hash: function(){
            return (this.age + this.id) * 13;
        }
    };

    describe("Object.hash", function(){
        it("if the input is a String, should simply return the input", function(){
            expect("ssn").toEqual(Object.hash("ssn"));
        });

        it("if the input implements hash(), should return the result of the hash() method", function(){
            expect(16419).toEqual(Object.hash(that));
        });
    });
});
