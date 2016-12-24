import React from 'react';
import RangedWeaponRow from './RangedWeaponRow';
var util = require('./sheet-util');
import {Col, Row, Button} from 'react-bootstrap';

class FirearmControl extends RangedWeaponRow {
    constructor(props) {
        super(props);

        this.readiedBaseI = -1;
        this.baseCheckBonusForSlowActions = 10;
        this.extraActionModifier = 15;
        this.penaltyCounterStat = "FIT";
    }

    roa() {
        const base = this.props.weapon.base;
        const impulse = (parseFloat(this.props.weapon.ammo.weight) *
            parseFloat(this.props.weapon.ammo.velocity))/1000;

        const recoil = impulse / (parseFloat(base.duration) *
            parseFloat(base.stock) *
            (parseFloat(base.weight) + 6));

        const skillLevel = this.skillLevel();

        let rof = 30 / (recoil + parseFloat(base.weapon_class_modifier));

        if (skillLevel > 0) {
            rof *= 1 + 0.1 * skillLevel;
        }
        return rof;
    }

    singleBurstChecks(check) {
        var base = this.props.weapon.base;
        var checks = [];

        var maxHits = Math.min(util.rounddown(base.autofire_rpm/120), 5);

        if (base.restricted_burst_rounds > 0) {
            maxHits = Math.min(maxHits, base.restricted_burst_rounds);
        }
        var baseSkillCheck = this.skillCheck();

        var burstMultipliers = [0, 1, 3, 6, 10];
        var autofireClasses = {"A": -1, "B": -2, "C": -3, "D": -4, "E": -5};

        var autofirePenalty = 0;
        if (!this.props.skillHandler.hasSkill("Autofire")) {
            autofirePenalty = -10;
        }
        for (var ii = 0; ii < 5; ii++) {
            if (ii >= maxHits || check === null) {
                checks.push(null);
            } else {
                // The modifier might be positive at this point, and penalty
                // countering could leave the overall mod as positive.
                var mod = check - baseSkillCheck;

                var bonus = 0;
                if (mod > 0) {
                    bonus = mod;
                    mod = 0;
                }

                mod += burstMultipliers[ii] *
                    autofireClasses[base.autofire_class];

                mod = FirearmControl.counterPenalty(mod,
                        this.getStat("FIT"));

                checks.push(baseSkillCheck + bonus + mod + autofirePenalty);
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
        var base = this.props.weapon.base;
        if (!base.autofire_rpm) {
            /* No burst fire with this weapon. */
            return null;
        }

        var checks = this.skillChecks(this.mapBurstActions(actions),
            {counterPenalty: false});
        return checks.map((chk) => {return this.singleBurstChecks(chk);});
    }

    burstInitiatives(actions) {
        var base = this.props.weapon.base;
        if (!base.autofire_rpm) {
            /* No burst fire with this weapon. */
            return null;
        }
        return this.initiatives(this.mapBurstActions(actions));
    }

    renderDamage() {
        var ammo = this.props.weapon.ammo;
        var extraDamage = this.renderInt(ammo.extra_damage);
        var plusLeth = '';
        if (ammo.plus_leth) {
            plusLeth = ` (${this.renderInt(ammo.plus_leth)})`;
        }
        return <span className="damage">{ammo.num_dice}d{ammo.dice}{
            extraDamage}/{ammo.leth}{plusLeth}</span>;
    }

    renderBurstTable() {
        if (!this.props.weapon.base.autofire_rpm) {
            return '';
        }
        var actions = [0.5, 1, 2, 3, 4];
        var burstChecks = this.burstChecks(actions);
        var lethalities = [0, -2, 2, 0, -2];
        var hitLocations = [0, 0, 0, -1, -1];
        var burstRows = [];

        var baseStyle = {padding: 2, borderWidth: 1, minWidth: "2em",
        textAlign: "center"};
        var cellStyle = Object.assign({borderStyle: "dotted"}, baseStyle);

        var idx = 0;
        var actionCells = actions.map((act) => {
            return <th key={idx++} style={baseStyle}>{act}</th>;});

        for (var ii = 0; ii < 5; ii++) {
            var checkCells = [];
            for (var jj = 0; jj < burstChecks.length; jj++) {
                var burst = burstChecks[jj];
                checkCells.push(<td key={jj} style={cellStyle}
                >{burst[ii]}</td>);
            }
            burstRows.push(<tr key={`chk-${ii}-${jj}`}>
                <td style={cellStyle}>{lethalities[ii]}</td>
                <td style={cellStyle}>{hitLocations[ii]}</td>
                {checkCells}
            </tr>)
        }
        idx = 0;
        var inits = this.burstInitiatives(actions).map((init) => {
            return <th key={"init-" + idx++}>
                {this.renderInt(init)}
            </th>});

        var autoUnskilled = '';
        if (!this.props.skillHandler.hasSkill("Autofire")) {
            autoUnskilled = <div style={{color:"red"}}
                             title="Missing skill Autofire">
                Unskilled</div>;
        }

        return <div>

        <table style={{fontSize: 'inherit'}}>
            <thead>
            <tr>
                <th style={baseStyle}>Leth</th>
                <th style={baseStyle}>Loc</th>
                {actionCells}
            </tr>
            </thead>
            <tbody>
            {burstRows}
            </tbody>
            <tfoot>
            <tr>
                <th></th>
                <th></th>
                {inits}
            </tr>
            </tfoot>
        </table>
            {autoUnskilled}

        </div>;
    }

    sweepChecks(sweepType) {
        const sweeps = {
            5: [0, 2, 5, 10],
            10: [0, 1, 2, 2, 5, 5, 10, 10],
            15: [0, 1, 1, 2, 2, 2, 5, 5, 5, 10, 10, 10],
            20: [0, 1, 1, 1, 2, 2, 2, 2, 5, 5, 5, 5, 10, 10, 10, 10]
        };
        if (!(sweepType in sweeps)) {
            throw Error("Invalid sweep type: " + sweepType);
        }
        const autofireClasses = {"A": -1, "B": -2, "C": -3, "D": -4, "E": -5};

        const klass = autofireClasses[this.props.weapon.base.autofire_class];

        let autofirePenalty = -10;
        if (!this.props.skillHandler.hasSkill("Autofire")) {
            autofirePenalty = -20;
        }

        const baseSkillCheck = this.skillCheck();
        let checks = [];
        let penaltyMultiplier = 0;
        for (let multiplier of sweeps[sweepType]) {
            penaltyMultiplier += multiplier;
            checks.push(
                baseSkillCheck +
                sweepType +
                FirearmControl.counterPenalty(
                    penaltyMultiplier * klass, this.getStat("fit")) +
                autofirePenalty
            );
        }
        return checks;
    }

    hasSweep() {
        return this.props.weapon.base.autofire_rpm &&
            !this.props.weapon.base.sweep_fire_disabled;
    }

    renderSweepTable() {
        if (!this.hasSweep()) {
            return '';
        }

        var sweepRows = [];

        var baseStyle = {padding: 2, borderWidth: 1, minWidth: "2em",
        textAlign: "center"};
        var cellStyle = Object.assign({borderStyle: "dotted"}, baseStyle);

        for (let sweep of [5, 10, 15, 20]) {
            var checks = this.sweepChecks(sweep);
            for (var ii = checks.length; ii < 16; ii++) {
                checks[ii] = null;
            }
            checks.reverse();
            ii = 0;
            var checkCells = checks.map((chk) => {
                return <td style={cellStyle} key={ii++}>{chk}</td>;
            });
            sweepRows.push(<tr key={sweep}><td>{sweep}</td><td>{util.roundup(this.props.weapon.base.autofire_rpm/(6*sweep))}</td>{checkCells}</tr>);
        }

        const footCellStyle = {textAlign: "center"};
        return <div>
        <table style={{fontSize: "inherit"}}>
            <thead>
            <tr><th colSpan={4}>Sweep fire {this.props.weapon.base.autofire_rpm}{this.props.weapon.base.autofire_class}</th></tr>
            <tr><th>RPT</th><th>TGT</th></tr></thead>
            <tbody>
            {sweepRows}
            </tbody>
            <tfoot>
            <tr><th colSpan={2}>Lethality</th>
                <th style={footCellStyle}>0</th>
        <th style={footCellStyle}>+2</th><th style={footCellStyle}>-2</th><th style={footCellStyle}>0</th>
        <th style={footCellStyle}>+2</th><th style={footCellStyle}>-2</th><th style={footCellStyle}>0</th>
        <th style={footCellStyle}>+2</th><th style={footCellStyle}>-2</th><th style={footCellStyle}>0</th>
        <th style={footCellStyle}>+2</th><th style={footCellStyle}>-2</th><th style={footCellStyle}>0</th>
        <th style={footCellStyle}>+2</th><th style={footCellStyle}>-2</th><th style={footCellStyle}>0</th></tr>
            <tr><th colSpan={2}>Location</th>
        <th style={footCellStyle}>0</th>
        <th style={footCellStyle}>+2</th><th style={footCellStyle}>+2</th><th style={footCellStyle}>+2</th>
        <th style={footCellStyle}>-2</th><th style={footCellStyle}>-2</th><th style={footCellStyle}>-2</th>
        <th style={footCellStyle}>+1</th><th style={footCellStyle}>+1</th><th style={footCellStyle}>+1</th>
        <th style={footCellStyle}>-1</th><th style={footCellStyle}>-1</th><th style={footCellStyle}>-1</th>
        <th style={footCellStyle}>0</th><th style={footCellStyle}>0</th><th style={footCellStyle}>0</th></tr>
            </tfoot>
        </table>

        </div>;
    }

    render () {
        var weapon = this.props.weapon.base;
        var ammo = this.props.weapon.ammo;
        var missing = this.missingSkills();
        var unskilled = '';
        if (missing.length > 0) {
            unskilled = <div style={{color:"red"}}
                             title={`Missing skills: ${missing.join(' ,')}`}>
                Unskilled</div>;
        }
        var ammoIdentifier = <div>{ammo.label} {ammo.bullet_type}</div>;

        var actions = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        var headerStyle = {padding: 2};
        const inlineHeaderStyle = Object.assign({}, headerStyle, {textAlign: 'center'});
        var actionCells = actions.map((act, ii) =>
        {return <th key={`act-${ii}`} style={headerStyle}>{act}</th>});

        var renderInit = (init) => {
            return this.renderInt(init);
        };
        var cellStyle = {padding: 2, minWidth: "2em", textAlign: "center"};
        var helpStyle = Object.assign({color: "hotpink"}, cellStyle);
        var initStyle = Object.assign({color: "red"}, cellStyle);

        var initiatives = this.initiatives(actions).map((init, ii) => {
            return <td key={`init-${ii}`} style={initStyle}>{
                renderInit(init)}</td>
        });
        var skillChecks = this.skillChecks(actions).map((chk, ii) =>
        {return <td key={`chk-${ii}`} style={cellStyle}>{chk}</td>});

        const marginRightStyle = {marginRight: "1em"};
        const labelStyle = {marginRight: "0.5em"};

        let sweepInstructions = '';
        if (this.hasSweep()) {
            sweepInstructions = <Row style={{color: "hotpink"}}>
                <div >
                    The distance between sweep targets may be up to
                    1 m (-5 penalty / target), or up to 2 m
                    (-10 penalty / target).
                </div>

                <div>
                All range penalties are doubled in sweep fire
                    (i.e. M -20, L -40, XL -60, E -80)
                </div>
                <div>
                    Bumping is not allowed in sweep fire.
                </div>
            </Row>;
        }

        return <div style={this.props.style}>
            <Row>
                <Col md={8}>
                    <Row>
                        <div>
                        <table style={{fontSize: 'inherit'}}>
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
                            <tr>
                                <td rowSpan="2" style={cellStyle}>
                                    <div>
                                        {weapon.name}

                                        {unskilled}
                                    </div>
                                </td>
                                <td style={cellStyle}>{this.skillLevel()}</td>
                                <td style={cellStyle}>{ this.rof().toFixed(2) }</td>
                                {skillChecks}
                                <td style={cellStyle}>{ weapon.target_initiative }</td>
                                <td style={cellStyle}>{ weapon.draw_initiative }</td>
                            </tr>
                            <tr>
                                <td style={helpStyle} colSpan={2}>
                                    I vs. 1 target
                                </td>
                                {initiatives}
                            </tr>
                            <tr><td style={cellStyle} rowSpan={2}>{ammoIdentifier}</td>
                                <th style={inlineHeaderStyle} colSpan={3}>Damage</th>
                                <th style={inlineHeaderStyle} colSpan={2}>Dtype</th>
                                <th style={inlineHeaderStyle} colSpan={2}>S</th>
                                <th style={inlineHeaderStyle} colSpan={2}>M</th>
                                <th style={inlineHeaderStyle} colSpan={2}>L</th>
                            </tr>
                            <tr>
                                <td style={cellStyle} colSpan={3}>{this.renderDamage()}</td>
                                <td style={cellStyle} colSpan={2}>{ammo.type}</td>
                                <td style={cellStyle} colSpan={2}>{weapon.range_s }</td>
                                <td style={cellStyle} colSpan={2}>{weapon.range_m }</td>
                                <td style={cellStyle} colSpan={2}>{weapon.range_l }</td>
                            </tr>
                            </tbody>
                        </table>
                        <div><span style={marginRightStyle}><label style={labelStyle}>Durability:</label>{weapon.durability}</span>
                            <span style={marginRightStyle}><label style={labelStyle}>Weight:</label>{weapon.weight}</span>
                        </div>
                        <Button onClick={(e) => this.handleRemove()}
                                ref={(c) => this._removeButton = c}
                                bsSize="xsmall">Remove</Button>
                        </div>
                    </Row>
                    <Row>
                        {this.renderSweepTable()}
                    </Row>
                </Col>
                <Col md={3}>
                    {this.renderBurstTable()}
                </Col>
            </Row>
            {sweepInstructions}
        </div>;
    }
}

FirearmControl.props = {
    skillHandler: React.PropTypes.object.isRequired,
    weapon: React.PropTypes.object.isRequired,
    onRemove: React.PropTypes.func
};

export default FirearmControl;