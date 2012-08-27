
(function($){
    
    $.require("mjs/util/Calendar");
    $.require("mjs/core/StringBuilder");
    $.require("mjs/core/arrays");
    
    var $public,
        Calendar = $.util.Calendar,
        patterns = "M y w W D d F E a H k K h m s S z Z G".split(/\s+/),
        $month = null,
        DEFAULT_FORMAT = "yyyy-MM-dd HH:mm:ss";

    function pad(num, len) {
        len = len || 2;
        num = num + "";
        var count = 0, z = [];
        len = len - num.length;
        while(count++ < len){
            z.push("0");
        }
        z.push(num);
        return z.join("");
    }
    function getParsePosition(str, re) {
        var result = re.exec(str);
        return result != null ? {start: result.index, end: result.index + result[0].length, length: result[0].length} : null;
    }
    function setMonthOffset(monthIndex, parsePosition) {
        var monthName = Calendar.getMonthName(monthIndex);
        if (parsePosition.length > 3 && monthName.length != parsePosition.length) {
            $month = {start: parsePosition.start, end: parsePosition.end, offset: monthName.length - parsePosition.length};
        }
    }
    function $parse(str, parsePosition){
        var offset = 0;
        if ($month != null && parsePosition.start > $month.end) offset = $month.offset; // 2009-07-20:  changed from if (... parsePosition.start > $month.end), from... > $month.start.
        return str.substring(parsePosition.start + offset, parsePosition.end + offset);
    }
    // Takes a format and regular expression and uses them to get the parsePosition
    function $replace(str, format, re, replacement){ return str.replace($parse(str, getParsePosition(format, re)), replacement); }
    // Takes a parsePosition paraameter
    function $$replace(str, parsePosition, replacement){ return str.replace($parse(str, parsePosition), replacement); }

    
    
    $public = {

        parse: function(str, format) {
            if ($.isEmpty(str)) return Calendar.getDateInstance(new Date());
            $month = null;

            format = format || DEFAULT_FORMAT;
            var d = {year:0, month:0, day:0, hours:0, minutes:0, sec:0, ms:0}, 
                parsePosition, matches, 
                c = Calendar, value = "", monthName = "";

            patterns.forEach(function(p){
                matches = format.match(new RegExp(p, ['g']));
                if (!matches || matches.length == 0) return;

                switch(p) {
                    case 'M':
                        parsePosition = getParsePosition(format, /M+/);
                        value = $parse(str, parsePosition);
                        if (parsePosition.length > 2) {
                            d.month = c.getMonthIndex(value.substring(0,3));
                            setMonthOffset(d.month, parsePosition);
                        }
                        else {
                            d.month = $.parseInt(value) - 1;
                        }
                        break;
                    case 'y': d.year = $parse(str, getParsePosition(format, /y+/)); break;
                    case 'w':
                        break;
                    case 'W':
                        break;
                    case 'D':
                        break;
                    case 'd': d.day = $parse(str, getParsePosition(format, /d{1,2}/)); break;
                    case 'F':
                        break;
                    case 'E':
                        break;
                    case 'a': d.am_pm = $parse(str, getParsePosition(format, /a{1,2}/)); break;
                    case 'H': d.hours = $parse(str, getParsePosition(format, /H{1,2}/)); break;  // Hours(0-23)
                    case 'k': d.hours = ($parse(str, getParsePosition(format, /H{1,2}/)) + 1); break;  // Hours(1-24):  increment parse result--e.g., 23 is added as 24
                    case 'K':
                        // Hours(0-11) AM/PM:  I convert 24-hour time to 12-hour, zero-based.
                        value = $parse(str, getParsePosition(format, /K{1,2}/));
                        if (value >= 12 && value < 24) value -= 12;
                        else if (value == 24) value = 0;
                        d.hours = value;
                        break;
                    case 'h':
                        // Hours(1-12) AM/PM:  I convert 24-hour time to 12-hour, one-based.
                        value = $parse(str, getParsePosition(format, /K{1,2}/));
                        if (value > 12) value -= 12;
                        d.hours = value;
                        break;
                    case 'm': d.minutes = $parse(str, getParsePosition(format, /m{1,2}/)); break;
                    case 's': d.sec = $parse(str, getParsePosition(format, /s{1,2}/)); break;
                    case 'S': d.ms = $parse(str, getParsePosition(format, /S{1,3}/)); break;
                    case 'z':
                        break;
                    case 'Z':
                        break;
                    case 'G':
                        break;

                }
            });
            $.log("[$.DateFormat.parse]  " + new $.StringBuilder(d.year).append(":").append(d.month.toString()).append(":").append(d.day).toString());
            return c.getDateInstance(new Date(d.year, d.month, d.day, d.hours, d.minutes, d.sec, d.ms));
        },



        /**
         *
         */
        format: function(date, format) {
            date = date || new Date();
            format = format ||  DEFAULT_FORMAT;
            $month = null;
            var c = Calendar, day = c.getDay(date), month = c.getMonth(date),
                hours = c.getHours(date), minutes = c.getMinutes(date), matches = null, strFormatted = format;

            patterns.forEach(function(p) {
                matches = format.match(new RegExp(p, ['g']));
                if (!matches || matches.length == 0) return;

                switch(p) {
                    case 'M':
                        if (matches.length > 3) {
                            var parsePosition = getParsePosition(format, /M+/);
                            strFormatted = $$replace(strFormatted, parsePosition, c.getMonthName(month));
                            setMonthOffset(c.getMonth(date), parsePosition);
                        }
                        else if (matches.length == 3) strFormatted = $replace(strFormatted, format, /M+/, c.getShortMonthName(month));
                        else strFormatted = $replace(strFormatted, format, /M+/, pad(month + 1));
                        break;
                    case 'y':
                        if (matches.length > 2) strFormatted = $replace(strFormatted, format, /y+/, c.getFullYear(date).toString());
                        else if (matches != null && matches.length > 0) format = $replace(strFormatted, format, /y{1,2}/, (c.getFullYear(date) % 100).toString());
                        break;
                    case 'w': break;
                    case 'W': break;
                    case 'd':
                        if (matches.length > 2) strFormatted = $replace(strFormatted, format, /d+/, c.getDayOfWeek(day));
                        else strFormatted = $replace(strFormatted, format, /d{1,2}/, pad(c.getDate(date)));
                        break;
                    case 'F': break;
                    case 'E':
                        break;
                    case 'a': strFormatted = hours > 11 ? $replace(strFormatted, format, /a{1,2}/, 'PM') : $replace(format, /a{1,2}/, 'AM'); break;
                    case 'H': strFormatted = $replace(strFormatted, format, /H{1,2}/, pad(c.getHours(date))); break;
                    case 'k': strFormatted = $replace(strFormatted, format, /H{1,2}/, pad(c.getHours(date) + 1)); break;
                    case 'K': strFormatted = (hours === 12 || hours === 0) ? 12 : (hours + 12) % 12; break;
                    case 'h': strFormatted = (hours === 12 || hours === 0) ? 12 : ((hours + 12) % 12) + 1; break;
                    case 'm': strFormatted = $replace(strFormatted, format, /m{1,2}/, pad(minutes)); break;
                    case 'S': strFormatted = $replace(strFormatted, format, /S{1,3}/, pad(c.getMilliseconds(date),3)); break;
                    case 's': strFormatted = $replace(strFormatted, format, /s{1,2}/, pad(c.getSeconds(date))); break;
                    case 'Z': break;
                    case 'z': return date.getTimezoneOffset().toString(); break;
                    case 'G': return c.getFullYear(date) >= 0 ? "CE" : "BCE"; break;	// Sadly, we'll have little use for this.
                }
            });

            return strFormatted;
        }
    };


    $.util.DateFormat = $public;
})(mjs);
