import React from 'react';
import PropTypes from 'prop-types';

import WeaponRow from 'WeaponRow';
import ValueBreakdown from "./ValueBreakdown";
import StatBreakdown from "StatBreakdown";
const util = require('./sheet-util');
import {Button} from 'react-bootstrap';
import {isFloat} from "./sheet-util";

class RangedWeaponRow extends WeaponRow {
    constructor(props) {
        super(props);

        this.readiedBaseI = -1;
        this.baseCheckBonusForSlowActions = 10;
        this.extraActionModifier = 10;
        this.penaltyCounterStat = "FIT";
    }

    skillCheck() {
        const gottenCheck = this.props.skillHandler.skillCheck(
            this.props.weapon.base.base_skill.name);

        if (!gottenCheck) {
            return null;
        }

        const bd = new ValueBreakdown()

        bd.addBreakdown(gottenCheck)

        const unskilledPenalty = -10;

        if (this.props.weapon.base.skill) {
            if (!this.props.skillHandler.hasSkill(
                    this.props.weapon.base.skill.name)) {
                bd.add(unskilledPenalty, `unskilled (${this.props.weapon.base.skill.name})`)
            }
        }

        if (this.props.weapon.base.skill2) {
            if (!this.props.skillHandler.hasSkill(
                    this.props.weapon.base.skill2.name)) {
                bd.add(unskilledPenalty, `unskilled (${this.props.weapon.base.skill2.name})`)
            }
        }

        return bd
    }

    roa(useType) {
        var roa = this.baseROA();
        roa *= this.skillROAMultiplier();

        if (this.props.weapon.base.base_skill.name === "Bow") {
            var level = this.props.skillHandler.skillLevel("Rapid archery");
            if (level > 0) {
                roa += level * 0.05;
            }
        }
        return {
            value: Math.min(roa, 5.0),
            breakdown: []
        };
    }

    rof(useType) {
        return this.roa(useType);
    }

    fitDamageBonus(useType) {
        var base = this.props.weapon.base;

        if (base.base_skill.name === "Crossbow") {
            fitBonusDmg = 0;
            fitLethBonus = 0
        } else {
            var quality = this.props.weapon.quality;
            var fit = this.getStat("fit");
            /* Cap the damage according to max pull of the bow.*/
            if (base.base_skill.name === "Bow" && quality.max_fit) {
                fit = Math.min(quality.max_fit, fit);
            }
            var ccFITBonus = fit - 45;
            var fitBonusDmg = util.rounddown(ccFITBonus /
                WeaponRow.damageFITModifiers[WeaponRow.PRI]);
            var fitLethBonus = util.rounddown(ccFITBonus /
                WeaponRow.lethalityFITModifiers[WeaponRow.PRI]);
        }
        return {damage: fitBonusDmg, leth: fitLethBonus};
    }

    weaponRangeEffect(toRange) {
        // Range
        // +2 TI, D/L (+2 to target initiative and damage and lethality)
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
        const shortRangeEffect = {
            check: 0,
            targetInitiative: 0,
            damage: 0,
            leth: 0,
            name: "Short"
        };

        if (!toRange && !isFloat(toRange)) {
            return shortRangeEffect;
        }
        const shortRange = this.shortRange();
        const longRange = this.longRange();

        if (toRange < 0.5) {
            // TODO: firearm only
            return {
                check: 60,
                targetInitiative: 2,
                damage: 2,
                leth: 2,
                name: "Contact"
            };
        } else if (toRange <= 1) {
            // TODO: firearm only
            return {
                check: 50,
                targetInitiative: 2,
                damage: 2,
                leth: 2,
                name: "Close"
            };
        } else if (toRange <= 3) {
            return {
                check: 40,
                targetInitiative: 1,
                damage: 1,
                leth: 1,
                name: "Point-blank"
            };
        } else if (toRange <= shortRange/8) {
            return {
                check: 30,
                targetInitiative: 1,
                damage: 1,
                leth: 1,
                name: "XXS"
            };
        } else if (toRange <= shortRange/4) {
            return {
                check: 20,
                targetInitiative: 0,
                damage: 0,
                leth: 0,
                name: "Extra-short"
            };

        } else if (toRange <= shortRange/2) {
            return {
                check: 10,
                targetInitiative: 0,
                damage: 0,
                leth: 0,
                name: "Very short"
            };

        } else if (toRange <= shortRange) {
            return shortRangeEffect;
        } else if (toRange <= this.mediumRange()) {
            return {
                check: -10,
                targetInitiative: 0,
                damage: 0,
                leth: 0,
                name: "Medium"
            };
        } else if (toRange <= longRange) {
            return {
                check: -20,
                targetInitiative: 0,
                damage: 0,
                leth: 0,
                name: "Long"
            };
        } else if (toRange <= 1.5*longRange) {
            return {
                check: -30,
                targetInitiative: -1,
                damage: -1,
                leth: -1,
                name: "Extra-long"
            };
        } else if (toRange <= 2*longRange) {
            return {
                check: -40,
                targetInitiative: -2,
                damage: -2,
                leth: -2,
                name: "XXL"
            };
        } else if (toRange <= 2.5*longRange) {
            // XXXL
            // TODO: check scope
            return null;
        } else if (toRange <= 3*longRange) {
            // Extreme
            // TODO: check scope
            return null;
        }

        return null;
    }

