import { SheetWeapon } from "./api"; // import * as util from "./sheet-util";
import SkillHandler from "./SkillHandler";
import * as util from "./sheet-util";
import ValueBreakdown from "./ValueBreakdown";

export enum UseType {
  SPECIAL = "SPECIAL",
  FULL = "FULL",
  PRI = "PRI",
  SEC = "SEC",
}

export default abstract class WeaponModel {
  // static VISION_CHECK_PENALTY_LIMIT = 45;
  // static VISION_TARGET_INITIATIVE_PENALTY_LIMIT = 95;
  // static VISION_BUMPING_LIMIT = 95;

  #weapon: SheetWeapon;
  #handler: SkillHandler;
  // readonly #darknessDetectionLevel: number;

  readiedBaseI = -3;
  baseCheckBonusForSlowActions = 5;
  extraActionModifier = 10;

  constructor(
    handler: SkillHandler,
    weapon: SheetWeapon,
    // darknessDetectionLevel: number,
  ) {
    this.#handler = handler;
    this.#weapon = weapon;
    // this.#darknessDetectionLevel = darknessDetectionLevel;
  }

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

  isSkilled() {
    return this.missingSkills().length === 0;
  }

  skillLevel() {
    return this.#handler.skillLevel(
      this.#weapon.base.base_skill.name,
    );
  }

  skillROAMultiplier(skillName?: string) {
    const level = this.#handler.skillLevel(
      skillName ?? this.#weapon.base.base_skill.name,
    );
    if (level > 0) {
      return 1 + 0.1 * level;
    }
    return 1;
  }

  static checkMod(
    roa: number,
    act: number,
    baseBonus: number,
    extraActionModifier: number,
  ) {
    if (1 / act >= 1 / roa + 1) {
      return baseBonus;
    }
    if (act < 0.5 * roa) {
      return roa / act;
    }
    /* Gap.*/
    if (act > roa) {
      return (-act / roa) * 20 + extraActionModifier;
    }

    // Value in the gap.
    return 0;
  }

  static counterPenalty(modifier: number, stat: number) {
    if (modifier > 0) {
      /* Not a penalty, a bonus. */
      return modifier;
    }
    return Math.min(0, modifier + util.rounddown((stat - 45) / 3));
  }

  static counterPenaltyV2(stat: number) {
    return util.rounddown((stat - 45) / 3);
  }

  oneHandedPenalty() {
    return 0;
  }

  abstract penaltyCounterStat(): string;

  abstract skillCheck(): ValueBreakdown | null;

  abstract roa(useType: UseType): ValueBreakdown;

  abstract targetInitiative(): number | null;

  wrongHandPenalty(useType: UseType): ValueBreakdown {
    const bd = new ValueBreakdown();

    if (useType === UseType.SEC) {
      const wrongHandPenalty = -25;

      bd.add(wrongHandPenalty, "Wrong hand penalty");

      const counter = Math.min(
        this.#handler.edgeLevel("Ambidexterity") * 5,
        -wrongHandPenalty,
      );

      bd.add(counter, "Counter from Ambidexterity");
    }
    return bd;
  }

  initiatives(
    actions: number[],
    {
      useType = UseType.FULL,
      /* Whether the weapon can be readied with a multi-turn action. */
      canReady = true,
      /* 2 for attacks, 4 for defenses. */
      maxActionMultiplier = 2,
      baseIMultipliers = [1, 4, 7, 2, 5, 8, 3, 6, 9],
    }: {useType?: UseType, canReady?: boolean, maxActionMultiplier?: number, baseIMultipliers?: number[]}
  ) {
    const rof = this.roa(useType).value();
    const baseI = -5 / rof;
    const readiedBaseI = this.readiedBaseI;
    let targetI = this.targetInitiative();
    if (targetI === null) {
      // Range too long, actions are not available.
      return actions.map(() => {
        return null;
      });
    }
    const initiative = this.#handler.getInitiative();

    const initiatives = [];
    for (let act of actions) {
      if (act > maxActionMultiplier * rof) {
        initiatives.push(null);
      } else {
        if (canReady && rof > 2 * act && act < 1) {
          /* Assuming multi-turn action, where readying of the
                     weapon is possible and target has already been
                     acquired.  House Rules, initiative, p. 8. */
          initiatives.push(
            Math.max(readiedBaseI, baseI) + Math.min(targetI + 3, 0),
          );
        } else {
          /* One target acquire is assumed for the rest of the
                     initiatives.  If target is changed, target-I should
                     be added to the rest of the initiatives.
                     */
          initiatives.push(
            baseIMultipliers[Math.ceil(act) - 1] * baseI + targetI,
          );
        }
      }
    }
    return initiatives.map(function (el) {
      if (el !== null) {
        return Math.round(el + initiative);
      } else {
        return null;
      }
    });
  }

  skillChecksV2(
    actions: number[],
    useType: UseType = UseType.FULL,
    counterPenalty: boolean = true,
  ) {
    const roa = this.roa(useType).value();
    const baseCheck = this.skillCheck();
    if (!baseCheck) {
      // Actions not available.
      return null;
    }
    const checks = [];

    baseCheck.addBreakdown(this.wrongHandPenalty(useType));

    if (useType !== UseType.FULL) {
      baseCheck.add(this.oneHandedPenalty(), "One-handed penalty");
    }

    for (let act of actions) {
      if (act > 2 * roa) {
        checks.push(null);
      } else {
        const bd = new ValueBreakdown();

        bd.addBreakdown(baseCheck);

        const mod = Math.round(
          WeaponModel.checkMod(
            roa,
            act,
            this.baseCheckBonusForSlowActions,
            this.extraActionModifier,
          ),
        );

        bd.add(mod, "ROA");

        // TODO: counterPenalty is a bad name, as a bad stat will give actual penalty for actions with these, see AE2K_Weapons_17.xls
        if (counterPenalty) {
          let counter = WeaponModel.counterPenaltyV2(
            this.#handler.getStat(this.penaltyCounterStat()),
          );
          if (counter > 0) {
            if (mod > 0) {
              counter = 0;
            } else {
              counter = Math.min(counter, -mod);
            }
          }

          bd.add(counter, `Modifier from ${this.penaltyCounterStat()}`);
        }
        bd.rounddown();
        checks.push(bd);
      }
    }
    return checks;
  }
}
