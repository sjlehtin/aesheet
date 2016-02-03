
var exports = function () {
    "use strict";

    var isInt = function (value) {
            /* Checking if a number is an integer
             *
             *  http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
             **/

            if (isNaN(value)) {
                return false;
            }
            if ((value | 0) === parseInt(value)) {
                return true;
            }
            return false;
        };

    return {
        isInt: isInt,

        isFloat: function (value) {
            if (typeof(value) === "number") {
                return true;
            }
            if (isNaN(value)) {
                return false;
            }
            if (isInt(value)) {
                return true;
            }
            if (/\d\d*(\.\d\d*)?/.test(value)) {
                return true;
            }
            return false;
        },
        /* Like excel roundup, rounds away from zero. */
        roundup: function (value) {
            "use strict";
            if (value < 0) {
                return Math.floor(value);
            } else {
                return Math.ceil(value);
            }
        },

        /* Like excel roundup, rounds away from zero. */
        rounddown: function (value) {
            "use strict";
            if (value < 0) {
                return Math.ceil(value);
            } else {
                return Math.floor(value);
            }
        },

        toObject: function (array) {
            var map = {};
            for (let obj of array) {
                map[obj] = 1;
            }
            return map;
        },

        renderInt: function (value) {
            if (value !== null) {
                if (value >= 0) {
                    return "+" + value;
                } else {
                    return value;
                }
            } else {
                return '';
            }
        }
    }
}();

module.exports = exports;