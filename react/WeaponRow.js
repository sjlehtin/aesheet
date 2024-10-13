import React from 'react';
import PropTypes from 'prop-types';
import {Button} from 'react-bootstrap';
import StatBreakdown from "./StatBreakdown";
import {BaseCheck} from "./BaseCheck";
import CCWeaponModel from "./CCWeaponModel";

import * as util from './sheet-util';
import {UseType} from "./WeaponModel";


class WeaponRow extends React.Component {
    constructor(props) {
        super(props);
    }

    defenseInitiatives(actions, useType= UseType.FULL) {
        return this.weapon.initiatives(actions, useType, false, 4, [0, 3, 6, 0, 3, 6, 0, 3, 6]);
    }

    renderDamage({ useType = UseType.FULL, defense = false }) {
        const damage = this.weapon.weaponDamage({ useType: useType, defense: defense })
        return `${damage.numDice}d${damage.dice}${
            damage.extraDamage ? util.renderInt(util.rounddown(damage.extraDamage)) : ''
            }/${util.rounddown(damage.leth)}${damage.plusLeth ? util.renderInt(damage.plusLeth) : ''}`;
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

        const checks = this.weapon.skillChecksV2(WeaponRow.ccActions,
            useType);

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
        const attackInitiatives = this.weapon.initiatives([1, 2, 3, 4], useType)

        const attackInitiativeCells = attackInitiatives.map((el, ii) => {
            return <td key={`ai-${ii}`} style={initStyle} aria-label={`Attack initiative for ${useType}`}
            >{util.renderInt(el)}</td>;});

        const defenseInitiatives = this.defenseInitiatives([1, 2, 3], useType)
        const defenseInitiativeCells = defenseInitiatives.map((el, ii) => {
            return <td key={`di-${ii}`} style={defenseInitStyle} aria-label={`Defense initiative for ${useType}`}
            >{util.renderInt(el)}</td>;});

        return <tr aria-label={`Action row for ${useType}`}><td style={cellStyle} aria-label={`ROA for ${useType}`}>{this.weapon.roa(useType).value().toFixed(2)}</td>
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

    render() {

        this.weapon = new CCWeaponModel(
            this.props.skillHandler,
            this.props.weapon)

        const headerStyle = {padding: 2};
        const nameStyle = Object.assign({}, headerStyle, {width: "10em"});
        const cellStyle = {padding: 2};
        const infoStyle = {marginRight: 5};
        const actionCells = WeaponRow.ccActions.map((el, ii) => {
            return <th style={headerStyle} key={`act-${ii}`}>{el.toFixed(1)}</th>;
        });

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
                    <td style={cellStyle} rowSpan={4}>{this.props.weapon.name}
                        <BaseCheck baseCheck={this.weapon.skillCheck()} />
                    </td>
                    <td style={cellStyle} rowSpan={4}>{this.weapon.skillLevel()}</td>
                </tr>
                {this.renderUseType(WeaponRow.FULL)}
                {this.renderUseType(WeaponRow.PRI)}
                {this.renderUseType(WeaponRow.SEC)}
      </tbody>
</table>
            <div>
            <span style={infoStyle}><label>CCV</label> <span aria-label={"Close combat value"}>{this.weapon.ccv()}</span></span>
            <span style={infoStyle}><label>Draw-I:</label> <span aria-label={"Draw initiative"}>{this.weapon.drawInitiative()}</span></span>
            <span style={infoStyle} className="durability">
                <label>Durability:</label><span aria-label={"Durability"}>{this.weapon.durability()}</span></span>
            <span style={infoStyle}><label>Size:</label> {this.props.weapon.size}</span>
            <span style={infoStyle}><label>DP:</label><span aria-label={"Damage points"}>{this.weapon.dp()}</span></span>
            <span style={infoStyle}><label>Bypass:</label> <span aria-label={"Bypass"}>{this.weapon.bypass()}</span></span>
            <span style={infoStyle}><label>Weight:</label> <span aria-label={"Weight"}>{util.itemWeight(this.props.weapon).toFixed(2)} kg</span></span>
                    <Button onClick={(e) => this.handleRemove()}
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

WeaponRow.props = {
    skillHandler: PropTypes.object.isRequired,
    weapon: PropTypes.object.isRequired,
    onRemove: PropTypes.func
};

export default WeaponRow;