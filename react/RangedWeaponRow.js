import React from 'react';
import PropTypes from 'prop-types';

import WeaponRow from 'WeaponRow';
import ValueBreakdown from "./ValueBreakdown";
import StatBreakdown from "StatBreakdown";
const util = require('./sheet-util');
import {Button} from 'react-bootstrap';
import {isFloat} from "./sheet-util";
import {Unskilled} from "./Unskilled";
import {BaseCheck} from "./BaseCheck";

function calculateRange(r, g) {
    // Low-G does not improve range in other than extreme range.
    if (g < 1) {
        g = 1.0
    }
    return util.rounddown(r / (g ?? 1.0))
}

class RangedWeaponRow extends WeaponRow {
    VISION_CHECK_PENALTY_LIMIT = 45
    VISION_TARGET_INITIATIVE_PENALTY_LIMIT = 95
    VISION_BUMPING_LIMIT = 95

    constructor(props) {
        super(props);

        this.readiedBaseI = -1;
        this.baseCheckBonusForSlowActions = 10;
        this.extraActionModifier = 10;
    }

    penaltyCounterStat() {
        return "FIT"
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

        const missing = this.missingSkills()
        if (missing.length) {
            for (let sk in missing) {
                bd.add(unskilledPenalty, `unskilled (${sk})`)
            }
        }
        return bd
    }

    roa(useType) {
        const roa = this.baseROA();
        roa.multiply(this.skillROAMultiplier(), "from skill")

        if (this.props.weapon.base.base_skill.name === "Bow") {
            roa.add(this.props.skillHandler.skillLevel("Rapid archery") * 0.05, "Rapid archery")
        }
        roa.setMaximum(5.0, "Max ROF");
        return roa
    }

    rof(useType) {
        return this.roa(useType);
    }

    fitDamageBonus(useType) {
        const base = this.props.weapon.base;

        let fitLethBonus
        let fitBonusDmg

        if (base.base_skill.name === "Crossbow") {
            fitBonusDmg = 0;
            fitLethBonus = 0
        } else {
            const quality = this.props.weapon.quality;
            let fit = this.getStat("fit");
            /* Cap the damage according to max pull of the bow.*/
            if (base.base_skill.name === "Bow" && quality.max_fit) {
                fit = Math.min(quality.max_fit, fit);
            }
            const ccFITBonus = fit - 45;
            fitBonusDmg = ccFITBonus /
                WeaponRow.damageFITModifiers[WeaponRow.PRI];
            fitLethBonus = ccFITBonus /
                WeaponRow.lethalityFITModifiers[WeaponRow.PRI];
        }
        return {damage: fitBonusDmg, leth: fitLethBonus};
    }

    shortRange() {
        return calculateRange(this.props.weapon.base.range_s, this.props.gravity)
    }

    mediumRange() {
        return calculateRange(this.props.weapon.base.range_m, this.props.gravity)
    }

    longRange() {
        return calculateRange(this.props.weapon.base.range_l, this.props.gravity)
    }

    weaponRangeEffect(toRange, skillHandler) {
        // See FirearmControl for more complete documentation.
        const shortRangeEffect = {
            check: 0,
            targetInitiative: 0,
            damage: 0,
            leth: 0,
            name: "Short"
        };

        // Characters with FIT45+ can extend the E range proportionally (E+ range).
        // However, FIT damage and lethality bonuses do not apply at E+ range.
        const extremePlusRange = null

        if (!toRange && !isFloat(toRange)) {
            return shortRangeEffect;
        }
        const shortRange = this.shortRange();
        const longRange = this.longRange();

        if (toRange <= 1) {
            // Too close for bow.
            return null
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
                name: "Very long"
            };
        } else if (toRange <= 2*longRange) {
            // Affected by gravity
            return {
                check: -40,
                targetInitiative: -2,
                damage: -2,
                leth: -2,
                name: "Extra-long"
            };
        } else if (extremePlusRange && toRange <= extremePlusRange) {
            return {
                check: -60,
                targetInitiative: -2,
                damage: -2,
                leth: -2,
                fitBonusDisabled: true,
                name: "Extreme"
            };
        }

        return null;
    }

    rangeEffect(toRange) {
        let effect = this.weaponRangeEffect(toRange);
        let perks = [];

        const visionCheck = this.props.skillHandler.visionCheck(toRange,
            this.props.darknessDetectionLevel,
            perks);

        effect.visionCheck = visionCheck
        if (effect === null || visionCheck === null) {
            return null;
        }

        // If vision check is under 75, the difference is penalty to the
        // ranged skill check.
        if (visionCheck < this.VISION_CHECK_PENALTY_LIMIT) {
            effect.check += visionCheck - this.VISION_CHECK_PENALTY_LIMIT;
        }

        if (visionCheck < this.VISION_TARGET_INITIATIVE_PENALTY_LIMIT) {
            effect.targetInitiative += (visionCheck - this.VISION_TARGET_INITIATIVE_PENALTY_LIMIT)/10;
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
        effect.bumpingAllowed = visionCheck >= this.VISION_BUMPING_LIMIT;
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
                        this.weaponName()}
                        <Unskilled missingSkills={this.missingSkills()} />
                        <BaseCheck baseCheck={this.skillCheck()} />
                    </td>

                    <td style={cellStyle}>{this.skillLevel()}</td>
                    <td style={cellStyle} aria-label={"Rate of fire"}>{this.rof().value().toFixed(2)}</td>
                    {checkCells}
                    <td style={cellStyle}>{this.targetInitiative()}</td>
                    <td style={cellStyle}>{this.drawInitiative()}</td>
                    <td style={cellStyle} aria-label={"Damage"}>{this.renderDamage()}</td>
                    <td style={cellStyle} aria-label={"Short range"}>{this.shortRange()}</td>
                    <td style={cellStyle} aria-label={"Medium range"}>{this.mediumRange()}</td>
                    <td style={cellStyle} aria-label={"Long range"}>{this.longRange()}</td>
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