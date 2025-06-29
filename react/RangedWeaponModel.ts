import { Attribute, SheetRangedWeapon } from "./api"; // import * as util from "./sheet-util";
import SkillHandler from "./SkillHandler";
import { UseType } from "./WeaponModel";
import ValueBreakdown from "./ValueBreakdown";

import { PhysicalWeaponModel } from "./PhysicalWeaponModel";

export default class RangedWeaponModel extends PhysicalWeaponModel {
  static VISION_CHECK_PENALTY_LIMIT = 45;
  static VISION_TARGET_INITIATIVE_PENALTY_LIMIT = 95;
  static VISION_BUMPING_LIMIT = 95;

  #weapon: SheetRangedWeapon;
  #handler: SkillHandler;
  // readonly #darknessDetectionLevel: number;

  readiedBaseI = -1;
  baseCheckBonusForSlowActions = 10;
  extraActionModifier = 10;

  constructor(
    handler: SkillHandler,
    weapon: SheetRangedWeapon,
    // darknessDetectionLevel: number,
  ) {
    super(handler, weapon);
    this.#handler = handler;
    this.#weapon = weapon;
    // this.#darknessDetectionLevel = darknessDetectionLevel;
  }

  roa(_useType: UseType) {
    const roa = this.baseROA();
    roa.multiply(this.skillROAMultiplier(), "from skill");

    if (this.#weapon.base.base_skill.name === "Bow") {
      roa.add(
        this.#handler.skillLevel("Rapid archery") * 0.05,
        "Rapid archery",
      );
    }
    roa.setMaximum(5.0, "Max ROF");
    return roa;
  }

  rof(useType: UseType) {
    return this.roa(useType);
  }

  penaltyCounterStat(): Attribute {
    return Attribute.Fit;
  }

  skillCheck() {
    const gottenCheck = this.#handler.skillCheck(
      this.#weapon.base.base_skill.name,
    );

    if (!gottenCheck) {
      return null;
    }

    const bd = new ValueBreakdown();

    bd.addBreakdown(gottenCheck);

    const unskilledPenalty = -10;

