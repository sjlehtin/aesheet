import { GenericItem, SheetFirearm, SheetFirearmMagazine } from "./api";

export function isInt(value: any) {
  /* Checking if a number is an integer
   *
   *  http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
   **/
  return /^([-+])?([0-9]+|Infinity)$/.test(value);
}

export function magazineWeight(wpn: SheetFirearm, mag: SheetFirearmMagazine) {
  let magWeight = 0;
  magWeight += parseFloat(wpn.base.magazine_weight);

  const ammoLeftInMagazine = parseInt(mag.current);

  let cartridgeWeight = 0
  if (isFloat(wpn.ammo.cartridge_weight)) {
    cartridgeWeight = parseFloat(wpn.ammo.cartridge_weight ?? "0") * 0.001
  } else {
    // Ammo has weight in grams. Estimate cartridge weighs 1.5 as
    // much as the bullet, based on 7.62x51 Nato caliber.
    const ammoWeight = parseFloat(wpn.ammo.weight) * 0.001;
    cartridgeWeight = ammoWeight * 2.5
  }

  magWeight += cartridgeWeight * ammoLeftInMagazine;
  return magWeight;
}

export function itemWeight(item: GenericItem) {
  const size = item.size ?? 1;
  return (
    parseFloat(item.base.weight) *
    parseFloat(
      item.quality.weight_multiplier ?? item.quality.mod_weight_multiplier ?? 1,
    ) *
    Math.pow(3, size - 1)
  );
}

export function isFloat(value: any) {
  if (typeof value === "number") {
    return true;
  }
  if (Number.isNaN(parseFloat(value))) {
    return false;
  }
  if (isInt(value)) {
    return true;
  }
  return /\d\d*(\.\d\d*)?/.test(value);
}

/* Like excel ROUNDUP, rounds away from zero. */
export function roundup(value: number) {
  if (value < 0) {
    return Math.floor(value);
  } else {
    return Math.ceil(value);
  }
}

/* Like excel ROUNDDOWN, rounds towards zero. */
export function rounddown(value: number) {
  if (value < 0) {
    return Math.ceil(value);
  } else {
    return Math.floor(value);
  }
}

export function renderInt(value: number) {
  if (value !== null) {
    if (value >= 0) {
      return "+" + value;
    } else {
      return value.toString();
    }
  } else {
    return "";
  }
}

export function getCounteredPenalty(penalty: number, counter: number) {
  // If the counter is negative, assume it is more penalty.
  if (counter < 0) {
    return counter;
  }
  // If the penalty is actually bonus, counter doesn't do anything.
  if (penalty > 0) {
    return 0;
  }
  return Math.min(counter, -penalty);
}