    rangeEffect(toRange) {
        let effect = this.weaponRangeEffect(toRange);
        let perks = [];

        if (this.props.weapon.scope) {
            perks = this.props.weapon.scope.perks;
        }
        const visionCheck = this.props.skillHandler.visionCheck(toRange,
            this.props.darknessDetectionLevel,
            perks);

        effect.visionCheck = visionCheck
        if (effect === null || visionCheck === null) {
            return null;
        }

        // If vision check is under 75, the difference is penalty to the
        // ranged skill check.
        if (visionCheck < 75) {
            effect.check += visionCheck - 75;
        }

        // Instinctive Fire
        // Although listed under the Throwing weapons skill, the Instinctive
        // fire enhancement is applicable to all missile weapons. The Inst
        // fire skill level cannot be higher than the highest missile weapon
        // skill level.
        // Instinctive fire grants the PC a +1 bonus per level to Target-I
        // with ranged weapons. The skill cannot raise the Target-I above 0.
        // The skill can be used up to INT/2 m range.

        if (util.isFloat(toRange) && toRange <= util.rounddown(
            this.props.skillHandler.getStat("int") / 2)) {
            effect.targetInitiative +=
                this.props.skillHandler.skillLevel("Instinctive fire");
        }
        effect.bumpingAllowed = visionCheck >= 100;
        return effect;
    }

    render() {
        const headerStyle = {padding: 2};
        const cellStyle = {padding: 2, minWidth: "2em", textAlign: "center"};
        const initStyle = Object.assign({color: "red"}, cellStyle);
        const infoStyle = {marginRight: 5};
        const helpStyle = {color: "hotpink"};

        const actions = [0.5, 1, 2, 3, 4, 5];
        const actionCells = actions.map((el, ii) => {
            return <th style={headerStyle} key={`act-${ii}`}>{el}</th>;
        });
        let checkCells = this.skillChecksV2(actions);
        if (checkCells === null) {
            checkCells = <td colSpan={6}>Unable to use weapon</td>;
        } else {
            checkCells = checkCells.map((el, ii) => {
                let cellContent;
                if (el) {
                    cellContent = <StatBreakdown value={el.value()}
                                                 breakdown={el.breakdown()}/>
                } else {
                    cellContent = ""
                }
                return <td style={cellStyle} key={`chk-${ii}`}>{cellContent}</td>;
            });
        }
        const initCells = this.initiatives(actions).map((el, ii) =>
        { return <td style={initStyle} key={`init-${ii}`}>{util.renderInt(el)}</td>; });

        const base = this.props.weapon.base;

        function calculateRange(r, g) {
            // Low-G does not improve range in other than extreme range.
            if (g < 1) {
                g = 1.0
            }
            return util.rounddown(r / (g ?? 1.0))
        }

        return <div style={this.props.style}>
            <table style={{fontSize: 'inherit'}}>
                <thead>
                <tr>
                    <th style={headerStyle}>Weapon</th>
                    <th style={headerStyle}>Lvl</th>
                    <th style={headerStyle}>ROF</th>
                    {actionCells}
                    <th style={headerStyle}>TI</th>
                    <th style={headerStyle}>DI</th>
                    <th style={headerStyle}>Damage</th>
                    <th style={headerStyle}>S</th>
                    <th style={headerStyle}>M</th>
                    <th style={headerStyle}>L</th>
                </tr>
                </thead>
                <tbody>
                <tr aria-label={"Actions"}>
                    <td style={cellStyle} rowSpan={2}>{
                        this.weaponName()}</td>
                    <td style={cellStyle}>{this.skillLevel()}</td>
                    <td style={cellStyle} aria-label={"Rate of fire"}>{this.rof().value.toFixed(2)}</td>
                    {checkCells}
                    <td style={cellStyle}>{this.targetInitiative()}</td>
                    <td style={cellStyle}>{this.drawInitiative()}</td>
                    <td style={cellStyle} aria-label={"Damage"}>{this.renderDamage()}</td>
                    <td style={cellStyle} aria-label={"Short range"}>{calculateRange(base.range_s, this.props.gravity)}</td>
                    <td style={cellStyle} aria-label={"Medium range"}>{calculateRange(base.range_m, this.props.gravity)}</td>
                    <td style={cellStyle} aria-label={"Long range"}>{calculateRange(base.range_l, this.props.gravity)}</td>
                </tr>
                <tr>
                    <td colSpan={2}><span style={helpStyle}>I vs. 1 target</span></td>
                    {initCells}
                    <td colSpan={4}>Max pull: {this.props.weapon.quality.max_fit}</td>
                </tr>
      </tbody>
</table>
            <div>
            <span style={infoStyle}><label>Bypass:</label> {this.bypass()}</span>
            <span style={infoStyle} className="durability">
                <label>Durability:</label>{this.durability()}</span>
            <span style={infoStyle}><label>DP:</label> {this.dp()}</span>
            <span style={infoStyle}><label>Size:</label> {this.props.weapon.size}</span>
                    <Button onClick={(e) => this.handleRemove()}
                            size="sm"
                    >Remove</Button>
            </div>
        </div>;
    }

}

RangedWeaponRow.props = {
    skillHandler: PropTypes.object.isRequired,
    weapon: PropTypes.object.isRequired,
    onRemove: PropTypes.func,
    gravity: PropTypes.number
};

RangedWeaponRow.defaultProps = {
    gravity: 1.0
};

export default RangedWeaponRow;