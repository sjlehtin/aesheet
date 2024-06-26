import React from 'react';
import PropTypes from 'prop-types';

import WeaponRow from 'WeaponRow';
import StatBreakdown from "StatBreakdown";
const util = require('./sheet-util');
import {Button} from 'react-bootstrap';

class RangedWeaponRow extends WeaponRow {
    constructor(props) {
        super(props);

        this.readiedBaseI = -1;
        this.baseCheckBonusForSlowActions = 10;
        this.extraActionModifier = 10;
        this.penaltyCounterStat = "FIT";
    }

    skillCheckV2() {
        const gottenCheck = this.props.skillHandler.skillCheckV2(
            this.props.weapon.base.base_skill);

        if (!gottenCheck) {
            return null;
        }
        let check = gottenCheck.value
        let breakdown = gottenCheck.breakdown.slice()

        const unskilledPenalty = -10;

        if (this.props.weapon.base.skill) {
            if (!this.props.skillHandler.hasSkill(
                    this.props.weapon.base.skill)) {
                check += unskilledPenalty;
                breakdown.push({
                    value: unskilledPenalty,
                    reason: `unskilled (${this.props.weapon.base.skill})`
                })
            }
        }

        if (this.props.weapon.base.skill2) {
            if (!this.props.skillHandler.hasSkill(
                    this.props.weapon.base.skill2)) {
                check += unskilledPenalty;
                breakdown.push({
                    value: unskilledPenalty,
                    reason: `unskilled (${this.props.weapon.base.skill2})`
                })
            }
        }

        return {
            value: check,
            breakdown: breakdown
        };
    }

    roa(useType) {
        var roa = this.baseROA();
        roa *= this.skillROAMultiplier();

        if (this.props.weapon.base.base_skill === "Bow") {
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

        if (base.base_skill === "Crossbow") {
            fitBonusDmg = 0;
            fitLethBonus = 0
        } else {
            var quality = this.props.weapon.quality;
            var fit = this.getStat("fit");
            /* Cap the damage according to max pull of the bow.*/
            if (base.base_skill === "Bow" && quality.max_fit) {
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
                    cellContent = <StatBreakdown value={el.value}
                                                 breakdown={el.breakdown}/>
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