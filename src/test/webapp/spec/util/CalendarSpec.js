
describe("mjs.util.Calendar", function(){

    var $ = mjs, Calendar;
    
    $.require("mjs/util/Calendar");
    
    Calendar = $.util.Calendar;
    $.log("Calendar").log($.util.Calendar);
    
    beforeEach(function() {
        Calendar.gmt = false;
    });

    describe("getMonthIndex()", function(){
        it("should return the correct zero-based index for the specified month abbreviation", function() {
            expect(0).toEqual(Calendar.getMonthIndex("Jan"));
            expect(1).toEqual(Calendar.getMonthIndex("Feb"));
            expect(2).toEqual(Calendar.getMonthIndex("Mar"));
            expect(3).toEqual(Calendar.getMonthIndex("Apr"));
            expect(4).toEqual(Calendar.getMonthIndex("May"));
            expect(5).toEqual(Calendar.getMonthIndex("Jun"));
            expect(6).toEqual(Calendar.getMonthIndex("Jul"));
            expect(7).toEqual(Calendar.getMonthIndex("Aug"));
            expect(8).toEqual(Calendar.getMonthIndex("Sep"));
            expect(9).toEqual(Calendar.getMonthIndex("Oct"));
            expect(10).toEqual(Calendar.getMonthIndex("Nov"));
            expect(11).toEqual(Calendar.getMonthIndex("Dec"));
        });



        it("should return the correct zero-based index for the specified month name", function() {
            expect(0).toEqual(Calendar.getMonthIndex("January"));
            expect(1).toEqual(Calendar.getMonthIndex("February"));
            expect(2).toEqual(Calendar.getMonthIndex("March"));
            expect(3).toEqual(Calendar.getMonthIndex("April"));
            expect(4).toEqual(Calendar.getMonthIndex("May"));
            expect(5).toEqual(Calendar.getMonthIndex("June"));
            expect(6).toEqual(Calendar.getMonthIndex("Jul"));
            expect(7).toEqual(Calendar.getMonthIndex("August"));
            expect(8).toEqual(Calendar.getMonthIndex("September"));
            expect(9).toEqual(Calendar.getMonthIndex("October"));
            expect(10).toEqual(Calendar.getMonthIndex("November"));
            expect(11).toEqual(Calendar.getMonthIndex("December"));
        });
    });


    describe("addYears()", function(){
        it("should increase the year in the specified date by the specified years", function() {
            var d = new Date(1968, 10, 8);
            Calendar.addYears(d, 10);
            expect(1978).toEqual(d.getFullYear());
            Calendar.addYears(d, 40);
            expect(2018).toEqual(d.getFullYear());
        });

        it("should decrease the specified date's year when the number of years is a negative number", function() {
            var d = new Date(1968, 10, 8);
            d.setFullYear(1968);
            Calendar.addYears(d, -3);
            expect(1965).toEqual(d.getFullYear());
        });
    });


    describe("addMonths()", function(){
        it("should increase the month in the specified date by the specified number of months", function() {

            var tests = [
                {expected: 11, monthsToAdd: 1},
                {expected: 9, monthsToAdd: 35}
            ], d = null;

            tests.forEach(function(values) {
                d = new Date(1968, 10, 8);
                Calendar.addMonths(d, values.monthsToAdd);
                expect(values.expected).toEqual(d.getMonth());
            });
        });

        it("should change the date's year when the month increase pushes the date to another calendar year", function(){
            var d = new Date(1968, 10, 8);
            Calendar.addMonths(d, 35);
            expect(1971).toEqual(d.getFullYear());
        });
    });


    describe("addDays()", function(){
        it("should increase the specified date's date property by the specified number of days", function(){
            var tests = [
                {expected: 9, daysToAdd: 1},
                {expected: 1, daysToAdd: 23}
            ], d = null;

            tests.forEach(function(values) {
                d = new Date(1968, 10, 8);
                Calendar.addDays(d, values.daysToAdd);
                expect(values.expected).toEqual(d.getDate());
            });

        });

        it("should change the date's month when the day increase pushes the date to another calendar month", function(){
            var d = new Date(1968, 10, 8);
            Calendar.addDays(d, 35);
            expect(11).toEqual(d.getMonth());
        });
    });


    describe("addHours()", function(){
        it("should increase the specified date's hours property by the specified number of hours", function(){
            var tests = [
                {expected: 16, add: 1},
                {expected: 2, add: 11}
            ], d = null;

            tests.forEach(function(values) {
                d = new Date(1968, 10, 8, 15, 3);
                Calendar.addHours(d, values.add);
                expect(values.expected).toEqual(d.getHours());
            });


            d = new Date(1968, 10, 8, 15, 3);
            Calendar.addHours(d, 24);
            expect(9).toEqual(d.getDate());
            d = new Date(1968, 10, 8, 15, 3);
            Calendar.addHours(d, 720);
            expect(11).toEqual(d.getMonth());
            d = new Date(1968, 10, 8, 15, 3);
            Calendar.addHours(d, 1500);
            expect(1969).toEqual(d.getFullYear());
        });
    });


    describe("addMinutes()", function(){
        it("should increase the specified date's minutes property by the specified number of minutes", function(){
            var tests = [
                {expected: 4, add: 1},
                {expected: 3, add: 60}
            ], d = null;

            tests.forEach(function(values) {
                d = new Date(1968, 10, 8, 15, 3);
                Calendar.addMinutes(d, values.add);
                expect(values.expected).toEqual(d.getMinutes());
            });


            d = new Date(1968, 10, 8, 15, 3);
            Calendar.addMinutes(d, 1440);
            expect(9).toEqual(d.getDate());
        });
    });

});
