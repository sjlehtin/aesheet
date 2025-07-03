import { Attribute, EdgeModifierType, Weapon } from "./api"; // import * as util from "./sheet-util";
import SkillHandler from "./SkillHandler";
import { UseType } from "./WeaponModel";
import ValueBreakdown from "./ValueBreakdown";
import * as util from "./sheet-util";
import { PhysicalWeaponModel } from "./PhysicalWeaponModel";

export default class CCWeaponModel extends PhysicalWeaponModel {
  #weapon: Weapon;
  #handler: SkillHandler;

  readiedBaseI = -1;
  baseCheckBonusForSlowActions = 5;
  extraActionModifier = 10;

  constructor(
    handler: SkillHandler,
    weapon: Weapon, // TODO: rename to SheetCCWeapon or similar
  ) {
    super(handler, weapon);
    this.#handler = handler;
    this.#weapon = weapon;
  }

  roa(useType: UseType) {
    if (!useType) {
      useType = UseType.FULL;
    }

    const roa = this.baseROA();

    let specLevel;
    if (useType === UseType.SPECIAL || useType === UseType.FULL) {
      specLevel = this.#handler.skillLevel("Single-weapon style");
      if (!util.isInt(specLevel)) {
        specLevel = 0;
      }
      roa.add(specLevel * 0.05, "SWS");
    } else {
      specLevel = this.#handler.skillLevel("Two-weapon style");
      if (!util.isInt(specLevel)) {
        specLevel = 0;
      }
      const fromUseType = useType === UseType.PRI ? -0.25 : -0.5;
      roa.add(fromUseType, "use type");
      roa.add(Math.min(specLevel * 0.05, -fromUseType), "counter from TWS");
    }
    roa.multiply(this.skillROAMultiplier(), "from skill");
    roa.setMaximum(2.5, "Max ROA");
    return roa;
  }

  ccv() {
    return (
      this.#weapon.base.ccv +
      this.#weapon.quality.ccv +
      (this.#weapon.size - 1) * 5
    );
  }

  penaltyCounterStat(): Attribute {
    return Attribute.Int;
  }

  wrongHandPenalty(useType: UseType): ValueBreakdown {
    const bd = new ValueBreakdown();

    if (useType === UseType.SEC && !this.#weapon.base.is_shield) {
      bd.addBreakdown(super.wrongHandPenalty(useType));
    }
    return bd;
  }

  targetInitiative() {
    return 0;
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

    const ccv = this.ccv();
    bd.add(ccv, "CCV");

    if (!this.isSkilled()) {
      bd.add(this.#weapon.base.ccv_unskilled_modifier, "unskilled");
    }
    return bd;
  }

  durability() {
    /*
     *  The Durability of natural weapons (for example, fists or bear
     *  paws) is calculated as follows: Attack base lethality +
     *  Hardened Skin LR + Toughness L/2. When natural weapons are
     *  damaged, their owner takes non-lethal damage.
     */
    if (this.#weapon.base.is_natural_weapon) {
      return util.rounddown(
        this.#weapon.base.leth -
          this.#handler.getEdgeModifier(EdgeModifierType.LethalityReduction) +
          this.#handler.getEdgeModifier(EdgeModifierType.Toughness) / 2 +
          2 * (this.#weapon.size - 1),
      );
    } else {
      return (
        this.#weapon.base.durability +
        this.#weapon.quality.durability +
        2 * (this.#weapon.size - 1)
      );
    }
  }

  // TODO: Try to combine with RangedWeaponModel somehow
  weaponDamage({
    useType = UseType.FULL,
    defense = false,
  }: {
    useType?: UseType;
    defense?: boolean;
  }) {
    const base = this.#weapon.base;
    const quality = this.#weapon.quality;
    const numDice = base.num_dice * this.#weapon.size;

    let extraDamage =
      base.extra_damage * this.#weapon.size + parseFloat(quality.damage);

    let leth = base.leth + (this.#weapon.size - 1) + parseFloat(quality.leth);
    let plusLeth: number | null = base.plus_leth + quality.plus_leth;
    if (defense) {
      plusLeth = null;
      leth = base.defense_leth + (this.#weapon.size - 1) + quality.defense_leth;
    }

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
