import React from 'react';
var util = require('sheet-util');
import {Col, Row, Button} from 'react-bootstrap';

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
            this.props.weapon.base.base_skill);
    }

    missingSkills() {
        var missing = [];
        var checkSkill = (skillName) => {
            if (skillName) {
                if (!this.props.skillHandler.hasSkill(skillName)) {
                    missing.push(skillName);
                }
            }
        };
        checkSkill(this.props.weapon.base.base_skill);
        checkSkill(this.props.weapon.base.skill);
        checkSkill(this.props.weapon.base.skill2);
        return missing;
    }

    isSkilled() {
        return this.missingSkills().length === 0;
    }

    roa(useType) {
        if (!useType) {
            useType = WeaponRow.FULL;
        }
        var roa = parseFloat(this.props.weapon.base.roa) +
            (-0.15) * (this.props.weapon.size - 1) +
            parseFloat(this.props.weapon.quality.roa);

        var specLevel;
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
            var mod;
            if (useType === WeaponRow.PRI) {
                mod = -0.25;
            } else if (useType === WeaponRow.SEC) {
                mod = -0.5;
            }
            mod += specLevel * 0.05;

            roa += Math.min(mod, 0);
        }
        var level = this.props.skillHandler.skillLevel(
            this.props.weapon.base.base_skill);
        if (level > 0) {
            roa *= (1 + 0.1 * level);
        }

        return Math.min(roa, 2.5);
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
        var check = this.props.skillHandler.skillCheck(
            this.props.weapon.base.base_skill);

        check += this.ccv();

        if (!this.isSkilled()) {
            check += this.props.weapon.base.ccv_unskilled_modifier;
        }
        return check;
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

    getStat(stat) {
        return this.props.skillHandler.getStat(stat);
    }

    skillChecks(actions, givenProps) {
        var props = {useType: WeaponRow.FULL, counterPenalty: true}
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }

        var roa = this.roa(props.useType);
        var baseCheck = this.skillCheck();

        var checks = [];


        if (props.useType === WeaponRow.SEC) {
            if (!this.props.weapon.base.is_shield) {
                baseCheck += Math.min(-25 + this.props.skillHandler
                        .edgeLevel("Ambidexterity") * 5, 0);
            }
        }
        for (let act of actions) {
            if (act > 2 * roa) {
                checks.push(null);
            } else {
                var mod = Math.round(WeaponRow.checkMod(roa, act,
                    this.baseCheckBonusForSlowActions,
                    this.extraActionModifier));

                if (props.counterPenalty) {
                    mod = WeaponRow.counterPenalty(mod,
                        this.getStat(this.penaltyCounterStat));
                }
                checks.push(mod + baseCheck);
            }
        }
        return checks;
    }

    defenseInitiatives(actions, givenProps) {
        var props = {canReady: false,
            maxActionMultiplier: 4,
            baseIMultipliers: [0, 3, 6, 0, 3, 6, 0, 3, 6]};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        return this.initiatives(actions, props);
    }

    initiatives(actions, givenProps) {
        var props = {
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
        var rof = this.roa(props.useType);
        var baseI = -5 / rof;
        var readiedBaseI = this.readiedBaseI;
        var base = this.props.weapon.base;
        var targetI = base.target_initiative;
        if (!targetI) {
            targetI = 0;
        }
        var initiative = this.getStat('ref') / 10 +
            this.getStat('int') / 20 +
            this.getStat('psy') / 20;

        var initiatives = [];
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

    renderDamage(givenProps) {
        var props = {defense: false, useType: WeaponRow.FULL};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        var base = this.props.weapon.base;
        var quality = this.props.weapon.quality;
        var numDice = base.num_dice * this.props.weapon.size;

        var extraDamage = base.extra_damage * this.props.weapon.size
            + quality.damage;

        var leth = base.leth + (this.props.weapon.size - 1) + quality.leth;
        var plusLeth = base.plus_leth + quality.plus_leth;
        if (props.defense) {
            plusLeth = null;
            leth = base.defense_leth + (this.props.weapon.size - 1) +
                quality.defense_leth;
        }

        /* Damage is capped to twice the base damage of the weapon (incl.
         size and quality). */
        var maxDmg = numDice * base.dice + extraDamage;

        /* Martial arts expertise skill grants a bonus to damage. */
        var maeLevel = this.props.skillHandler.skillLevel("Martial arts" +
            " expertise");

        var ccFITBonus = this.getStat("fit") - 45;
        if (maeLevel > 0) {
            ccFITBonus += maeLevel * 5;
        }

        var fitBonusDmg = util.rounddown(ccFITBonus /
            WeaponRow.damageFITModifiers[props.useType]);
        var fitLethBonus = util.rounddown(ccFITBonus /
            WeaponRow.lethalityFITModifiers[props.useType]);

        extraDamage += Math.min(fitBonusDmg, maxDmg);
        leth = Math.min(leth + fitLethBonus, this.durability() + 1);

        return `${numDice}d${base.dice}${
            extraDamage ? this.renderInt(extraDamage) : ''
            }/${leth}${plusLeth ? this.renderInt(plusLeth) : ''}`;
    }

    renderInt(value) {
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

    handleRemove() {
        if (this.props.onRemove) {
            this.props.onRemove({id: this.props.weapon.id});
        }
    }

    oneHandedUseAvailable() {
        if ([this.props.weapon.base.skill, this.props.weapon.base.skill2]
                .indexOf("One-handed use") >= 0) {
            return this.props.skillHandler.hasSkill("One-handed use");
        } else {
            return true;
        }
    }
    renderUseType(useType) {
        if (useType === WeaponRow.PRI || useType === WeaponRow.SEC) {
            if (!this.oneHandedUseAvailable()) {
                return <tr colSpan={19}>
                    <td style={{color: "red", textAlign: "left"}}
                    >Unskilled for one-handed use</td></tr>
            }
        }
        var cellStyle = {padding: 2, borderStyle: "dotted", borderWidth: 1, minWidth: "2em",
            textAlign: "center"};
        var initStyle = Object.assign({color: "red"}, cellStyle);
        var defenseInitStyle = Object.assign({color: "blue"}, cellStyle);
        var attackDamageStyle = initStyle;
        var defenseDamageStyle = defenseInitStyle;

        var roa = this.roa(useType);
        var checks = this.skillChecks(WeaponRow.ccActions,
            {useType: useType});
        var checkCells = checks.map((el, ii) => {
            return <td key={`chk-${ii}`} style={cellStyle}>{el}</td>;});
        var attackInitiatives = this.initiatives([1, 2, 3, 4],
            {useType: useType});
        var attackInitiativeCells = attackInitiatives.map((el, ii) => {
            return <td key={`ai-${ii}`} style={initStyle}
            >{this.renderInt(el)}</td>;});
        var defenseInitiatives = this.defenseInitiatives([1, 2, 3],
            {useType: useType});
        var defenseInitiativeCells = defenseInitiatives.map((el, ii) => {
            return <td key={`ai-${ii}`} style={defenseInitStyle}
            >{this.renderInt(el)}</td>;});

        var damage = this.renderDamage({useType: useType});
        var defenseDamage = this.renderDamage({useType: useType,
            defense: true});

        return <tr><td style={cellStyle}>{roa.toFixed(2)}</td>
            {checkCells}
            {attackInitiativeCells}
            <td style={attackDamageStyle}>{damage}</td>
            {defenseInitiativeCells}
            <td style={defenseDamageStyle}>{defenseDamage}</td>
        </tr>;
    }

    render() {
        var headerStyle = {padding: 2};
        var cellStyle = {padding: 2};
        var infoStyle = {marginRight: 5};
        var actionCells = WeaponRow.ccActions.map((el, ii) => {
            return <th style={headerStyle} key={`act-${ii}`}>{el.toFixed(1)}</th>;
        });

        return <div style={this.props.style}>
            <table style={{fontSize: 'inherit'}}>
                <thead>
                  <tr>
                    <th style={headerStyle}>Weapon</th>
                    <th style={headerStyle}>Lvl</th>
                    <th style={headerStyle}>ROA</th>
                      {actionCells}
                    <th style={headerStyle} colSpan={5}>Attacks</th>
                    <th style={headerStyle} colSpan={4}>Defenses</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                    <td style={cellStyle} rowSpan={4}>{
                        this.props.weapon.name}</td>
                    <td style={cellStyle} rowSpan={4}>{this.skillLevel()}</td>
                </tr>
                {this.renderUseType(WeaponRow.FULL)}
                {this.renderUseType(WeaponRow.PRI)}
                {this.renderUseType(WeaponRow.SEC)}
      </tbody>
</table>
            <div>
            <span style={infoStyle}><label>Draw-I:</label> {this.drawInitiative()}</span>
            <span style={infoStyle} className="durability">
                <label>Durability:</label>{this.durability()}</span>
            <span style={infoStyle}><label>Size:</label> {this.props.weapon.size}</span>
            <span style={infoStyle}><label>DP:</label> {this.dp()}</span>
            <span style={infoStyle}><label>Bypass:</label> {this.bypass()}</span>
                    <Button onClick={(e) => this.handleRemove()}
                            ref={(c) => this._removeButton = c}
                            bsSize="xsmall"
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
    skillHandler: React.PropTypes.object.isRequired,
    weapon: React.PropTypes.object.isRequired,
    onRemove: React.PropTypes.func
};

export default WeaponRow;