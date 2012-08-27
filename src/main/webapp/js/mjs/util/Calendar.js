(function($) {

    $.require("mjs/core/StringBuilder");

    var $public,
        internalDate = new Date(),
        monthNames = null, daysOfWeek = null,
        constants = {};

    function setInternalDate(year, month, day) {
        internalDate.setYear(year);
        internalDate.setMonth(month);
        internalDate.setDate(day);
    }

    function getDateProperty(/* Date */ d, property) {
        if ($public.gmt) return d["getUTC" + property]();
        return d["get" + property]();
    }

    function setDateProperty(/* Date */ d, property, value) {
        if ($public.gmt) d["setUTC" + property](value);
        d["set" + property](value);
    }

    constants.secPerHour = 60 * 60;
    constants.secPerDay = constants.secPerHour * 24;
    constants.secPerYear = constants.secPerDay * 365;
    constants.secPerLeapYear = constants.secPerYear + constants.secPerDay;


    monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    /**
     *
     */
    $public = {
        gmt:true,
        currentDate:new Date(),

        addYears:function (date, years) {
            setDateProperty(date, "FullYear", (getDateProperty(date, 'FullYear') + years));
        },
        subtractYears:function (date, years) {
            setDateProperty(date, "FullYear", (getDateProperty(date, 'FullYear') - years));
        },
        addMonths:function (date, months) {
            setDateProperty(date, "Month", (getDateProperty(date, 'Month') + months));
        },
        subtractMonths:function (date, months) {
            setDateProperty(date, "Month", (getDateProperty(date, 'Month') - months));
        },
        addDays:function (date, days) {
            setDateProperty(date, "Date", (getDateProperty(date, 'Date') + days));
        },
        subtractDays:function (date, days) {
            setDateProperty(date, "Date", (getDateProperty(date, 'Date') - days));
        },
        addHours:function (date, hours) {
            setDateProperty(date, "Hours", (getDateProperty(date, 'Hours') + hours));
        },
        subtractHours:function (date, hours) {
            setDateProperty(date, "Hours", (getDateProperty(date, 'Hours') - hours));
        },
        addMinutes:function (date, minutes) {
            setDateProperty(date, "Minutes", (getDateProperty(date, 'Minutes') + minutes));
        },
        subtractMinutes:function (date, minutes) {
            setDateProperty(date, "Minutes", (getDateProperty(date, 'Minutes') - minutes));
        },
        addSeconds:function (date, sec) {
            setDateProperty(date, "Seconds", (getDateProperty(date, 'Seconds') + seconds));
        },
        subtractSeconds:function (date, sec) {
            setDateProperty(date, "Seconds", (getDateProperty(date, 'Seconds') - seconds));
        },


        /**
         * Returns one of the following:  <ul><li> A positive number if a > b</li><li>0 if a == b</li><li>A negative number if a < b</li></ul>
         * This function takes only Dates, not date strings.  The task of parsing date strings can be left to a wrapper function that might include
         * the desired format to use when parsing.
         *
         * @param a A Date
         * @param b A Date
         */
        compareDates:function (a, b) {
            return a.getTime() - b.getTime();
        },


        /**
         *  Returns the day of the week of the first day of the specified month.
         */
        getFirstDay:function (year, month) {
            var firstDate = new Date(year, month, 1);
            return firstDate.getDay();
        },


        /**
         *  Returns the number of days in the month, by returning the day of the month of the last day--e.g., 31 for July
         */
        getMonthLen:function (year, month) {
            var nextMonth = new Date(year, month + 1, 1);
            nextMonth.setHours(nextMonth.getHours() - 3);
            return nextMonth.getDate();
        },


        /**
         *
         */
        isCurrentDate:function (year, /* int */ month, /* int */ day) {
            var c = $public.currentDate, d = null;
            if (arguments[0] instanceof Date) {
                d = arguments[0];
                return (c.getFullYear() == d.getFullYear() && c.getMonth() == d.getMonth() && c.getDate() == d.getDate());
            }
            return (c.getFullYear() == year && c.getMonth() == month && c.getDate() == day);
        },

        getPreviousMonth:function (/* int */ month) {
            month = month - 1;
            if (month < 0) month = 11;
            return month;
        },

        getNextMonth:function (/* int */ month) {
            month = month + 1;
            if (month > 11) month = 0;
            return month;
        },

        isSaturday:function (/* int */year, /* int */month, /* int */day) {
            setInternalDate(year, month, day);
            return new Date(year, month, day).getDay() == 6; // Using internalDate caused a false positive for Feb 01, 2008, at least when used within the loop in DatePicker.initializeMonth().
        },

        isSunday:function (/* int */year, /* int */month, /* int */day) {
            setInternalDate(year, month, day);
            return new Date(year, month, day).getDay() == 0;
        },

        getLastSunday:function (/* int */year, /* int */month, /* int */day) {
            setInternalDate(year, month, day);
            return internalDate.getDate() - internalDate.getDay();
        },

        getNextSaturday:function (/* int */year, /* int */month, /* int */day) {
            setInternalDate(year, month, day);
            return internalDate.getDate() + (6 - internalDate.getDay());
        },


        /**
         * Returns a three-letter abbreviation for the month name.
         */
        getShortMonthName:function (index) {
            return monthNames[index].substring(0, 3);
        },

        getMonthIndex:function (str) {
            for (var i = 0; i < monthNames.length; i++) {
                if (monthNames[i].startsWith(str)) return i;
            }
        },

        getMonths:function () {
            return monthNames;
        },
        getWeekDays:function () {
            return daysOfWeek;
        },
        getMonthName:function (index) {
            if (!index) index = getDateProperty(new Date(), "Month");
            return monthNames[index];
        },
        getDayOfWeek:function (index) {
            if (!index) index = getDateProperty(new Date(), "Day");
            return daysOfWeek[index];
        },

        getFullYear:function (/* Date */ d) {
            return getDateProperty(d, "FullYear");
        },
        getMonth:function (/* Date */ d) {
            return getDateProperty(d, "Month");
        },
        getDay:function (/* Date */ d) {
            return getDateProperty(d, "Day");
        },
        getDate:function (/* Date */ d) {
            return getDateProperty(d, "Date");
        },
        getHours:function (/* Date */ d) {
            return getDateProperty(d, "Hours");
        },
        getMinutes:function (/* Date */ d) {
            return getDateProperty(d, "Minutes");
        },
        getSeconds:function (/* Date */ d) {
            return getDateProperty(d, "Seconds");
        },
        getMilliseconds:function (/* Date */ d) {
            return getDateProperty(d, "Milliseconds");
        },

        getDateInstance:function (/* Date */ d) {
            var day = $public.getDay(d), m = $public.getMonth(d);
            return {
                component:d,
                time:d.getTime(),
                year:$public.getFullYear(d),
                monthIndex:m,
                dayIndex:day,
                dayOfMonth:$public.getDate(d),
                hours:$public.getHours(d),
                minutes:$public.getMinutes(d),
                sec:$public.getSeconds(d),
                ms:$public.getMilliseconds(d),
                era:'CE',
                month:monthNames[m],
                day:daysOfWeek[day]
            };
        }
    };

    $.util.Calendar = $public;


})(mjs);