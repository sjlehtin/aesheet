export function isInt(value) {
        /* Checking if a number is an integer
         *
         *  http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
         **/
        if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value)) {
            return true;
        }
        return false;
}

export function magazineWeight(wpn, mag) {
    let magWeight = 0
    magWeight += parseFloat(wpn.base.magazine_weight)
    // Ammo has weight in grams. Estimate cartridge weighs 1.5 as
    // much as the bullet, based on 7.62x51 Nato caliber.
    magWeight += (parseFloat(wpn.ammo.weight) * 0.001 * 2.5) * parseInt(mag.current)
    return magWeight;
}

export function itemWeight(item) {
    const size = item.size ?? 1
    return parseFloat(item.base.weight) *
            parseFloat(item.quality.weight_multiplier ?? item.quality.mod_weight_multiplier ?? 1) *
        Math.pow(3, (size - 1))
}

export function isFloat(value) {
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

/* Like excel ROUNDUP, rounds away from zero. */
export function roundup(value) {
    if (value < 0) {
        return Math.floor(value);
    } else {
        return Math.ceil(value);
    }
}

/* Like excel ROUNDDOWN, rounds towards zero. */
export function rounddown(value) {
    if (value < 0) {
        return Math.ceil(value);
    } else {
        return Math.floor(value);
    }
}

export function toObject(array) {
    var map = {};
    for (let obj of array) {
        map[obj] = 1;
    }
    return map;
}

export function renderInt (value) {
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

