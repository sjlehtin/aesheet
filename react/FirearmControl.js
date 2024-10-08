import React from "react";
import PropTypes from "prop-types";

import RangedWeaponRow from "RangedWeaponRow";
import WeaponRow from "WeaponRow";
import AmmoControl from "AmmoControl";
import ScopeControl from "ScopeControl";
import StatBreakdown from "StatBreakdown";
import MagazineControl from "MagazineControl";
import UseTypeControl from "UseTypeControl";

import * as util from "./sheet-util";
import { isFloat } from "./sheet-util";
import { Badge, Button, Col, Row, Table } from "react-bootstrap";
import ValueBreakdown from "./ValueBreakdown";
import { BaseCheck } from "./BaseCheck";
import { Unskilled } from "./Unskilled";
import { GoAlert } from "react-icons/go";

/*
 * Firearms are sheet specific. Firearms can contain add-ons, most
 * notably scopes. Add-ons affect weapon range, to-hit and target initiative,
 * among other factors.
 *
 * A firearm can have a single scope. There may be other add-ons, and the sheet
 * will not restrict the add-ons in any way. Use common sense on what add-ons
 * you put to a firearm (no sense in, e.g., adding both bipod and a tripod).
 *
 * The add-ons may affect the user's senses when using the firearm, notably
 * sight, which is used to calculate the range penalties for the weapon.
 */

