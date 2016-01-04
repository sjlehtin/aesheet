var isInt = function (value, method) {
    "use strict";
    /* Checking if a number is an integer
     *
     *  http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
     **/

    if (method === undefined) {
        method = parseInt;
    }
    if (isNaN(value)) {
        return false;
    }
    if ((value|0) === method(value)) {
        return true;
    }
    return false;
};

var isFloat = function (value) {
    return isInt(value, parseFloat);
    "use strict";
    /* Checking if a number is an integer
     *
     *  http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
     **/
    if (isNaN(value)) {
        return false;
    }
    if ((value|0) === parseInt(value)) {
        return true;
    }
    return false;
};

module.exports = {
    'isInt': isInt,
    'isFloat': isFloat
}