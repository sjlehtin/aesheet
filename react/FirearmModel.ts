import { Attribute, DerivedAttribute, SheetFirearm } from "./api";
import * as util from "./sheet-util";
import { isFloat } from "./sheet-util";
import ValueBreakdown from "./ValueBreakdown";
import SkillHandler from "./SkillHandler";
import WeaponModel, { UseType } from "./WeaponModel";

/*
 * Firearms in Close Combat (AE HR 22, ref 2024-05-22)
 * A PC who finds herself in close combat with a firearm has two options.
 *
 * Ranged-Fire Actions
 *
 * ** This is handled in current sheet by using 0 (point blank) as range **
 * ** TODO: Maybe add a comment about Ranged-Fire only working if initiative
 *     won, as indicated below? **
 *
 * The PC may select to take ranged-fire actions (at +60 to hit, +2 D/L), but
 * in order to do so she must win the initiative. If she loses the initiative,
 * she loses the actions for that turn. In case the PC takes several firing
 * actions, she is allowed to complete the actions up till the first
 * close-combat action made by an enemy (irrespective of the success of the
 * close-combat action). In any case, the PC is not allowed any close-combat
 * defenses.
 * If this action is chosen, it makes sense to combine it with Instinctive
 * fire.
 *
 * Close-Combat Actions
 *
 * The PC may also select to take close-combat actions. In this case, the
 * ROA of the firearm is one half of the ROF. The ROA and the to-hit roll are
 * modified by the Instinctive fire skill (MOV +5L). As in all close combat, 2,5 is the
 * maximum ROA. Successful attacks are at +2 lethality.
 * If the firearm uses burst fire, each burst takes two actions (#1, #3, #5),
 * all rounds hit, and normal lethality modifiers apply, so that the rounds
 * of a three-round burst are at +2, 0, and +4 lethality.
 * To defend, the PC must use another skill (Unarmed combat with a pistol,
 * Staff with a longarm). When used together with firing attacks, the
 * defenses are counted as one action each (and normal attacks are not
 * allowed). Note that this is a special case of close combat as the
 * attacks and defenses are made with different skills and their rates are
 *  calculated separately.
 * Firearm attacks may be defended normally. If the defense results to
 * reduced damage, the rolled damage is reduced from each round separately
 * (the defender manages to turn the gun down to ground and is hit only by
 * ricochet).
 */

/*
 * Firearms in Close Combat (AE HR 22, ref 2024-05-22)
 * A PC who finds herself in close combat with a firearm has two options.
 *
 * Ranged-Fire Actions
 *
 * ** This is handled in current sheet by using 0 (point blank) as range **
 * ** TODO: Maybe add a comment about Ranged-Fire only working if initiative
 *     won, as indicated below? **
 *
 * The PC may select to take ranged-fire actions (at +60 to hit, +2 D/L), but
 * in order to do so she must win the initiative. If she loses the initiative,
 * she loses the actions for that turn. In case the PC takes several firing
 * actions, she is allowed to complete the actions up till the first
 * close-combat action made by an enemy (irrespective of the success of the
 * close-combat action). In any case, the PC is not allowed any close-combat
 * defenses.
 * If this action is chosen, it makes sense to combine it with Instinctive
 * fire.
 *
 * Close-Combat Actions [Rule updated 10/2024]
 *
 * The PC may also select to take close-combat actions using the Weapon combat
 * skill. The ROA depends on the firearm type (Handgun or Long gun) and is
 * modified by the Weapon combat skill level, as normally. The to-hit roll is
 * modified by the CCV based on the firearm type (= one-handed penalty of the
 * firearm +20). A PC without the Gun fu skill enhancement suffers a penalty
 * of -10 to CCV. TODO: As a special exception, the CCV in defense is -10 points
 * weaker.
 *
 * When firearms are used in close combat, their Stock modifier is always 1.0.
 * Note that this may affect the ROF of the firearm. [ROF includes character
 * skill level with the weapon!]
 *
 * Attack action expends 1 CC action, as normally. A successful attack
 * indicates the PC can fire the firearm up to its ROF (modified by the
 * relevant firearms skill, as normally). For example, an autofiring gun with
 * an ROF of 3,0 can expend 3 single rounds or 2 short bursts after a
 * successful CC attack. The hit location is bumped based on the close-combat
 * skill level difference, as normally in close combat. Successful attacks
 * are at +2 lethality and damage. If the firearm uses burst fire, all
 * rounds hit, and normal lethality modifiers apply, so that the rounds of a
 * three-round burst are at +2, 0, and +4 lethality.
 * [Bursts may be further shortened by rules as indicated by JW.]
 *
 * Defense actions can be taken normally, each expending 0,5 CC actions, with
 * a -10 to CCV compared to attack. A PC without the Gun fu skill enhancement
 * suffers an additional penalty of -10 to CCV. A successful defense allows
 * damage reduction based on the firearm type (Handgun or Long gun). See
 * Weapon tables (CCW) for details.
 * [Need to calculate defense initiatives. Need to have separate function for
 * defense skill checks to allow differentiation between weapons.]
 *
 * Firearm attacks may be defended normally. If the defense results to
 * reduced damage, the rolled damage is reduced from each round separately
 * (the defender manages to turn the gun down to ground and is hit only by
 * ricochet).
 *
 * [TODO: Weapon type may be looked from the skill or perhaps from the base stock of
 * the BaseFirearm. Assumption that stock >1.2 is a Long gun, <=1.2 would be a
 * Handgun]
 */

