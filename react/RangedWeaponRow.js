import React from 'react';
import PropTypes from 'prop-types';

import WeaponRow from 'WeaponRow';
import StatBreakdown from "StatBreakdown";
import * as util from './sheet-util';
import {Button} from 'react-bootstrap';
import {Unskilled} from "./Unskilled";
import {BaseCheck} from "./BaseCheck";
import RangedWeaponModel from "./RangedWeaponModel";
import {UseType} from "./WeaponModel";


function calculateRange(r, g) {
    // Low-G does not improve range in other than extreme range.
    if (g < 1) {
        g = 1.0
    }
    return util.rounddown(r / (g ?? 1.0))
}

class RangedWeaponRow extends React.Component {
    constructor(props) {
        super(props);
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

    renderDamage() {
        const damage = this.weapon.weaponDamage({})
        return `${damage.numDice}d${damage.dice}${
            damage.extraDamage ? util.renderInt(util.rounddown(damage.extraDamage)) : ''
        }/${util.rounddown(damage.leth)}${damage.plusLeth ? util.renderInt(damage.plusLeth) : ''}`;
    }

    render() {
        this.weapon = new RangedWeaponModel(
            this.props.skillHandler,
            this.props.weapon)

        const headerStyle = {padding: 2};
        const cellStyle = {padding: 2, minWidth: "2em", textAlign: "center"};
        const initStyle = Object.assign({color: "red"}, cellStyle);
        const infoStyle = {marginRight: 5};
        const helpStyle = {color: "hotpink"};

        const actions = [0.5, 1, 2, 3, 4, 5];
        const actionCells = actions.map((el, ii) => {
            return <th style={headerStyle} key={`act-${ii}`}>{el}</th>;
        });
        let checkCells = this.weapon.skillChecksV2(actions);
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
        const initCells = this.weapon.initiatives(actions, {}).map((el, ii) =>
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
                        this.props.weapon.name}
                        <Unskilled missingSkills={this.weapon.missingSkills()} />
                        <BaseCheck baseCheck={this.weapon.skillCheck()} />
                    </td>

                    <td style={cellStyle}>{this.weapon.skillLevel()}</td>
                    <td style={cellStyle} aria-label={"Rate of fire"}>{this.weapon.rof(UseType.FULL).value().toFixed(2)}</td>
                    {checkCells}
                    <td style={cellStyle}>{this.weapon.targetInitiative()}</td>
                    <td style={cellStyle}>{this.weapon.drawInitiative()}</td>
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
            <span style={infoStyle}><label>Bypass:</label> {this.weapon.bypass()}</span>
            <span style={infoStyle} className="durability">
                <label>Durability:</label>{this.weapon.durability()}</span>
            <span style={infoStyle}><label>DP:</label> {this.weapon.dp()}</span>
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