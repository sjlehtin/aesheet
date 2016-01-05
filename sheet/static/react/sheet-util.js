
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
        }
    }
}();

module.exports = exports;