    const missing = this.missingSkills();
    if (missing.length) {
      for (let sk in missing) {
        bd.add(unskilledPenalty, `unskilled (${sk})`);
      }
    }
    return bd;
  }

  targetInitiative() {
    let targetI = this.#weapon.base.target_initiative;
    if (!targetI) {
      targetI = 0;
    }
    return targetI;
  }

  // weaponRangeEffect(toRange, skillHandler) {
  //   // See FirearmControl for more complete documentation.
  //   const shortRangeEffect = {
  //     check: 0,
  //     targetInitiative: 0,
  //     damage: 0,
  //     leth: 0,
  //     name: "Short",
  //   };
  //
  //   // Characters with FIT45+ can extend the E range proportionally (E+ range).
  //   // However, FIT damage and lethality bonuses do not apply at E+ range.
  //   const extremePlusRange = null;
  //
  //   if (!toRange && !isFloat(toRange)) {
  //     return shortRangeEffect;
  //   }
  //   const shortRange = this.shortRange();
  //   const longRange = this.longRange();
  //
  //   if (toRange <= 1) {
  //     // Too close for bow.
  //     return null;
  //   } else if (toRange <= 3) {
  //     return {
  //       check: 40,
  //       targetInitiative: 1,
  //       damage: 1,
  //       leth: 1,
  //       name: "Point-blank",
  //     };
  //   } else if (toRange <= shortRange / 8) {
  //     return {
  //       check: 30,
  //       targetInitiative: 1,
  //       damage: 1,
  //       leth: 1,
  //       name: "XXS",
  //     };
  //   } else if (toRange <= shortRange / 4) {
  //     return {
  //       check: 20,
  //       targetInitiative: 0,
  //       damage: 0,
  //       leth: 0,
  //       name: "Extra-short",
  //     };
  //   } else if (toRange <= shortRange / 2) {
  //     return {
  //       check: 10,
  //       targetInitiative: 0,
  //       damage: 0,
  //       leth: 0,
  //       name: "Very short",
  //     };
  //   } else if (toRange <= shortRange) {
  //     return shortRangeEffect;
  //   } else if (toRange <= this.mediumRange()) {
  //     return {
  //       check: -10,
  //       targetInitiative: 0,
  //       damage: 0,
  //       leth: 0,
  //       name: "Medium",
  //     };
  //   } else if (toRange <= longRange) {
  //     return {
  //       check: -20,
  //       targetInitiative: 0,
  //       damage: 0,
  //       leth: 0,
  //       name: "Long",
  //     };
  //   } else if (toRange <= 1.5 * longRange) {
  //     return {
  //       check: -30,
  //       targetInitiative: -1,
  //       damage: -1,
  //       leth: -1,
  //       name: "Very long",
  //     };
  //   } else if (toRange <= 2 * longRange) {
  //     // Affected by gravity
  //     return {
  //       check: -40,
  //       targetInitiative: -2,
  //       damage: -2,
  //       leth: -2,
  //       name: "Extra-long",
  //     };
  //   } else if (extremePlusRange && toRange <= extremePlusRange) {
  //     return {
  //       check: -60,
  //       targetInitiative: -2,
  //       damage: -2,
  //       leth: -2,
  //       fitBonusDisabled: true,
  //       name: "Extreme",
  //     };
  //   }
  //
  //   return null;
  // }
  //
  // rangeEffect(toRange) {
  //   let effect = this.weaponRangeEffect(toRange);
  //   let perks = [];
  //
  //   const visionCheck = this.props.skillHandler.visionCheck(
  //     toRange,
  //     this.props.darknessDetectionLevel,
  //     perks,
  //   );
  //
  //   effect.visionCheck = visionCheck;
  //   if (effect === null || visionCheck === null) {
  //     return null;
  //   }
  //
  //   // If vision check is under 75, the difference is penalty to the
  //   // ranged skill check.
  //   if (visionCheck < this.VISION_CHECK_PENALTY_LIMIT) {
  //     effect.check += visionCheck - this.VISION_CHECK_PENALTY_LIMIT;
  //   }
  //
  //   if (visionCheck < this.VISION_TARGET_INITIATIVE_PENALTY_LIMIT) {
  //     effect.targetInitiative +=
  //       (visionCheck - this.VISION_TARGET_INITIATIVE_PENALTY_LIMIT) / 10;
  //   }
  //
  //   // Instinctive Fire
  //   // Although listed under the Throwing weapons skill, the Instinctive
  //   // fire enhancement is applicable to all missile weapons. The Inst
  //   // fire skill level cannot be higher than the highest missile weapon
  //   // skill level.
  //   // Instinctive fire grants the PC a +1 bonus per level to Target-I
  //   // with ranged weapons. The skill cannot raise the Target-I above 0.
  //   // The skill can be used up to INT/2 m range.
  //
  //   if (
  //     util.isFloat(toRange) &&
  //     toRange <= util.rounddown(this.props.skillHandler.getStat("int") / 2)
  //   ) {
  //     effect.targetInitiative +=
  //       this.props.skillHandler.skillLevel("Instinctive fire");
  //   }
  //   effect.bumpingAllowed = visionCheck >= this.VISION_BUMPING_LIMIT;
  //   return effect;
  // }

  fitDamageBonus(_useType: UseType) {
    const base = this.#weapon.base;

    let fitLethBonus;
    let fitBonusDmg;

    if (base.base_skill.name === "Crossbow") {
      fitBonusDmg = 0;
      fitLethBonus = 0;
    } else {
      const quality = this.#weapon.quality;
      let fit = this.#handler.getStat(Attribute.Fit);
      /* Cap the damage according to max pull of the bow.*/
      if (base.base_skill.name === "Bow" && quality.max_fit) {
        fit = Math.min(quality.max_fit, fit);
      }
      const ccFITBonus = fit - 45;
      fitBonusDmg =
        ccFITBonus / PhysicalWeaponModel.damageFITModifiers[UseType.PRI];
      fitLethBonus =
        ccFITBonus / PhysicalWeaponModel.lethalityFITModifiers[UseType.PRI];
    }
    return { damage: fitBonusDmg, leth: fitLethBonus };
  }

  durability() {
    return (
      this.#weapon.base.durability +
      this.#weapon.quality.durability +
      2 * (this.#weapon.size - 1)
    );
  }

  weaponDamage({ useType = UseType.FULL }: { useType?: UseType }) {
    const base = this.#weapon.base;
    const quality = this.#weapon.quality;
    const numDice = base.num_dice * this.#weapon.size;

    let extraDamage =
      base.extra_damage * this.#weapon.size + parseFloat(quality.damage);

    let leth = base.leth + (this.#weapon.size - 1) + parseFloat(quality.leth);
    let plusLeth: number | null = base.plus_leth + quality.plus_leth;
    // if (defense) {
    //   plusLeth = null;
    //   leth = base.defense_leth + (this.#weapon.size - 1) + quality.defense_leth;
    // }

    /* Damage is capped to twice the base damage of the weapon (incl.
                                 size and quality). */
    const maxDmg = numDice * base.dice + extraDamage;
    const { damage: fitBonusDmg, leth: fitLethBonus } =
      this.fitDamageBonus(useType);
    extraDamage += Math.min(fitBonusDmg, maxDmg);
    leth = Math.min(leth + fitLethBonus, this.durability() + 1);

    return {
      numDice: numDice,
      dice: base.dice,
      extraDamage: extraDamage,
      leth: leth,
      plusLeth: plusLeth,
    };
  }
}