export type SweepType = 5 | 10 | 15 | 20;

export interface RangeEffect {
  check: number;
  targetInitiative: number;
  damage: number;
  leth: number;
  name: string;
  bumpingAllowed?: boolean;
  bumpingLevel?: number;
  visionCheck?: ValueBreakdown;
}

// TODO: delegate instead?
export default class FirearmModel extends WeaponModel {
  static VISION_CHECK_PENALTY_LIMIT = 45;
  static VISION_TARGET_INITIATIVE_PENALTY_LIMIT = 95;
  static VISION_BUMPING_LIMIT = 95;

  #weapon: SheetFirearm;
  readonly #inCC: boolean;
  #handler: SkillHandler;
  readonly #toRange: number;
  readonly #darknessDetectionLevel: number;

  readiedBaseI: number = -1;
  baseCheckBonusForSlowActions: number = 10;
  extraActionModifier: number = 15;

  constructor(
    handler: SkillHandler,
    weapon: SheetFirearm,
    inCloseCombat: boolean,
    toRange: number,
    darknessDetectionLevel: number,
  ) {
    super(handler, weapon);
    this.#handler = handler;
    this.#weapon = weapon;
    this.#inCC = inCloseCombat;
    this.#toRange = toRange;
    this.#darknessDetectionLevel = darknessDetectionLevel;
  }

