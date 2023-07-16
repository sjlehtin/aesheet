const React = require("react");

var exports = function () {
    "use strict";

    var isInt = function (value) {
            /* Checking if a number is an integer
             *
             *  http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
             **/
            if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value)) {
                return true;
            }
            return false;
        };

    const magazineWeight = (wpn, mag) => {
        let magWeight = 0
        magWeight += parseFloat(wpn.base.magazine_weight)
        // Ammo has weight in grams. Estimate cartridge weighs 1.5 as
        // much as the bullet, based on 7.62x51 Nato caliber.
        magWeight += (parseFloat(wpn.ammo.weight) * 0.001 * 2.5) * parseInt(mag.current)
        return magWeight;
    }

    const itemWeight = (item) => {
        const size = item.size ?? 1
        return parseFloat(item.base.weight) *
                parseFloat(item.quality.weight_multiplier ?? item.quality.mod_weight_multiplier ?? 1) *
            Math.pow(3, (size - 1))
    }

    return {
        isInt: isInt,

        magazineWeight: magazineWeight,
        itemWeight: itemWeight,

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
            if (value < 0) {
                return Math.floor(value);
            } else {
                return Math.ceil(value);
            }
        },

        /* Like excel rounddown, rounds away from zero. */
        rounddown: function (value) {
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