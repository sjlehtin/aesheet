import React from 'react';
import PropTypes from 'prop-types';

const util = require('./sheet-util');
import {Button} from 'react-bootstrap';
import StatBreakdown from "./StatBreakdown";
import ValueBreakdown from "./ValueBreakdown";

class WeaponRow extends React.Component {
    constructor(props) {
        super(props);
        this.readiedBaseI = -3;
        this.baseCheckBonusForSlowActions = 5;
        this.extraActionModifier = 10;
        this.penaltyCounterStat = "INT";
    }

    skillLevel() {
        return this.props.skillHandler.skillLevel(
            this.props.weapon.base.base_skill.name);
    }

    missingSkills() {
        const missing = [];
        const checkSkill = (skillName) => {
            if (skillName) {
                if (!this.props.skillHandler.hasSkill(skillName)) {
                    missing.push(skillName);
                }
            }
        };
        checkSkill(this.props.weapon.base.base_skill.name);
        for (let req of this.props.weapon.base.required_skills) {
            checkSkill(req.name)
        }
        return missing;
    }

    isSkilled() {
        return this.missingSkills().length === 0;
    }

    baseROA() {
        return parseFloat(this.props.weapon.base.roa) +
            (-0.15) * (this.props.weapon.size - 1) +
            parseFloat(this.props.weapon.quality.roa);
    }

    skillROAMultiplier() {
        const level = this.props.skillHandler.skillLevel(
            this.props.weapon.base.base_skill.name);
        if (level > 0) {
            return (1 + 0.1 * level);
        }
        return 1;
    }

    roa(useType) {
        if (!useType) {
            useType = WeaponRow.FULL;
        }
        let roa = this.baseROA();

        let specLevel;
        if (useType === WeaponRow.SPECIAL || useType === WeaponRow.FULL) {
            specLevel = this.props.skillHandler.skillLevel(
                "Single-weapon style");
            if (!util.isInt(specLevel)) {
                specLevel = 0;
            }
            roa += specLevel * 0.05;
        } else {
            specLevel = this.props.skillHandler.skillLevel(
                "Two-weapon style");
            if (!util.isInt(specLevel)) {
                specLevel = 0;
            }
            let mod;
            if (useType === WeaponRow.PRI) {
                mod = -0.25;
            } else if (useType === WeaponRow.SEC) {
                mod = -0.5;
            }
            mod += specLevel * 0.05;

            roa += Math.min(mod, 0);
        }
        roa *= this.skillROAMultiplier();
        return {value: Math.min(roa, 2.5), breakdown: []};
    }

    ccv() {
        return this.props.weapon.base.ccv + this.props.weapon.quality.ccv +
            (this.props.weapon.size - 1) * 5;
    }

    dp() {
        return Math.round(this.props.weapon.base.dp *
            parseFloat(this.props.weapon.quality.dp_multiplier) *
            Math.pow(2, (this.props.weapon.size - 1)));
    }

    bypass() {
        return this.props.weapon.base.bypass +
                this.props.weapon.quality.bypass +
            - (this.props.weapon.size - 1);
    }

    drawInitiative() {
        return this.props.weapon.base.draw_initiative -
            2 * (this.props.weapon.size - 1);
    }

    skillCheck() {
        const gottenCheck = this.props.skillHandler.skillCheck(
            this.props.weapon.base.base_skill.name);

        if (!gottenCheck) {
            return null;
        }

        const bd = new ValueBreakdown()

        bd.addBreakdown(gottenCheck)

        const ccv = this.ccv();
        bd.add(ccv, "CCV")

        if (!this.isSkilled()) {
            bd.add(this.props.weapon.base.ccv_unskilled_modifier,
                "unskilled")
        }
        return bd
    }

    static checkMod(roa, act, baseBonus, extraActionModifier) {
        if (1 / act >= 1 / roa + 1) {
            return baseBonus;
        }
        if (act < 0.5 * roa) {
            return roa / act;
        }
        /* Gap.*/
        if (act > roa) {
            return -act / roa * 20 + extraActionModifier;
        }

        // Value in the gap.
        return 0;
    }

    static counterPenalty(modifier, stat) {
        if (modifier > 0) {
            /* Not a penalty, a bonus. */
            return modifier;
        }
        return Math.min(0, modifier + util.rounddown((stat - 45) / 3))
    }