  impulse() {
    return (
      (parseFloat(this.#weapon.ammo.weight) * this.#weapon.ammo.velocity) / 1000
    );
  }

  shortRange() {
    let sight = this.#weapon.base.sight;
    const scopeSight = this.#weapon.scope?.sight ?? 0;
    if (scopeSight > 0) {
      sight = scopeSight;
    }
    return util.rounddown(
      ((sight + this.#weapon.base.barrel_length) * this.#weapon.base.accuracy) /
        20,
    );
  }

  mediumRange() {
    return this.shortRange() * 2;
  }

  longRange() {
    return util.rounddown(this.shortRange() * this.longRangeMultiplier());
  }

  longRangeMultiplier() {
    let ref600 = Math.min(1, this.#weapon.ammo.velocity / 600);
    return Math.max(3, 4 * ref600 * this.stock());
  }

  oneHandedPenalty() {
    // =MIN(0;-3*Weight-2*Impulse+(25-range_s)/2)
    return Math.min(
      0,
      -3 * parseFloat(this.#weapon.base.weight) -
        2 * this.impulse() +
        (25 - this.shortRange()) / 2,
    );
  }

  // TODO: duplicated from WeaponRow
  skillROAMultiplier(skillName?: string) {
    const level = this.#handler.skillLevel(
      skillName ?? this.#weapon.base.base_skill.name,
    );
    if (level > 0) {
      return 1 + 0.1 * level;
    }
    return 1;
  }

  private applyUseTypeROAPenalty(
    bd: ValueBreakdown,
    useType: UseType | UseType.SPECIAL | UseType.FULL | UseType.SEC,
  ) {
    let mod = 0;
    if (useType === UseType.PRI) {
      mod = -0.25;
    } else if (useType === UseType.SEC) {
      mod = -0.5;
    }
    // TODO: instinctive fire reduces two-weapon penalties.

    bd.add(mod, `${useType} use type`);
  }

  stock() {
    if (this.#inCC) {
      return 1.0;
    } else {
      return parseFloat(this.#weapon.base.stock);
    }
  }

  rof(useType: UseType) {
    const impulse = this.impulse();

    const recoil =
      impulse /
      (parseFloat(this.#weapon.base.duration) *
        this.stock() *
        (parseFloat(this.#weapon.base.weight) + 6));

    let rof =
      30 /
      (recoil +
        parseFloat(this.#weapon.base.weapon_class_modifier) *
          parseFloat(this.#weapon.ammo.weapon_class_modifier_multiplier));

    const bd = new ValueBreakdown(rof, "firearm");
    this.applyUseTypeROAPenalty(bd, useType);

    bd.multiply(this.skillROAMultiplier(), "skill");
    bd.setMaximum(5.0, "Max ROF");
    return bd;
  }

  roa(useType: UseType) {
    if (this.#inCC) {
      const roa = new ValueBreakdown();
      if (this.isHandgun()) {
        roa.add(1.3, "Handgun in CC");
      } else {
        roa.add(1.1, "Long gun in CC");
      }
      this.applyUseTypeROAPenalty(roa, useType);
      roa.multiply(this.skillROAMultiplier("Weapon combat"), "skill");
      return roa;
    } else {
      return this.rof(useType);
    }
  }

  private isHandgun() {
    return this.#weapon.base.base_skill.name === "Handguns";
  }

  skillLevel() {
    if (this.#inCC) {
      return this.#handler.skillLevel("Weapon combat") ?? 0;
    } else {
      return this.#handler.skillLevel(this.#weapon.base.base_skill.name);
    }
  }

  weaponRangeEffect(toRange: number, acuteVision: number): RangeEffect | null {
    // Range
    // Notation "+2 TI, D/L" means "+2 to target initiative and damage and lethality"

    // Range changed 2024/08, biggest difference is removal of TI mods for range here, they are vision check based going forward.
    // Contact +60 (+2 D/L) (Firearms only)
    // Close (0.5–1 m) +50 (+2 D/L) (Firearms only)
    // Point-blank (PB = 1–3 m) +40 (+1 D/L) (not for thrown weapons)
    // Octant-short (OS = ⅛ x S) +30 (+1 D/L) (not for thrown weapons)
    // Quarter-short (QS = ¼ x S) +20
    // Half-short (HS = ½ x S) +10
    // Short (S) 0
    // Medium (M) -10
    // Long (L) -20
    // Very-long (VL = 1½ x L) -30 (-1 D/L)
    // Double-long (DL = 2 x L) -40 (-1 D/L)
    // Extra-long (EL = 2½ x L) -50 (-2 D/L) (Firearms with telescopic sight only)
    // Triple-long (TL = 3x L) -60 (-2 D/L) (Firearms with telescopic sight only)

    // Effects of low vision
    //
    // If the Vision-based Observation (INT) check at a particular range
    // to detect the opponent is less than 95, the PC will suffer an
    // additional penalty to Target-I. The Target-I penalty is equal to
    // (OBSERVE_CHECK-95)/10.
    //
    // If the Vision-based Observation (INT) check at a particular range
    // to detect the opponent is less than 45, the PC will suffer an
    // additional penalty to the combat skill check. The penalty is equal
    // to OBSERVE_CHECK-45, and it applies both in close combat attack
    // and defense as well as ranged combat. NOT DONE CC

    // 3) Bumping
    //
    // In close combat, bumping is allowed if the Vision-based
    // Observation (INT) check against the opponent at close range is 95
    // or greater. NOT DONE
    //
    // In ranged fire, bumping is allowed if the Vision-based Observation
    // (INT) check against the opponent is 95 or greater AND the opponent
    // is full in view (does not have any cover).

    const shortRangeEffect = {
      check: 0,
      targetInitiative: 0,
      damage: 0,
      leth: 0,
      name: "Short",
    };

    if (!toRange && !isFloat(toRange)) {
      return shortRangeEffect;
    }
    const shortRange = this.shortRange();
    const longRange = this.longRange();

    if (toRange < 0.5) {
      return {
        check: 60,
        targetInitiative: 0,
        damage: 2,
        leth: 2,
        name: "Contact",
      };
    } else if (toRange <= 1) {
      return {
        check: 50,
        targetInitiative: 0,
        damage: 2,
        leth: 2,
        name: "Close",
      };
    } else if (toRange <= 3) {
      return {
        check: 40,
        targetInitiative: 0,
        damage: 1,
        leth: 1,
        name: "Point-blank",
      };
    } else if (toRange <= shortRange / 8) {
      return {
        check: 30,
        targetInitiative: 0,
        damage: 1,
        leth: 1,
        name: "Octant-short",
      };
    } else if (toRange <= shortRange / 4) {
      return {
        check: 20,
        targetInitiative: 0,
        damage: 0,
        leth: 0,
        name: "Quarter-short",
      };
    } else if (toRange <= shortRange / 2) {
      return {
        check: 10,
        targetInitiative: 0,
        damage: 0,
        leth: 0,
        name: "Half-short",
      };
    } else if (toRange <= shortRange) {
      return shortRangeEffect;
    } else if (toRange <= this.mediumRange()) {
      return {
        check: -10,
        targetInitiative: 0,
        damage: 0,
        leth: 0,
        name: "Medium",
      };
    } else if (toRange <= longRange) {
      return {
        check: -20,
        targetInitiative: 0,
        damage: 0,
        leth: 0,
        name: "Long",
      };
    } else if (toRange <= 1.5 * longRange) {
      return {
        check: -30,
        targetInitiative: 0,
        damage: -1,
        leth: -1,
        name: "Very-long",
      };
    } else if (toRange <= 2 * longRange) {
      return {
        check: -40,
        targetInitiative: 0,
        damage: -1,
        leth: -1,
        name: "Double-long",
      };
    } else if (acuteVision >= 1 && toRange <= 2.5 * longRange) {
      // XXXL (2½ x L)
      // -50 (-3 TI, D/L) (telescopic sight only)
      return {
        check: -50,
        targetInitiative: 0,
        damage: -2,
        leth: -2,
        name: "Extra-long",
      };
    } else if (acuteVision >= 2 && toRange <= 3 * longRange) {
      // Extreme (3x L)
      // -60 (-4 TI, D/L) (telescopic sight only)
      return {
        check: -60,
        targetInitiative: 0,
        damage: -2,
        leth: -2,
        name: "Triple-long",
      };
    }

    return null;
  }

  rangeEffect() {
    if (this.#inCC) {
      return {
        check: 0,
        targetInitiative: 0,
        damage: 2,
        leth: 2,
        name: "Contact",
        bumpingAllowed: true,
        bumpingLevel: this.skillLevel() ?? 0,
      };
    }
    const toRange = this.#toRange;
    let perks = this.#weapon.scope?.perks ?? [];

    const visionCheckBreakdown = this.#handler.visionCheck(
      toRange,
      this.#darknessDetectionLevel,
      perks,
    );

    const dayBaseCheck = this.#handler.dayVisionBaseCheck(perks);
    let effect = this.weaponRangeEffect(toRange, dayBaseCheck.detectionLevel);

    if (effect === null || visionCheckBreakdown === null) {
      return null;
    }

    const visionCheck = visionCheckBreakdown.value();
    effect.visionCheck = visionCheckBreakdown;

    // If vision check is under 75, the difference is penalty to the
    // ranged skill check.
    if (visionCheck < FirearmModel.VISION_CHECK_PENALTY_LIMIT) {
      effect.check += visionCheck - FirearmModel.VISION_CHECK_PENALTY_LIMIT;
    }

    if (visionCheck < FirearmModel.VISION_TARGET_INITIATIVE_PENALTY_LIMIT) {
      effect.targetInitiative +=
        (visionCheck - FirearmModel.VISION_TARGET_INITIATIVE_PENALTY_LIMIT) /
        10;
    }

    // Instinctive Fire
    // Although listed under the Throwing weapons skill, the Instinctive
    // fire enhancement is applicable to all missile weapons. The Inst
    // fire skill level cannot be higher than the highest missile weapon
    // skill level.
    // Instinctive fire grants the PC a +1 bonus per level to Target-I
    // with ranged weapons. The skill cannot raise the Target-I above 0.
    // The skill can be used up to INT/2 m range.

    if (
      util.isFloat(toRange) &&
      toRange <= util.rounddown(this.#handler.getStat(Attribute.Int) / 2)
    ) {
      effect.targetInitiative += this.#handler.skillLevel("Instinctive fire");
    }
    effect.bumpingAllowed = visionCheck >= FirearmModel.VISION_BUMPING_LIMIT;
    effect.bumpingLevel = this.skillLevel();
    return effect;
  }

  // TODO: duplicated from WeaponRow
  missingSkills() {
    const missing: string[] = [];
    const checkSkill = (skillName: string) => {
      if (skillName) {
        if (!this.#handler.hasSkill(skillName)) {
          missing.push(skillName);
        }
      }
    };

    for (let req of this.#weapon.base.required_skills) {
      checkSkill(req.name);
    }

    return missing;
  }

  // TODO: duplicated from RangedWeaponRow
  rangedWeaponSkillCheck() {
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

  ccv() {
    return 20 + this.oneHandedPenalty();
  }

  skillCheck(options: { sweepFire?: boolean } = { sweepFire: false }) {
    let effect = this.rangeEffect();
    if (!effect) {
      return null;
    }
    if (this.#inCC) {
      const ccCheck = this.#handler.skillCheck(
        "Weapon combat",
        DerivedAttribute.Mov,
        true,
      );

      if (!ccCheck) return null;

      // TODO: Move to CCV
      if (!this.#handler.hasSkill("Gun fu")) {
        ccCheck.add(-10, "Gun fu missing");
      }
      ccCheck.add(this.ccv(), "CCV");
      return ccCheck;
    } else {
      const baseCheck = this.rangedWeaponSkillCheck();
      if (!baseCheck) {
        return null;
      }

      baseCheck.add(effect.check, "range");
      if (options.sweepFire && effect.check < 0) {
        baseCheck.add(effect.check, "sweep @range");
      }
      return baseCheck;
    }
  }

  penaltyCounterStat(): Attribute {
    if (this.#inCC) {
      return Attribute.Int;
    } else {
      return Attribute.Fit;
    }
  }

  singleBurstChecks(check: ValueBreakdown) {
    const checks = [];

    const maxHits = this.maxBurstHits();
    const baseSkillCheck = this.skillCheck();
    const burstMultipliers = [0, 1, 3, 6, 10];
    const autofireClasses = { A: -1, B: -2, C: -3, D: -4, E: -5 };

    const autofirePenalty = new ValueBreakdown();
    if (!this.#handler.hasSkill("Autofire")) {
      autofirePenalty.add(-10, "Unskilled @Autofire");
    }

    for (let ii = 0; ii < 5; ii++) {
      if (ii >= maxHits || check === null || baseSkillCheck === null) {
        checks.push(null);
      } else {
        // The modifier might be positive at this point, and penalty
        // countering could leave the overall mod as positive.
        let mod = check.value() - baseSkillCheck.value();

        const bd = new ValueBreakdown();

        bd.addBreakdown(baseSkillCheck);

        let bonus = 0;
        if (mod > 0) {
          bonus = mod;
          mod = 0;
        }

        bd.add(bonus, "bonus from ROA");
        //bd.add(mod, "penalty #act")
        // bd.add(burstMultipliers[ii] *
        //     autofireClasses[base.autofire_class],
        //     "autofire class")

        // In CC, all burst shots have same check.
        if (!this.#inCC) {
          mod +=
            burstMultipliers[ii] *
            autofireClasses[this.#weapon.base.autofire_class];
        }

        mod = FirearmModel.counterPenalty(
          mod,
          this.#handler.getStat(this.penaltyCounterStat()),
        );
        bd.add(mod, "burst penalty");
        bd.addBreakdown(autofirePenalty);

        checks.push(bd);
      }
    }
    return checks;
  }

  maxBurstHits() {
    let maxHits = Math.min(
      util.rounddown((this.maxAutofireRounds() ?? 0) / 8),
      5,
    );

    if (this.#weapon.base.restricted_burst_rounds > 0) {
      maxHits = Math.min(maxHits, this.#weapon.base.restricted_burst_rounds);
    }
    return maxHits;
  }

  ccHits(useType: UseType) {
    const single = this.rof(useType).value();
    const maxHits = this.maxBurstHits();
    return {
      single: !this.#weapon.base.autofire_only ? util.rounddown(single) : null,
      bursts: maxHits
        ? new Array(util.rounddown((single + 1) / 2)).fill(maxHits)
        : null,
    };
  }

  /* Maps a burst action to normal action for initiative and skill check
                     calculation. */
  mapBurstActions(actions: number[]) {
    return actions.map((act) => {
      if (act >= 1) {
        act = act * 2 - 1;
      }
      return act;
    });
  }

  burstChecks(actions: number[], useType: UseType) {
    if (!this.hasBurst()) {
      /* No burst fire with this weapon. */
      return null;
    }

    const checks = this.skillChecksV2(
      this.mapBurstActions(actions),
      useType,
      false,
    );
    if (checks === null) {
      // no actions available.
      return actions.map(() => {
        return [];
      });
    }
    // TODO: remove nulls from output, pad in the render instead, or similar
    return checks.map((chk) => {
      return chk ? this.singleBurstChecks(chk) : 0;
    });
  }

  sweepChecks(sweepType: SweepType) {
    // TODO: Sweep fire with non-full?
    const sweeps = {
      5: [0, 2, 5, 10],
      10: [0, 1, 2, 2, 5, 5, 10, 10],
      15: [0, 1, 1, 2, 2, 2, 5, 5, 5, 10, 10, 10],
      20: [0, 1, 1, 1, 2, 2, 2, 2, 5, 5, 5, 5, 10, 10, 10, 10],
    };
    if (!(sweepType in sweeps)) {
      throw Error("Invalid sweep type: " + sweepType);
    }
    const autofireClasses = { A: -1, B: -2, C: -3, D: -4, E: -5 };

    const afClass = autofireClasses[this.#weapon.base.autofire_class];

    const autofirePenalty = new ValueBreakdown();
    autofirePenalty.add(-10, "Autofire");
    if (!this.#handler.hasSkill("Autofire")) {
      autofirePenalty.add(-10, "Unskilled @Autofire");
    }

    const baseSkillCheck = this.skillCheck({ sweepFire: true });
    let checks = [];
    let penaltyMultiplier = 0;
    for (let multiplier of sweeps[sweepType]) {
      penaltyMultiplier += multiplier;
      if (baseSkillCheck === null) {
        checks.push(null);
      } else {
        const bd = new ValueBreakdown();

        bd.addBreakdown(baseSkillCheck);
        bd.add(sweepType, "sweep bonus");
        const penalty = penaltyMultiplier * afClass;
        // TODO, use counterPenaltyV2
        bd.add(
          FirearmModel.counterPenalty(
            penalty,
            this.#handler.getStat(Attribute.Fit),
          ),
          "sweep penalty",
        );
        bd.addBreakdown(autofirePenalty);
        checks.push(bd);
      }
    }
    return checks;
  }

  targetInitiative() {
    let targetInitiative = this.#weapon.base.target_initiative;
    if (this.#weapon.scope) {
      targetInitiative += this.#weapon.scope.target_i_mod;
    }

    let rangeEffect = this.rangeEffect();
    if (rangeEffect === null) {
      return null;
    }

    targetInitiative += rangeEffect.targetInitiative;

    // Target-I can be at most zero.
    return Math.min(0, targetInitiative);
  }

  burstInitiatives(actions: number[]) {
    if (!this.hasBurst()) {
      /* No burst fire with this weapon. */
      return null;
    }
    return this.initiatives(this.mapBurstActions(actions), {});
  }

  autofireRPM() {
    if (!this.#weapon.base.autofire_rpm) {
      return null;
    }
    return Math.round(
      this.#weapon.base.autofire_rpm /
        parseFloat(this.#weapon.ammo.weapon_class_modifier_multiplier),
    );
  }

  maxAutofireRounds() {
    const rpm = this.autofireRPM() ?? 0;
    if (rpm < 300) {
      return null;
    }
    return Math.round(rpm / 15);
  }

  hasBurst() {
    return (
      this.maxAutofireRounds() !== null && !this.#weapon.base.autofire_only
    );
  }

  hasSweep() {
    return (
      this.maxAutofireRounds() !== null &&
      !this.#weapon.base.sweep_fire_disabled
    );
  }

  weaponDamage({
    useType = UseType.FULL,
    defense = false,
  }: {
    useType?: UseType;
    defense?: boolean;
  }) {
    if (this.#inCC && defense) {
      const { damage: fitBonusDmg, leth: fitLethBonus } =
        this.fitDamageBonus(useType);

      return {
        numDice: 1,
        dice: this.isHandgun() ? 4 : 6,
        extraDamage: fitBonusDmg,
        leth: (this.isHandgun() ? 1 : 3) + fitLethBonus,
        plusLeth: 0,
      };
    } else {
      const ammo = this.#weapon.ammo;
      let plusLeth = "";
      if (ammo.plus_leth) {
        plusLeth = ` (${util.renderInt(ammo.plus_leth)})`;
      }

      let rangeEffect = this.rangeEffect();

      if (rangeEffect === null) {
        return null;
      }

      return {
        numDice: ammo.num_dice,
        dice: ammo.dice,
        extraDamage: ammo.extra_damage + rangeEffect.damage,
        leth: ammo.leth + rangeEffect.leth,
        plusLeth: plusLeth,
      };
    }
  }
}
