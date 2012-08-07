describe("mjs.StringBuilder", function(){

    var $ = mjs;

    $.require("mjs/core/StringBuilder");

    var StringBuilder = $.StringBuilder;

    it("should be able to take a constructor argument, which will be the first item in the buffer", function(){
        var sb = new StringBuilder("Arma virumque");
        sb.append(" cano").append(" ").append("Trojiae que primus").append("...");
        expect("Arma virumque cano Trojiae que primus...").toEqual(sb.toString());
    });

    it("should work fine without a constructor argument", function(){
        var sb = new StringBuilder();
        sb.append("Arma virumque").append(" cano").append(" ").append("Trojiae que primus").append("...");
        expect("Arma virumque cano Trojiae que primus...").toEqual(sb.toString());
    });

    describe("append", function(){
        it("should add the specified string to the buffer", function(){
            var sb = new StringBuilder();
            sb.append("Hello").append(", ").append("World").append("!");

            expect("Hello, World!").toEqual(sb.toString());
        });

        it("should support chaining multiple calls", function(){
            var sb = new StringBuilder(), sb2 = new StringBuilder();
            sb.append("Hello").append(", ").append("World").append("!");
            sb2.append("Does").append(" this").append(" work?");

            expect("Hello, World!").toEqual(sb.toString());
            expect("Does this work?").toEqual(sb2.toString());
            expect("Hello, World!").toEqual(sb.toString());
        });
    });

    describe("insert", function(){
        it("should insert the specified string at the specified index of the buffer", function(){
            var sb = new StringBuilder();
            sb.append("This").append(" ").append("another").append(" ").append("test");
            sb.insert(2, "is ");
            expect("This is another test").toEqual(sb.toString());
        })
    });

    describe("deleteAt", function(){
        it("should delete the item at the specified index of the buffer", function(){
            function $test(index, expectedResult) {
                var sb = new StringBuilder();
                sb.append("Hello").append(", ").append("World").append("!");
                sb.deleteAt(index);
                expect(expectedResult).toEqual(sb.toString());
            }

            $test(1, "HelloWorld!");
            $test(3, "Hello, World");
            $test(0, ", World!");
        })
    });

    describe("replaceAt", function(){
        it("should replace the item at the specified index of the buffer with another string", function(){
            var sb = new StringBuilder(), replacement = "?685940";
            sb.append("This").append(" is ").append("another").append("_").append(" ").append("test");
            sb.replaceAt(3, "?685940");
            expect("This is another" + replacement + " test").toEqual(sb.toString());
            sb.replaceAt(5, "test.");
            expect("This is another" + replacement + " test.").toEqual(sb.toString());
        })
    });

    describe("get", function(){
        it("should get the item at the specified index of the buffer", function(){
            var sb = new StringBuilder();
            sb.append("This").append(" is ").append("another").append("_").append(" test");
            expect("another").toEqual(sb.get(2));
        })
    });

    describe("clear", function(){
        it("should clear the buffer", function(){
            var sb = new StringBuilder(), sb2 = new StringBuilder();
            sb.append("What").append("the").append("...?");
            sb2.append("This").append(" should").append(" not").append(" be deleted");
            sb.clear();
            expect("").toEqual(sb.toString());
            expect("This should not be deleted").toEqual(sb2.toString());
        })
    });

    describe("length", function(){
        it("should return the length of the buffer", function(){
            var sb = new StringBuilder(), sb2 = new StringBuilder();
            sb.append("What").append("the").append("...?");
            sb2.append("This").append(" should").append(" not").append(" be deleted");
            sb.clear();
            expect(0).toEqual(sb.length());
            expect(4).toEqual(sb2.length());
        })
    });

    describe("toString", function(){
        it("should build a string from the items in the buffer and return the string", function(){

        })
    });
});