    static counterPenaltyV2(stat) {
        return util.rounddown((stat - 45) / 3)
    }

    getStat(stat) {
        return this.props.skillHandler.getStat(stat);
    }

    skillChecksV2(actions, givenProps) {
        let props = {useType: WeaponRow.FULL, counterPenalty: true};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }

        const roa = this.roa(props.useType).value;
        const baseCheck = this.skillCheck();
        if (!baseCheck) {
            // Actions not available.
            return null; //actions.map((e) => {return null;});
        }
        const checks = [];

        if (props.useType === WeaponRow.SEC) {
            if (!this.props.weapon.base.is_shield) {
                const wrongHandPenalty = -25;

                baseCheck.add(wrongHandPenalty, "Wrong hand penalty")

                const counter = Math.min(
                    this.props.skillHandler.edgeLevel("Ambidexterity") * 5,
                    -wrongHandPenalty);

                baseCheck.add(counter, "Counter from Ambidexterity")
            }
        }

        for (let act of actions) {
            if (act > 2 * roa) {
                checks.push(null);
            } else {
                const bd = new ValueBreakdown()

                bd.addBreakdown(baseCheck)

                const mod = Math.round(WeaponRow.checkMod(roa, act,
                    this.baseCheckBonusForSlowActions,
                    this.extraActionModifier));

                bd.add(mod, "ROA")

                // TODO: counterPenalty is a bad name, as a bad stat will give actual penalty for actions with these, see AE2K_Weapons_17.xls
                if (props.counterPenalty) {
                    let counter = WeaponRow.counterPenaltyV2(
                        this.getStat(this.penaltyCounterStat))
                    if (counter > 0) {
                        if (mod > 0) {
                            counter = 0
                        } else {
                            counter = Math.min(counter, -mod)
                        }
                    }

                    bd.add(counter, `Modifier from ${this.penaltyCounterStat}`)
                }
                checks.push(bd)
            }
        }
        return checks;
    }

    defenseInitiatives(actions, givenProps) {
        let props = {canReady: false,
            maxActionMultiplier: 4,
            baseIMultipliers: [0, 3, 6, 0, 3, 6, 0, 3, 6]};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        return this.initiatives(actions, props);
    }


    targetInitiative() {
        let targetI = this.props.weapon.base.target_initiative;
        if (!targetI) {
            targetI = 0;
        }
        return targetI;
    }

    initiatives(actions, givenProps) {
        let props = {
            /* Whether the weapon can be readied with a multi-turn action. */
            canReady: true,
            /* 2 for attacks, 4 for defenses. */
            maxActionMultiplier: 2,
            baseIMultipliers: [1, 4, 7, 2, 5, 8, 3, 6, 9],
            useType: WeaponRow.FULL
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        const rof = this.roa(props.useType).value;
        const baseI = -5 / rof;
        const readiedBaseI = this.readiedBaseI;
        let targetI = this.targetInitiative();
        if (targetI === null) {
            // Range too long, actions are not available.
            return actions.map((e) => {return null;});
        }
        const initiative = this.props.skillHandler.getInitiative();

        const initiatives = [];
        for (let act of actions) {
            if (act > props.maxActionMultiplier * rof) {
                initiatives.push(null);
            } else {
                if (props.canReady && rof > 2 * act && act < 1) {
                    /* Assuming multi-turn action, where readying of the
                     weapon is possible and target has already been
                     acquired.  House Rules, initiative, p. 8. */
                    initiatives.push(
                        Math.max(readiedBaseI, baseI) +
                        Math.min(targetI + 3, 0));
                } else {
                    /* One target acquire is assumed for the rest of the
                     initiatives.  If target is changed, target-I should
                     be added to the rest of the initiatives.
                     */
                    initiatives.push(
                        props.baseIMultipliers[Math.ceil(act) - 1] * baseI +
                        targetI);
                }
            }
        }
        return initiatives.map(function (el) {
            if (el !== null) {
                return Math.round(el + initiative);
            }
            else {
                return null
            }
        });
    }

    durability() {
        return this.props.weapon.base.durability +
            this.props.weapon.quality.durability +
            2 * (this.props.weapon.size - 1);
    }

    fitDamageBonus(useType) {
        /* Martial arts expertise skill grants a bonus to damage. */
        const maeLevel = this.props.skillHandler.skillLevel("Martial arts" +
            " expertise");

        let ccFITBonus = this.getStat("fit") - 45;
        if (maeLevel > 0) {
            ccFITBonus += maeLevel * 5;
        }

        const fitBonusDmg = util.rounddown(ccFITBonus /
            WeaponRow.damageFITModifiers[useType]);
        const fitLethBonus = util.rounddown(ccFITBonus /
            WeaponRow.lethalityFITModifiers[useType]);
        return {damage: fitBonusDmg, leth: fitLethBonus};
    }

    renderDamage(givenProps) {
        let props = {defense: false, useType: WeaponRow.FULL};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        const base = this.props.weapon.base;
        const quality = this.props.weapon.quality;
        const numDice = base.num_dice * this.props.weapon.size;

        let extraDamage = base.extra_damage * this.props.weapon.size
            + quality.damage;

        let leth = base.leth + (this.props.weapon.size - 1) + quality.leth;
        let plusLeth = base.plus_leth + quality.plus_leth;
        if (props.defense) {
            plusLeth = null;
            leth = base.defense_leth + (this.props.weapon.size - 1) +
                quality.defense_leth;
        }

        /* Damage is capped to twice the base damage of the weapon (incl.
         size and quality). */
        const maxDmg = numDice * base.dice + extraDamage;
        const {damage: fitBonusDmg, leth: fitLethBonus} =
            this.fitDamageBonus(props.useType);
        extraDamage += Math.min(fitBonusDmg, maxDmg);
        leth = Math.min(leth + fitLethBonus, this.durability() + 1);

        return `${numDice}d${base.dice}${
            extraDamage ? this.renderInt(extraDamage) : ''
            }/${leth}${plusLeth ? this.renderInt(plusLeth) : ''}`;
    }

    renderInt(value) {
        return util.renderInt(value);
    }

    handleRemove() {
        if (this.props.onRemove) {
            this.props.onRemove({id: this.props.weapon.id});
        }
    }

    oneHandedUseRequiresSkill(wpn) {
        for (let req of wpn.required_skills) {
            if (req.name === "One-handed use")
                return true
        }
        return false
    }

    oneHandedUseAvailable() {
        if (this.oneHandedUseRequiresSkill(this.props.weapon.base)) {
            return this.props.skillHandler.hasSkill("One-handed use");
        } else {
            return true;
        }
    }

    renderUseType(useType) {
        if (useType === WeaponRow.PRI || useType === WeaponRow.SEC) {
            if (!this.oneHandedUseAvailable()) {
                return <tr aria-label={`Action row for ${useType}`}>
                    <td colSpan={19} style={{color: "red", textAlign: "left"}}
                    >Unskilled for one-handed use</td></tr>
            }
        }
        const cellStyle = {padding: 2, borderStyle: "dotted", borderWidth: 1,
            minWidth: "2em", textAlign: "center"};
        const initStyle = Object.assign({color: "red"}, cellStyle);
        const defenseInitStyle = Object.assign({color: "blue"}, cellStyle);
        const attackDamageStyle = initStyle;
        const defenseDamageStyle = defenseInitStyle;

        const checks = this.skillChecksV2(WeaponRow.ccActions,
            {useType: useType});

        let checkCells;
        if (checks == null) {
            checkCells = <td colSpan={9}><strong>Range too long!</strong></td>;
        } else {
            checkCells = checks.map((el, ii) => {
                let cellContent;
                if (el) {
                    cellContent = <StatBreakdown value={el.value()}
                                                 breakdown={el.breakdown()}/>
                } else {
                    cellContent = ""
                }
                return <td key={`chk-${ii}`} style={cellStyle} aria-label={`Attack for ${useType}`}>{cellContent}</td>;
            });
        }
        const attackInitiatives = this.initiatives([1, 2, 3, 4],
            {useType: useType});
        const attackInitiativeCells = attackInitiatives.map((el, ii) => {
            return <td key={`ai-${ii}`} style={initStyle} aria-label={`Attack initiative for ${useType}`}
            >{this.renderInt(el)}</td>;});

        const defenseInitiatives = this.defenseInitiatives([1, 2, 3],
            {useType: useType});
        const defenseInitiativeCells = defenseInitiatives.map((el, ii) => {
            return <td key={`di-${ii}`} style={defenseInitStyle} aria-label={`Defense initiative for ${useType}`}
            >{this.renderInt(el)}</td>;});

        return <tr aria-label={`Action row for ${useType}`}><td style={cellStyle} aria-label={`ROA for ${useType}`}>{this.roa(useType).value.toFixed(2)}</td>
            {checkCells}
            {attackInitiativeCells}
            <td style={attackDamageStyle} aria-label={`Attack damage for ${useType}`}>{
                this.renderDamage({useType: useType})}</td>
            {defenseInitiativeCells}
            <td style={defenseDamageStyle}  aria-label={`Defense damage for ${useType}`}>{
                this.renderDamage({useType: useType,
                                   defense: true})}</td>
        </tr>;
    }

    weaponName() {
        return this.props.weapon.name;
    }

    render() {
        const headerStyle = {padding: 2};
        const nameStyle = Object.assign({}, headerStyle, {width: "10em"});
        const cellStyle = {padding: 2};
        const infoStyle = {marginRight: 5};
        const actionCells = WeaponRow.ccActions.map((el, ii) => {
            return <th style={headerStyle} key={`act-${ii}`}>{el.toFixed(1)}</th>;
        });

        const baseCheck = this.skillCheck();

        // TODO: extract?
        let baseCheckContainer;
        if (baseCheck) {
            const baseCheckStyle = {display: 'inline-block', fontSize: "80%", marginLeft: "2em", color: "gray"}
            baseCheckContainer = <div><label id={"base-check"} style={baseCheckStyle}>Base check</label><span
                aria-labelledby={"base-check"}><StatBreakdown
                value={baseCheck.value()}
                breakdown={baseCheck.breakdown()}
                style={baseCheckStyle}/></span></div>
        }

        return <div style={this.props.style}>
            <table style={{fontSize: 'inherit'}}>
                <thead>
                  <tr>
                    <th style={nameStyle}>Weapon</th>
                    <th style={headerStyle}>Lvl</th>
                    <th style={headerStyle}>ROA</th>
                      {actionCells}
                    <th style={headerStyle} colSpan={5}>Attacks</th>
                    <th style={headerStyle} colSpan={4}>Defenses</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                    <td style={cellStyle} rowSpan={4}>{this.weaponName()}
                        {baseCheckContainer}</td>
                    <td style={cellStyle} rowSpan={4}>{this.skillLevel()}</td>
                </tr>
                {this.renderUseType(WeaponRow.FULL)}
                {this.renderUseType(WeaponRow.PRI)}
                {this.renderUseType(WeaponRow.SEC)}
      </tbody>
</table>
            <div>
            <span style={infoStyle}><label>CCV</label> <span aria-label={"Close combat value"}>{this.ccv()}</span></span>
            <span style={infoStyle}><label>Draw-I:</label> <span aria-label={"Draw initiative"}>{this.drawInitiative()}</span></span>
            <span style={infoStyle} className="durability">
                <label>Durability:</label><span aria-label={"Durability"}>{this.durability()}</span></span>
            <span style={infoStyle}><label>Size:</label> {this.props.weapon.size}</span>
            <span style={infoStyle}><label>DP:</label><span aria-label={"Damage points"}>{this.dp()}</span></span>
            <span style={infoStyle}><label>Bypass:</label> <span aria-label={"Bypass"}>{this.bypass()}</span></span>
            <span style={infoStyle}><label>Weight:</label> <span aria-label={"Weight"}>{util.itemWeight(this.props.weapon).toFixed(2)} kg</span></span>
                    <Button onClick={(e) => this.handleRemove()}
                            ref={(c) => this._removeButton = c}
                            size="sm"
                    >Remove</Button>
            </div>
        </div>;
    }
}

WeaponRow.SPECIAL = "SPECIAL";
WeaponRow.FULL = "FULL";
WeaponRow.PRI = "PRI";
WeaponRow.SEC = "SEC";

WeaponRow.ccActions = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5];
WeaponRow.damageFITModifiers = {
    SPECIAL: 5,
    FULL: 7.5,
    PRI: 10,
    SEC: 15
};

WeaponRow.lethalityFITModifiers = {
    SPECIAL : 20,
    FULL : 30,
    PRI : 40,
    SEC : 60
};

WeaponRow.props = {
    skillHandler: PropTypes.object.isRequired,
    weapon: PropTypes.object.isRequired,
    onRemove: PropTypes.func
};

export default WeaponRow;