
describe("mjs.util.DateFormat", function(){

    var $ = mjs;
    
    $.require("mjs/util/DateFormat");
    
    function logParse(str, format, result) {
        $.log("parse('" + str + "','" + format + "') => " + result.component.toString());
    }

    function log(method, str, format, result) {
        $.log(method + "('" + str + "','" + format + "') => " + result.component.toString());
    }

    function $toString(result) {
        s = "";
        for (var i in result){ s+= i + ": " + result[i]; }
        return s;
    }

    function setUp() {
        $.util.Calendar.gmt = false;
    }

    describe("parse", function() {

        it("should parse the specified date string into a date, using the specified format", function(){
            $.log("[testParse] Note that tests on years with less than 4 digits will fail:  the Date object converts them to years beginning with 1900, so 0001 becomes 1901.");

            var str = "2008-06-13", format = "yyyy-MM-dd", result = null;
            result = $.util.DateFormat.parse(str, format);
            expect(2008).toEqual(result.year);
            expect(5).toEqual(result.monthIndex);
            expect("June").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            logParse(str, format, result);

            str = "Nov-09-1968";
            format = "MMM-dd-yyyy";
            result = $.util.DateFormat.parse(str, format);
            expect(1968).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(9).toEqual(result.dayOfMonth);
            logParse(str, format, result);

            str = "July 4, 1776";
            format = "MMMM d, yyyy";
            result = $.util.DateFormat.parse(str, format);
            expect(1776).toEqual(result.year);
            expect(6).toEqual(result.monthIndex);
            expect("July").toEqual(result.month);
            expect(4).toEqual(result.dayOfMonth);
            logParse(str, format, result);


            str = "May 4, 1776";
            format = "MMMM d, yyyy";
            result = $.util.DateFormat.parse(str, format);
            expect(1776).toEqual(result.year);
            expect(4).toEqual(result.monthIndex);
            expect("May").toEqual(result.month);
            expect(4).toEqual(result.dayOfMonth);
            logParse(str, format, result);


            str = "1000-01-01";
            format = "yyyy-MM-dd";
            result = $.util.DateFormat.parse(str, format);
            expect(1000).toEqual(result.year);
            expect(0).toEqual(result.monthIndex);
            expect("January").toEqual(result.month);
            expect(1).toEqual(result.dayOfMonth);
            logParse(str, format, result);

            str = "10000-12-25";
            format = "yyyyy-MM-dd";
            result = $.util.DateFormat.parse(str, format);
            expect(10000).toEqual(result.year);
            expect(11).toEqual(result.monthIndex);
            expect("December").toEqual(result.month);
            expect(25).toEqual(result.dayOfMonth);
            logParse(str, format, result);


            str = "2004-09-13";
            format = "yyyy-MM-dd";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(8).toEqual(result.monthIndex);
            expect("September").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);


            str = "September 13, 2004";
            format = "MMMM dd, yyyy";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(8).toEqual(result.monthIndex);
            expect("September").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);


            str = "2004/11/13";
            format = "yyyy/MM/dd";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);


            str = "2004-11-13";
            format = "yyyy-MM-dd";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);


            str = "November-13-2004";
            format = "MMMM-dd-yyyy";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);

        });

        it("should work with date/time formats", function(){
            var str = "1843-12-25 22:48", format = "yyyy-MM-dd HH:mm", result = null;
            result = $.util.DateFormat.parse(str, format);
            expect(1843).toEqual(result.year);
            expect(11).toEqual(result.monthIndex);
            expect("December").toEqual(result.month);
            expect(25).toEqual(result.dayOfMonth);
            expect(22).toEqual(result.hours);
            expect(48).toEqual(result.minutes);
            logParse(str, format, result);


            str = "May 31, 2000 22:48:15";
            format = "MMM dd, yyyy HH:mm:ss";
            result = $.util.DateFormat.parse(str, format);
            expect(2000).toEqual(result.year);
            expect(4).toEqual(result.monthIndex);
            expect("May").toEqual(result.month);
            expect(31).toEqual(result.dayOfMonth);
            expect(22).toEqual(result.hours);
            expect(48).toEqual(result.minutes);
            expect(15).toEqual(result.sec);
            logParse(str, format, result);


            str = "September 13, 2004 22:48:15";
            format = "MMMM dd, yyyy HH:mm:ss";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(8).toEqual(result.monthIndex);
            expect("September").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            expect(22).toEqual(result.hours);
            expect(48).toEqual(result.minutes);
            expect(15).toEqual(result.sec);


            str = "2004/11/13 22:48:15";
            format = "yyyy/MM/dd HH:mm:ss";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            expect(22).toEqual(result.hours);
            expect(48).toEqual(result.minutes);
            expect(15).toEqual(result.sec);


            str = "2004-11-13 22:48:15";
            format = "yyyy-MM-dd HH:mm:ss";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            expect(22).toEqual(result.hours);
            expect(48).toEqual(result.minutes);
            expect(15).toEqual(result.sec);


            str = "November-13-2004 22:48:15";
            format = "MMMM-dd-yyyy HH:mm:ss";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            expect(22).toEqual(result.hours);
            expect(48).toEqual(result.minutes);
            expect(15).toEqual(result.sec);

        });


        it("should work with milliseconds", function(){
            var str = "November-13-2004 22:48:15.028", format = "MMMM-dd-yyyy HH:mm:ss.SSS", result = null;
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            expect(22).toEqual(result.hours);
            expect(48).toEqual(result.minutes);
            expect(15).toEqual(result.sec);
            expect(28).toEqual(result.ms);

            str = "November-13-2004 22:48:15.758";
            result = $.util.DateFormat.parse(str, format);
            logParse(str, format, result);
            expect(2004).toEqual(result.year);
            expect(10).toEqual(result.monthIndex);
            expect("November").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            expect(22).toEqual(result.hours);
            expect(48).toEqual(result.minutes);
            expect(15).toEqual(result.sec);
            expect(758).toEqual(result.ms);
        });


        it("should work with AM/PM", function(){
            var str = "2008-06-13 12:00 AM", format = "yyyy-MM-dd KK:mm aa", result = null;
            result = $.util.DateFormat.parse(str, format);
            expect(2008).toEqual(result.year);
            expect(5).toEqual(result.monthIndex);
            expect("June").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            expect(0).toEqual(result.hours);
            logParse(str, format, result);

            $.log("[testParseAmPm] - INFO - Since I am using KK:mm 15:51 should be converted to to 3:51");
            str = "2008-06-13 15:51";
            format = "yyyy-MM-dd KK:mm";
            result = $.util.DateFormat.parse(str, format);
            expect(2008).toEqual(result.year);
            expect(5).toEqual(result.monthIndex);
            expect("June").toEqual(result.month);
            expect(13).toEqual(result.dayOfMonth);
            expect(3).toEqual(result.hours);
            expect(51).toEqual(result.minutes);
            logParse(str, format, result);
        });
    });



    describe("format()", function(){
        /*
         * Note that we cannot use the parameter-less Date() for testing because the test would break the next day.
         */
        it("should transform the specified date into a date string, formatted according to the specified format", function(){
            var date = new Date(2009, 6, 18), format = "yyyy-MM-dd", result = null;
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormat] - INFO - " + result);
            expect("2009-07-18").toEqual(result);

            format = "MMM-dd-yyyy";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormat] - INFO - " + result);
            expect("Jul-18-2009").toEqual(result);

            format = "yyyy/MM/dd";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormat] - INFO - " + result);
            expect("2009/07/18").toEqual(result);
        });


        it("should handle date/time formats", function(){
            var date = new Date(2009, 6, 18, 15, 3), format = "yyyy-MM-dd HH:mm", result = null;
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("2009-07-18 15:03").toEqual(result);

            date = new Date(2009, 8, 1, 12, 59);
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("2009-09-01 12:59").toEqual(result);

            $.log("[testFormatDateTime] - INFO - Testing handling different month names...");
            date = new Date(2009, 7, 1, 15, 3);
            format = "MMM-dd-yyyy HH:mm";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("Aug-01-2009 15:03").toEqual(result);

            date = new Date(2009, 8, 1, 15, 3);
            format = "MMM-dd-yyyy HH:mm";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("Sep-01-2009 15:03").toEqual(result);

            date = new Date(2009, 9, 1, 15, 3);
            format = "MMM-dd-yyyy HH:mm";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("Oct-01-2009 15:03").toEqual(result);

            date = new Date(2009, 10, 1, 15, 3);
            format = "MMM-dd-yyyy HH:mm";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("Nov-01-2009 15:03").toEqual(result);


            $.log("[testFormatDateTime] - INFO - Testing varieties of formats...");
            date = new Date(2009, 10, 1, 15, 3, 18);
            format = "MMM-dd-yyyy HH:mm:ss";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("Nov-01-2009 15:03:18").toEqual(result);

            date = new Date(2009, 10, 1, 15, 3, 18);
            format = "yyyy-MM-dd HH:mm:ss";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("2009-11-01 15:03:18").toEqual(result);

            date = new Date(2009, 10, 1, 15, 3, 18);
            format = "MMMM dd, yyyy HH:mm:ss";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("November 01, 2009 15:03:18").toEqual(result);

            date = new Date(2009, 4, 1, 15, 3, 18);
            format = "MMMM dd, yyyy HH:mm:ss";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("May 01, 2009 15:03:18").toEqual(result);

            date = new Date(2009, 5, 1, 15, 3, 18);
            format = "MMMM dd, yyyy HH:mm:ss";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("June 01, 2009 15:03:18").toEqual(result);

            date = new Date(2009, 10, 1, 15, 3, 18);
            format = "MMMM dd, yyyy HH";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("November 01, 2009 15").toEqual(result);

            date = new Date(2009, 10, 1, 15, 3, 18);
            format = "HH:mm";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatDateTime] - INFO - " + result);
            expect("15:03").toEqual(result);
        });


        it("should handle time-only formats", function(){
            var date = new Date(2009, 10, 1, 15, 3, 18, 758), format = "HH:mm:ss.SSS", result = null;
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatS] - INFO - " + result);
            expect("15:03:18.758").toEqual(result);

            date = new Date(2009, 10, 1, 15, 3, 18, 28);
            format = "HH:mm:ss.SSS";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatS] - INFO - " + result);
            expect("15:03:18.028").toEqual(result);

            date = new Date(2009, 10, 1, 15, 3, 18, 8);
            format = "HH:mm:ss.SSS";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatS] - INFO - " + result);
            expect("15:03:18.008").toEqual(result);

            date = new Date(2009, 10, 1, 15, 3, 18, 28)
            format = "MMMM dd, yyyy HH:mm:ss.SS";
            result = $.util.DateFormat.format(date, format);
            $.log("[testFormatS] - INFO - " + result);
            expect("November 01, 2009 15:03:18.028").toEqual(result);
        });
    });


});