/*
 * Firearms are sheet specific. Firearms can contain add-ons, most
 * notably scopes. Add-ons affect weapon range, to-hit and target initiative,
 * among other factors.
 *
 * A firearm can have a single scope. There may be other add-ons, and the sheet
 * will not restrict the add-ons in any way. Use common sense on what add-ons
 * you put to a firearm (no sense in, e.g., adding both bipod and a tripod).
 *
 * The add-ons may affect the user's senses when using the firearm, notably
 * sight, which is used to calculate the range penalties for the weapon.
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

function RangeInfo({ rangeEffect }) {
  if (rangeEffect) {
    let bumping;
    if (rangeEffect.bumpingAllowed && rangeEffect.bumpingLevel > 0) {
      bumping = `yes (${rangeEffect.bumpingLevel})`;
    } else {
      bumping = `no`;
    }
    return (
      <div>
        <Table>
          <tbody>
            <tr aria-label={"Range effect"}>
              <th>Range effect</th>
              <td
                className={"mx-2"}
                aria-label="Name"
              >{`${rangeEffect.name}`}</td>
              <th className={"ml-5"}>Bumping</th>
              <td className={"mx-2"} aria-label="Bumping allowed">
                {bumping}
              </td>
              <th className={"ml-5"}>Check</th>
              <td
                className={"mx-2"}
                aria-label="Check modifier"
              >{`${util.renderInt(rangeEffect.check)}`}</td>
              <th className={"ml-2"}>TI</th>
              <td
                className={"mx-2"}
                aria-label="Target initiative modifier"
              >{`${util.renderInt(rangeEffect.targetInitiative)}`}</td>
              <th className={"ml-5"}>Dmg</th>
              <td
                className={"mx-2"}
                aria-label="Damage modifier"
              >{`${util.renderInt(rangeEffect.damage)}`}</td>
              <th className={"ml-5"}>Leth</th>
              <td
                className={"mx-2"}
                aria-label="Lethality modifier"
              >{`${util.renderInt(rangeEffect.leth)}`}</td>
              <th className={"ml-5"}>Vision</th>
              <td className={"mx-2"}>
                <StatBreakdown value={rangeEffect.visionCheck} label={"Vision check"} />
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  } else {
    return (
      <div>
        <span style={{ fontWeight: "bold" }}>
          Unable to shoot to this range
        </span>
      </div>
    );
  }
}

class FirearmControl extends RangedWeaponRow {
  constructor(props) {
    super(props);

    this.state = { useType: this.props.weapon.use_type };
    // TODO: move to class statics
    this.readiedBaseI = -1;
    this.baseCheckBonusForSlowActions = 10;
    this.extraActionModifier = 15;
  }

  penaltyCounterStat() {
    if (this.props.inCloseCombat) {
      return "INT";
    } else {
      return "FIT";
    }
  }

  roa(useType) {
    const base = this.props.weapon.base;
    const impulse = this.impulse();

    const recoil =
      impulse /
      (parseFloat(base.duration) *
        parseFloat(base.stock) *
        (parseFloat(base.weight) + 6));

    let rof = 30 / (recoil + parseFloat(base.weapon_class_modifier));

    const bd = new ValueBreakdown(rof, "firearm");
    let mod = 0;
    if (useType === WeaponRow.PRI) {
      mod = -0.25;
    } else if (useType === WeaponRow.SEC) {
      mod = -0.5;
    }
    bd.add(mod, `${useType} use type`);

    // TODO: two-weapon style
    if (this.props.inCloseCombat) {
      bd.divide(2, "Firearm in CC");
      bd.multiply(this.skillROAMultiplier("Instinctive fire"), "inst fire");
      bd.setMaximum(2.5, "Max ROA");
    } else {
      bd.multiply(this.skillROAMultiplier(), "skill");
      bd.setMaximum(5.0, "Max ROF");
    }
    return bd;
  }

  impulse() {
    return (
      (parseFloat(this.props.weapon.ammo.weight) *
        parseFloat(this.props.weapon.ammo.velocity)) /
      1000
    );
  }

  oneHandedPenalty() {
    // =MIN(0;-3*Weight-2*Impulse+(25-range_s)/2)
    return Math.min(
      0,
      -3 * parseFloat(this.props.weapon.base.weight) -
        2 * this.impulse() +
        (25 - this.shortRange()) / 2,
    );
  }

  skillCheck(sweepFire = false) {
    let effect = this.rangeEffect();
    if (!effect) {
      return null;
    }
    if (this.props.inCloseCombat) {
      return this.props.skillHandler.skillCheck(
        "Instinctive fire",
        "MOV",
        true,
      );
    } else {
      const baseCheck = super.skillCheck();
      if (!baseCheck) {
        return null;
      }

      baseCheck.add(effect.check, "range");
      if (sweepFire && effect.check < 0) {
        baseCheck.add(effect.check, "sweep @range");
      }
      return baseCheck;
    }
  }

  singleBurstChecks(check) {
    const base = this.props.weapon.base;
    const checks = [];

    let maxHits = Math.min(util.rounddown(base.autofire_rpm / 120), 5);

    if (base.restricted_burst_rounds > 0) {
      maxHits = Math.min(maxHits, base.restricted_burst_rounds);
    }
    const baseSkillCheck = this.skillCheck();
    const burstMultipliers = [0, 1, 3, 6, 10];
    const autofireClasses = { A: -1, B: -2, C: -3, D: -4, E: -5 };

    const autofirePenalty = new ValueBreakdown();
    if (!this.props.skillHandler.hasSkill("Autofire")) {
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
        if (!this.props.inCloseCombat) {
          mod += burstMultipliers[ii] * autofireClasses[base.autofire_class];
        }

        mod = FirearmControl.counterPenalty(
          mod,
          this.getStat(this.penaltyCounterStat()),
        );
        bd.add(mod, "burst penalty");
        bd.addBreakdown(autofirePenalty);

        checks.push(bd);
      }
    }
    return checks;
  }

  /* Maps a burst action to normal action for initiative and skill check
       calculation. */
  mapBurstActions(actions) {
    return actions.map((act) => {
      if (act >= 1) {
        act = act * 2 - 1;
      }
      return act;
    });
  }

  burstChecks(actions) {
    if (!this.props.weapon.base.autofire_rpm) {
      /* No burst fire with this weapon. */
      return null;
    }

    const checks = this.skillChecksV2(this.mapBurstActions(actions), {
      useType: this.state.useType,
      counterPenalty: false,
    });
    if (checks === null) {
      // no actions available.
      return actions.map(() => {
        return [];
      });
    }
    return checks.map((chk) => {
      return this.singleBurstChecks(chk);
    });
  }

  burstInitiatives(actions) {
    if (!this.props.weapon.base.autofire_rpm) {
      /* No burst fire with this weapon. */
      return null;
    }
    return this.initiatives(this.mapBurstActions(actions));
  }

  renderDamage() {
    const ammo = this.props.weapon.ammo;
    let plusLeth = "";
    if (ammo.plus_leth) {
      plusLeth = ` (${this.renderInt(ammo.plus_leth)})`;
    }

    let rangeEffect = this.rangeEffect();

    if (rangeEffect === null) {
      return (
        <span className="damage">
          <strong>range too long!</strong>
        </span>
      );
    }

    return (
      <span className="damage">
        {ammo.num_dice}d{ammo.dice}
        {util.renderInt(ammo.extra_damage + rangeEffect.damage)}/
        {ammo.leth + rangeEffect.leth}
        {plusLeth}
      </span>
    );
  }

  async handleAmmoChanged(value) {
    if (this.props.onChange) {
      await this.props.onChange({
        id: this.props.weapon.id,
        ammo: value,
      });
    }
  }

  renderBurstTable() {
    if (!this.props.weapon.base.autofire_rpm) {
      return "";
    }
    const actions = [0.5, 1, 2, 3, 4];
    const burstChecks = this.burstChecks(actions);
    const lethalities = [0, -2, 2, 0, -2];
    const hitLocations = [0, 0, 0, -1, -1];
    const burstRows = [];

    const baseStyle = {
      padding: 2,
      borderWidth: 1,
      minWidth: "2em",
      textAlign: "center",
    };
    const cellStyle = Object.assign({ borderStyle: "dotted" }, baseStyle);

    const actionCells = actions.map((act, ii) => {
      return (
        <th key={ii} style={baseStyle}>
          {act}
        </th>
      );
    });

    for (let ii = 0; ii < 5; ii++) {
      const checkCells = [];
      for (let jj = 0; jj < burstChecks.length; jj++) {
        let cell;
        if (burstChecks[jj][ii]) {
          cell = (
            <StatBreakdown
              value={burstChecks[jj][ii].value()}
              breakdown={burstChecks[jj][ii].breakdown()}
            />
          );
        } else {
          cell = "";
        }
        checkCells.push(
          <td key={jj} style={cellStyle} aria-label={`Burst ${jj + 1} To-Hit`}>
            {cell}
          </td>,
        );
      }
      burstRows.push(
        <tr key={`chk-${ii}`}>
          <td style={cellStyle}>{lethalities[ii]}</td>
          <td style={cellStyle}>{hitLocations[ii]}</td>
          {checkCells}
        </tr>,
      );
    }

    const inits = this.burstInitiatives(actions).map((init, ii) => {
      return <th key={"init-" + ii}>{this.renderInt(init)}</th>;
    });

    let autoUnskilled = "";
    if (!this.props.skillHandler.hasSkill("Autofire")) {
      autoUnskilled = (
        <div style={{ color: "red" }} title="Missing skill Autofire">
          Unskilled
        </div>
      );
    }

    return (
      <div>
        <table style={{ fontSize: "inherit" }}>
          <thead>
            <tr>
              <th style={baseStyle}>Leth</th>
              <th style={baseStyle}>Loc</th>
              {actionCells}
            </tr>
          </thead>
          <tbody>{burstRows}</tbody>
          <tfoot>
            <tr>
              <th />
              <th />
              {inits}
            </tr>
          </tfoot>
        </table>
        {autoUnskilled}
      </div>
    );
  }

  sweepChecks(sweepType) {
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

    const afClass = autofireClasses[this.props.weapon.base.autofire_class];

    const autofirePenalty = new ValueBreakdown();
    autofirePenalty.add(-10, "Autofire");
    if (!this.props.skillHandler.hasSkill("Autofire")) {
      autofirePenalty.add(-10, "Unskilled @Autofire");
    }

    const baseSkillCheck = this.skillCheck(true);
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
          FirearmControl.counterPenalty(penalty, this.getStat("fit")),
          "sweep penalty",
        );
        bd.addBreakdown(autofirePenalty);
        checks.push(bd);
      }
    }
    return checks;
  }

  hasSweep() {
    return (
      this.props.weapon.base.autofire_rpm &&
      !this.props.weapon.base.sweep_fire_disabled
    );
  }

  sweepAvailable() {
    return this.hasSweep() && !this.props.inCloseCombat;
  }

  shortRange() {
    const base = this.props.weapon.base;
    let sight = base.sight;
    const scopeSight = this.props.weapon.scope?.sight ?? 0;
    if (scopeSight > 0) {
      sight = scopeSight;
    }
    return util.rounddown(((sight + base.barrel_length) * base.accuracy) / 20);
  }

  mediumRange() {
    return this.shortRange() * 2;
  }

  longRange() {
    return util.rounddown(this.shortRange() * this.longRangeMultiplier());
  }

  longRangeMultiplier() {
    let ref600 = Math.min(1, this.props.weapon.ammo.velocity / 600);
    return Math.max(3, 4 * ref600 * this.props.weapon.base.stock);
  }

  renderSweepTable() {
    if (!this.hasSweep()) {
      return "";
    }

    if (this.props.inCloseCombat) {
      return (
        <div className={"p-1"}>
          <Badge bg="warning">
            <GoAlert size={"2em"} />
          </Badge>{" "}
          Sweep fire not available in close combat!
        </div>
      );
    }

    var sweepRows = [];

    var baseStyle = {
      padding: 2,
      borderWidth: 1,
      minWidth: "2em",
      textAlign: "center",
    };
    var cellStyle = Object.assign({ borderStyle: "dotted" }, baseStyle);

    for (let sweep of [5, 10, 15, 20]) {
      let checks = this.sweepChecks(sweep);
      for (let ii = checks.length; ii < 16; ii++) {
        checks[ii] = null;
      }
      checks.reverse();
      const checkCells = checks.map((chk, index) => {
        let cell;
        if (chk) {
          cell = (
            <StatBreakdown value={chk.value()} breakdown={chk.breakdown()} />
          );
        } else {
          cell = "";
        }
        return (
          <td
            style={cellStyle}
            key={index}
            aria-label={`Sweep ${sweep} to-hit`}
          >
            {cell}
          </td>
        );
      });
      sweepRows.push(
        <tr key={sweep}>
          <td>{sweep}</td>
          <td>
            {util.roundup(this.props.weapon.base.autofire_rpm / (6 * sweep))}
          </td>
          {checkCells}
        </tr>,
      );
    }

    const footCellStyle = { textAlign: "center" };

    const hits = new Array(16).fill().map((_, ii) => (
      <th style={{ fontSize: "60%", textAlign: "center" }} key={"header-" + ii}>
        {16 - ii} hit
      </th>
    ));
    return (
      <div>
        <table style={{ fontSize: "inherit" }} aria-label={"Sweep fire to-hit"}>
          <thead>
            <tr>
              <th colSpan={4}>
                Sweep fire {this.props.weapon.base.autofire_rpm}
                {this.props.weapon.base.autofire_class}
              </th>
            </tr>
            <tr>
              <th>RPT</th>
              <th>TGT</th>
              {hits}
            </tr>
          </thead>
          <tbody>{sweepRows}</tbody>
          <tfoot>
            <tr>
              <th colSpan={2}>Lethality</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
            </tr>
            <tr>
              <th colSpan={2}>Location</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>+1</th>
              <th style={footCellStyle}>+1</th>
              <th style={footCellStyle}>+1</th>
              <th style={footCellStyle}>-1</th>
              <th style={footCellStyle}>-1</th>
              <th style={footCellStyle}>-1</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>0</th>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  async handleScopeRemove() {
    await this.handleScopeChanged(null);
  }

  async handleScopeChanged(value) {
    if (this.props.onChange) {
      await this.props.onChange({
        id: this.props.weapon.id,
        scope: value,
      });
    }
  }

  async handleUseTypeChange(useType) {
    this.setState({ useType: useType });
    if (this.props.onChange) {
      await this.props.onChange({
        id: this.props.weapon.id,
        use_type: useType,
      });
    }
  }

  targetInitiative() {
    let targetInitiative = this.props.weapon.base.target_initiative;
    if (this.props.weapon.scope) {
      targetInitiative += this.props.weapon.scope.target_i_mod;
    }

    let rangeEffect = this.rangeEffect();
    if (rangeEffect === null) {
      return null;
    }

    targetInitiative += rangeEffect.targetInitiative;

    // Target-I can be at most zero.
    return Math.min(0, targetInitiative);
  }

  weaponRangeEffect(toRange, acuteVision) {
    // Range
    // Notation "+2 TI, D/L" means "+2 to target initiative and damage and lethality"
    //
    // Contact
    // +60 (+2 TI, D/L) (Firearms only)
    // Close (0.5–1 m)
    // +50 (+2 TI, D/L) (Firearms only)
    // Point-blank (1–3 m)
    // +40 (+1 TI, D/L)
    // XXS (⅛ x S)
    // +30 (+1 TI, D/L)
    // Extra-short (¼ x S)
    // +20
    // Very short (½ x S)
    // +10
    // Short
    // 0
    // Medium
    // -10
    // Long
    // -20
    // Extra-long (1½ x L)
    // -30 (-1 TI, D/L)
    // XXL (2 x L)
    // -40 (-2 TI, D/L)
    // XXXL (2½ x L)
    // -50 (-3 TI, D/L) (telescopic sight only)
    // Extreme (3x L)
    // -60 (-4 TI, D/L) (telescopic sight only)

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
    if (this.props.inCloseCombat) {
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
    const toRange = this.props.toRange;
    let perks = this.props.weapon.scope?.perks ?? [];

    const visionCheckBreakdown = this.props.skillHandler.visionCheck(
      toRange,
      this.props.darknessDetectionLevel,
      perks,
    );

    const dayBaseCheck = this.props.skillHandler.dayVisionBaseCheck(perks);
    let effect = this.weaponRangeEffect(toRange, dayBaseCheck.detectionLevel);

    if (effect === null || visionCheckBreakdown === null) {
      return null;
    }

    const visionCheck = visionCheckBreakdown.value();
    effect.visionCheck = visionCheckBreakdown;

    // If vision check is under 75, the difference is penalty to the
    // ranged skill check.
    if (visionCheck < RangedWeaponRow.VISION_CHECK_PENALTY_LIMIT) {
      effect.check += visionCheck - RangedWeaponRow.VISION_CHECK_PENALTY_LIMIT;
    }

    if (visionCheck < RangedWeaponRow.VISION_TARGET_INITIATIVE_PENALTY_LIMIT) {
      effect.targetInitiative +=
        (visionCheck - RangedWeaponRow.VISION_TARGET_INITIATIVE_PENALTY_LIMIT) / 10;
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
      toRange <= util.rounddown(this.props.skillHandler.getStat("int") / 2)
    ) {
      effect.targetInitiative +=
        this.props.skillHandler.skillLevel("Instinctive fire");
    }
    effect.bumpingAllowed = visionCheck >= RangedWeaponRow.VISION_BUMPING_LIMIT;
    effect.bumpingLevel = this.skillLevel();
    return effect;
  }

  skillLevel() {
    if (this.props.inCloseCombat) {
      return this.props.skillHandler.skillLevel("Instinctive fire") ?? 0;
    } else {
      return this.props.skillHandler.skillLevel(
        this.props.weapon.base.base_skill.name,
      );
    }
  }

  render() {
    const weapon = this.props.weapon.base;

    const actions = this.props.inCloseCombat
      ? [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5]
      : [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const headerStyle = { padding: 2 };
    const inlineHeaderStyle = Object.assign({}, headerStyle, {
      textAlign: "center",
    });

    const actionCells = actions.map((act, ii) => {
      return (
        <th key={`act-${ii}`} style={headerStyle}>
          {act}
        </th>
      );
    });

    const cellStyle = {
      padding: 2,
      minWidth: "2em",
      textAlign: "center",
      backgroundColor: "rgba(255, 255, 255, 0.5)",
    };
    const firstCellStyle = Object.assign({}, cellStyle, { minWidth: "8em" });
    const helpStyle = Object.assign({ color: "hotpink" }, cellStyle);
    const initStyle = Object.assign({ color: "red" }, cellStyle);

    const initiatives = this.initiatives(actions).map((init, ii) => {
      return (
        <td key={`init-${ii}`} style={initStyle}>
          {util.renderInt(init)}
        </td>
      );
    });

    const baseCheck = this.skillCheck();

    let skillChecks = this.skillChecksV2(actions, {
      useType: this.state.useType,
    });
    if (skillChecks == null) {
      skillChecks = (
        <td colSpan={10}>
          <strong>No attacks</strong>
        </td>
      );
    } else {
      if (weapon.autofire_only) {
        skillChecks = (
          <td colSpan={10}>
            <em>Weapon only supports autofire.</em>
          </td>
        );
      } else {
        skillChecks = skillChecks.map((chk, ii) => {
          let cellContent;
          if (chk) {
            cellContent = <StatBreakdown value={chk}/>;
          } else {
            cellContent = "";
          }
          return (
              <td key={`chk-${ii}`} style={cellStyle}>
                {cellContent}
              </td>
          );
        });
      }
    }

    const marginRightStyle = { marginRight: "1em" };
    const labelStyle = { marginRight: "0.5em" };

    let sweepInstructions = "";
    if (this.sweepAvailable()) {
      sweepInstructions = (
        <Row style={{ color: "hotpink" }}>
          <Col>
            <div>
              The distance between sweep targets may be up to 1 m (-5 penalty /
              target), or up to 2 m (-10 penalty / target).
            </div>

            <div>
              All range penalties are doubled in sweep fire (i.e. M -20, L -40,
              XL -60, E -80) (included in the calculated checks)
            </div>
            <div>Bumping is not allowed in sweep fire.</div>
          </Col>
        </Row>
      );
    }

    let scope = this.props.weapon.scope || {};

    const rof = this.rof(this.state.useType);

    const backgroundStyle = {
      scale: "800%",
      position: "absolute",
      fontWeight: "bold",
      transform: "rotate(-15deg)",
      color: "rgba(234,16,223,0.68)",
      top: "80px",
      left: "400px",
      zIndex: 0,
    };

    const rootStyle = Object.assign({}, this.props.style, {
      position: "relative",
    });
    const backgroundText =
      this.state.useType !== WeaponRow.FULL ? (
        <div style={backgroundStyle}>{this.state.useType}</div>
      ) : (
        ""
      );

    return (
      <div
        aria-label={`Firearm ${this.props.weapon.base.name}`}
        style={rootStyle}
      >
        <Row>
          <Col xs={"auto"}>
            <Row>
              <Col>
                <div
                  style={{
                    fontSize: "inherit",
                    position: "relative",
                    zIndex: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.0)",
                  }}
                >
                  <table
                    style={{
                      fontSize: "inherit",
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={headerStyle}>Weapon</th>
                        <th style={headerStyle}>Lvl</th>
                        <th style={headerStyle}>ROF</th>
                        {actionCells}
                        <th style={headerStyle}>TI</th>
                        <th style={headerStyle}>DI</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr aria-label={"Actions"}>
                        <td rowSpan="2" style={cellStyle}>
                          <div>
                            {weapon.name}
                            <Unskilled missingSkills={this.missingSkills()} />
                            <BaseCheck baseCheck={baseCheck} />
                          </div>
                        </td>
                        <td style={cellStyle} aria-label="Skill level">
                          {this.skillLevel()}
                        </td>
                        <td style={cellStyle} aria-label={"Rate of fire"}>
                          <StatBreakdown label={"ROF"} value={rof} />
                        </td>
                        {skillChecks}
                        <td
                          style={cellStyle}
                          aria-label={"Target initiative"}
                        >{`${util.renderInt(this.targetInitiative())}`}</td>
                        <td style={cellStyle}>{weapon.draw_initiative}</td>
                      </tr>
                      <tr aria-label={"Initiatives"}>
                        <td style={helpStyle} colSpan={2}>
                          I vs. 1 target
                        </td>
                        {initiatives}
                      </tr>
                      <tr>
                        <td style={firstCellStyle} rowSpan={2}>
                          <AmmoControl
                            ammo={this.props.weapon.ammo}
                            url={`/rest/ammunition/firearm/${encodeURIComponent(this.props.weapon.base.name)}/`}
                            onChange={async (value) =>
                              await this.handleAmmoChanged(value)
                            }
                          />
                        </td>
                        <th style={inlineHeaderStyle} colSpan={3}>
                          Damage
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          Dtype
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          S
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          M
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          L
                        </th>
                      </tr>
                      <tr>
                        <td style={cellStyle} colSpan={3} aria-label={"Damage"}>
                          {this.renderDamage()}
                        </td>
                        <td style={cellStyle} colSpan={2}>
                          {this.props.weapon.ammo.type}
                        </td>
                        <td
                          style={cellStyle}
                          colSpan={2}
                          aria-label={"Short range"}
                        >
                          {this.shortRange()}
                        </td>
                        <td
                          style={cellStyle}
                          colSpan={2}
                          aria-label={"Medium range"}
                        >
                          {this.mediumRange()}
                        </td>
                        <td
                          style={cellStyle}
                          colSpan={2}
                          aria-label={"Long range"}
                        >
                          {this.longRange()}
                        </td>
                      </tr>
                      <tr>
                        <td style={firstCellStyle} rowSpan={3}>
                          <ScopeControl
                            scope={this.props.weapon.scope}
                            url={`/rest/scopes/campaign/${this.props.campaign}/`}
                            onChange={async (value) =>
                              await this.handleScopeChanged(value)
                            }
                          />
                          <UseTypeControl
                            useType={this.state.useType}
                            onChange={async (value) =>
                              await this.handleUseTypeChange(value)
                            }
                          />
                        </td>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          Weight
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          Sight
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          <span style={{ whiteSpace: "nowrap" }}>Target-I</span>
                        </th>
                        <th style={inlineHeaderStyle} colSpan={6}>
                          Notes
                        </th>
                        <td style={cellStyle} rowSpan={2} colSpan={3}>
                          <Button
                            onClick={(e) => this.handleScopeRemove()}
                            disabled={this.props.weapon.scope === null}
                            size="sm"
                          >
                            Remove scope
                          </Button>
                        </td>
                      </tr>
                      <tr title={"Modifiers counted into checks already"}>
                        <td style={cellStyle} colSpan={2}>
                          {scope.weight}
                        </td>
                        <td style={cellStyle} colSpan={2}>
                          {scope.sight}
                        </td>
                        <td style={cellStyle} colSpan={2}>
                          {scope.target_i_mod}
                        </td>
                        <td style={cellStyle} colSpan={6}>
                          {scope.notes}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>
                          {scope.perks?.length && <strong>Perks</strong>}
                        </td>
                        <td colSpan={10}>
                          {scope.perks?.map((p, index) => {
                            return (
                              <span
                                key={`perk-${index}`}
                              >{`${p.edge.name} ${p.level}`}</span>
                            );
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {backgroundText}

                <div>
                  <span style={marginRightStyle}>
                    <label style={labelStyle}>Durability:</label>
                    {weapon.durability}
                  </span>
                  <span style={marginRightStyle}>
                    <label style={labelStyle}>Weight:</label>
                    {parseFloat(weapon.weight).toFixed(2)} kg
                  </span>
                  <span style={marginRightStyle}>
                    <label style={labelStyle}>Use type:</label>
                    <span aria-label={"Use type"}>{this.state.useType}</span>
                  </span>
                </div>
              </Col>
              <Col md={3}>{this.renderBurstTable()}</Col>
            </Row>
            <Row>
              <Col>
                <RangeInfo rangeEffect={this.rangeEffect(this.props.toRange)} />
              </Col>
            </Row>
            <Row>
              <Col>{this.renderSweepTable()}</Col>
            </Row>
            <MagazineControl
              firearm={this.props.weapon}
              onRemove={async (mag) => {
                await this.props.onMagazineRemove(mag);
              }}
              onAdd={async (mag) => {
                await this.props.onMagazineAdd(mag);
              }}
              onChange={async (mag) => {
                await this.props.onMagazineChange(mag);
              }}
            />
          </Col>
        </Row>
        {sweepInstructions}
        <Button
          onClick={(e) => this.handleRemove()}
          ref={(c) => (this._removeButton = c)}
          size="sm"
        >
          Remove firearm
        </Button>
      </div>
    );
  }
}

FirearmControl.propTypes = {
  skillHandler: PropTypes.object.isRequired,
  weapon: PropTypes.object.isRequired,
  campaign: PropTypes.number.isRequired,
  toRange: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  inCloseCombat: PropTypes.bool,
  darknessDetectionLevel: PropTypes.number,
  onRemove: PropTypes.func,
  onChange: PropTypes.func,
  onMagazineRemove: PropTypes.func,
  onMagazineAdd: PropTypes.func,
  onMagazineChange: PropTypes.func,
};

FirearmControl.defaultProps = {
  toRange: "",
  darknessDetectionLevel: 0,
  inCloseCombat: false,
};

export default FirearmControl;
