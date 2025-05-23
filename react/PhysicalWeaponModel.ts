import WeaponModel from "./WeaponModel";
import { SheetPhysicalWeapon } from "./api";
import SkillHandler from "./SkillHandler";
import ValueBreakdown from "./ValueBreakdown";

export abstract class PhysicalWeaponModel extends WeaponModel {
  #weapon: SheetPhysicalWeapon;

  // #handler: SkillHandler;

  constructor(
    handler: SkillHandler,
    weapon: SheetPhysicalWeapon, // TODO: rename to SheetCCWeapon or similar
    // darknessDetectionLevel: number,
  ) {
    super(handler, weapon);
    // this.#handler = handler;
    this.#weapon = weapon;
    // this.#darknessDetectionLevel = darknessDetectionLevel;
  }

  baseROA() {
    const bd = new ValueBreakdown();
    bd.add(parseFloat(this.#weapon.base.roa), "Base");
    bd.add(-0.15 * (this.#weapon.size - 1), "size");
    bd.add(parseFloat(this.#weapon.quality.roa), "quality");
    return bd;
  }

  bypass() {
    return (
      this.#weapon.base.bypass +
      this.#weapon.quality.bypass +
      -(this.#weapon.size - 1)
    );
  }

  dp() {
    return Math.round(
      this.#weapon.base.dp *
        parseFloat(this.#weapon.quality.dp_multiplier) *
        Math.pow(2, this.#weapon.size - 1),
    );
  }

  drawInitiative() {
    return this.#weapon.base.draw_initiative - 2 * (this.#weapon.size - 1);
  }
}
