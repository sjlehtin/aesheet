import React from 'react';
import PropTypes from 'prop-types';

import WeaponRow from './WeaponRow';
const util = require('./sheet-util');
import {Col, Row, Button} from 'react-bootstrap';

class RangedWeaponRow extends WeaponRow {
    constructor(props) {
        super(props);

        this.readiedBaseI = -1;
        this.baseCheckBonusForSlowActions = 10;
        this.extraActionModifier = 10;
        this.penaltyCounterStat = "FIT";
    }

    skillCheck () {
        var check = this.props.skillHandler.skillCheck(
            this.props.weapon.base.base_skill);

        /* TODO: This works differently with ranged and close-combat
           weapons (CCV on unskilled).  Might need a slightly more intricate
           system to handle this. */
        if (this.props.weapon.base.skill) {
            if (!this.props.skillHandler.hasSkill(
                    this.props.weapon.base.skill)) {
                check -= 10;
            }
        }
        if (this.props.weapon.base.skill2) {
            if (!this.props.skillHandler.hasSkill(
                    this.props.weapon.base.skill2)) {
                check -= 10;
            }
        }
        return check;
    }

    roa() {
        var roa = this.baseROA();
        roa *= this.skillROAMultiplier();

        if (this.props.weapon.base.base_skill === "Bow") {
            var level = this.props.skillHandler.skillLevel("Rapid archery");
            if (level > 0) {
                roa += level * 0.05;
            }
        }
        return Math.min(roa, 5.0);
    }

    rof() {
        return this.roa();
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
        var headerStyle = {padding: 2};
        var cellStyle = {padding: 2, minWidth: "2em", textAlign: "center"};
        var initStyle = Object.assign({color: "red"}, cellStyle);
        var infoStyle = {marginRight: 5};
        var helpStyle = {color: "hotpink"};

        var actions = [0.5, 1, 2, 3, 4, 5];
        var actionCells = actions.map((el, ii) => {
            return <th style={headerStyle} key={`act-${ii}`}>{el}</th>;
        });
        let checkCells = this.skillChecks(actions);
        if (checkCells === null) {
            checkCells = <td colSpan={6}>Unable to use weapon</td>;
        } else {
            checkCells = checkCells.map((el, ii) => {
                return <td style={cellStyle} key={`chk-${ii}`}>{el}</td>;
            });
        }
        var initCells = this.initiatives(actions).map((el, ii) =>
        { return <td style={initStyle} key={`init-${ii}`}>{util.renderInt(el)}</td>; });

        var base = this.props.weapon.base;
        var ranges = <span>{base.range_s} / {base.range_m} / {base.range_l}</span>;

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
                    <th style={headerStyle}>S / M / L</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                    <td style={cellStyle} rowSpan={2}>{
                        this.weaponName()}</td>
                    <td style={cellStyle}>{this.skillLevel()}</td>
                    <td style={cellStyle}>{this.rof().toFixed(2)}</td>
                    {checkCells}
                    <td style={cellStyle}>{this.targetInitiative()}</td>
                    <td style={cellStyle}>{this.drawInitiative()}</td>
                    <td style={cellStyle}>{this.renderDamage()}</td>
                    <td style={cellStyle}>{ranges}</td>
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
                            ref={(c) => this._removeButton = c}
                            size="sm"
                    >Remove</Button>
            </div>
        </div>;
    }

}

RangedWeaponRow.props = {
    skillHandler: PropTypes.object.isRequired,
    weapon: PropTypes.object.isRequired,
    onRemove: PropTypes.func
};

export default RangedWeaponRow;