import React from 'react';
var util = require('sheet-util');
import {Col} from 'react-bootstrap';

class FirearmControl extends React.Component {
    skillLevel() {
        return this.props.skillHandler.skillLevel(
            this.props.weapon.base.base_skill);
    }

    skillCheck () {
        var check = this.props.skillHandler.skillCheck(
            this.props.weapon.base.base_skill);

        /* TODO: This works differently with ranged and close-combat
           weapons (CCV on unskilled).  Might need a slightly more intricate
           system to handle this. */
        if (this.props.weapon.base.skill) {
            /* Note that the check cannot be inverted here, as the > 0
               will return false also if skill is null, undefined or a
               string, which would also apply if the comparison was < 0. */
            if (!(this.props.skillHandler.skillLevel(
                    this.props.weapon.base.skill) > 0)) {
                check -= 10;
            }
        }
        if (this.props.weapon.base.skill2) {
            /* Note that the check cannot be inverted here, as the > 0
               will return false also if skill is null, undefined or a
               string, which would also apply if the comparison was < 0. */
            if (!(this.props.skillHandler.skillLevel(
                    this.props.weapon.base.skill2)> 0)) {
                check -= 10;
            }
        }
        return check;
    }

    rof() {
        var ammo = this.props.weapon.ammo;
        var base = this.props.weapon.base;
        var impulse = (parseFloat(ammo.weight) *
            parseFloat(ammo.velocity))/1000;

        var recoil = impulse / (parseFloat(base.duration) *
            parseFloat(base.stock) *
            (parseFloat(base.weight) + 6));

        var skillLevel = this.skillLevel();
        var rof = 30 / (recoil + parseFloat(base.weapon_class_modifier));

        if (skillLevel > 0) {
            rof *= 1 + 0.1 * skillLevel;
        }
        return rof;
    }

    static checkMod(roa, act, baseBonus, extraActionModifier) {
        if (1/act >= 1/roa + 1) {
            return baseBonus;
        }
        if (act < 0.5 * roa) {
            return roa / act;
        }
        /* Gap.*/
        if (act > roa) {
            return - act/roa * 20 + extraActionModifier;
        }

        // Value in the gap.
        return 0;
    }

    static counterPenalty(modifier, stat) {
        if (modifier > 0) {
            /* Not a penalty, a bonus. */
            return modifier;
        }
        return Math.min(0, modifier + util.rounddown((stat - 45)/3))
    }

    getStat(stat) {
        return this.props.skillHandler.getStat(stat);
    }

    skillChecks(actions, counterPenalty) {
        var rof = this.rof();
        var baseCheck = this.skillCheck();

        var checks = [];

        if (counterPenalty === undefined) {
            counterPenalty = true;
        }

        for (let act of actions) {
            if (act > 2 * rof) {
                checks.push(null);
            } else {
                var mod = Math.round(FirearmControl.checkMod(rof, act, 10,
                    15));

                if (counterPenalty) {
                    mod = FirearmControl.counterPenalty(mod,
                        this.getStat("FIT"));
                }
                checks.push(mod + baseCheck);
            }
        }
        return checks;
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

        var checks = this.skillChecks(this.mapBurstActions(actions), false);
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

    initiatives(actions) {
        var baseIMultipliers = [1, 4, 7, 2, 5, 8, 3, 6, 9];
        var rof = this.rof();
        var baseI = -5 / rof;
        var readiedBaseI = -1;
        var base = this.props.weapon.base;
        var targetI = base.target_initiative;
        var initiative = this.getStat('ref') / 10 +
            this.getStat('int') / 20 +
            this.getStat('psy') / 20;

        var initiatives = [];
        for (let act of actions) {
            if (act > 2 * rof) {
                initiatives.push(null);
            } else {
                if (rof > 2 * act && act < 1) {
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

                       TODO: add note to sheet about this.
                     */
                    initiatives.push(
                        baseIMultipliers[Math.ceil(act) - 1] * baseI +
                        targetI);
                }
            }
        }
        return initiatives.map(function (el) {
            if (el !== null) {
                return Math.round(el + initiative);}
            else { return null }
        });
    }

    renderDamage() {
        var ammo = this.props.weapon.ammo;
        var extraDamage;
        if (ammo.extra_damage) {
            extraDamage = `${Math.sign(ammo.extra_damage) > 0 ?
                "+": ""}${ammo.extra_damage}`;
        } else {
            extraDamage = "";
        }
        var plusLeth;
        if (ammo.plus_leth) {
            plusLeth = ` (${Math.sign(ammo.plus_leth) > 0 ?
                "+": ""}${ammo.plus_leth})`
        }
        return <span className="damage">{ammo.num_dice}d{ammo.dice}{
            extraDamage}/{ammo.leth}{plusLeth}</span>;
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

        return <table style={{fontSize: 'inherit'}}>
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
        </table>;
    }

    sweepChecks(sweepType) {
        var sweeps = {
            5: [0, 2, 5, 10],
            10: [0, 1, 2, 2, 5, 5, 10, 10],
            15: [0, 1, 1, 2, 2, 2, 5, 5, 5, 10, 10, 10],
            20: [0, 1, 1, 1, 2, 2, 2, 2, 5, 5, 5, 5, 10, 10, 10, 10]
        };
        if (!(sweepType in sweeps)) {
            throw Error("Invalid sweep type: " + sweepType);
        }
        var autofireClasses = {"A": -1, "B": -2, "C": -3, "D": -4, "E": -5};

        var klass = autofireClasses[this.props.weapon.base.autofire_class];

        var autofirePenalty = -10;
        if (!this.props.skillHandler.hasSkill("Autofire")) {
            autofirePenalty = -20;
        }

        var baseSkillCheck = this.skillCheck();
        var checks = [];
        var penaltyMultiplier = 0;
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

    renderSweepTable() {
        return '';
    }
    render () {
        // TODO: Marking unskilled for weapon and autofire.
        var weapon = this.props.weapon.base;
        var ammo = this.props.weapon.ammo;
        var unskilled = this.skillLevel() >= 0 ?
            "" : <div style={{color:"red"}}>unskilled</div>;
        var ammoIdentifier = <div>{ammo.label} {ammo.bullet_type}</div>;

        var actions = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        var headerStyle = {paddingRight: 5, paddingBottom: 5};
        var actionCells = actions.map((act, ii) =>
        {return <th key={`act-${ii}`} style={headerStyle}>{act}</th>});

        var renderInit = (init) => {
            return this.renderInt(init);
        };
        var cellStyle = {paddingRight: 5, paddingBottom: 5};
        var helpStyle = Object.assign({color: "hotpink"}, cellStyle);
        var initStyle = Object.assign({color: "red"}, cellStyle);

        var initiatives = this.initiatives(actions).map((init, ii) => {
            return <td key={`init-${ii}`} style={initStyle}>{
                renderInit(init)}</td>
        });
        var skillChecks = this.skillChecks(actions).map((chk, ii) =>
        {return <td key={`chk-${ii}`} style={cellStyle}>{chk}</td>});

        return <div style={this.props.style}>
            <Col md={9}>
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
                    <th style={headerStyle}>S/M/L</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                    <td rowSpan="2" style={cellStyle}>
                        <div>
                            {weapon.name}
                            {ammoIdentifier}
                            {unskilled}
                        </div>
                    </td>
                    <td style={cellStyle}>{this.skillLevel()}</td>
                    <td style={cellStyle}>{ this.rof().toFixed(2) }</td>
                    {skillChecks}
                    <td style={cellStyle}>{ weapon.target_initiative }</td>
                    <td style={cellStyle}>{ weapon.draw_initiative }</td>
                    <td style={cellStyle} rowSpan="2">{ this.renderDamage() } {ammo.type}
                        <div>{ ammoIdentifier }</div></td>
                    <td style={cellStyle} rowSpan="2">
                        {weapon.range_s } / {weapon.range_m } / {weapon.range_l }
                    </td>
                </tr>
      <tr>
      <td style={helpStyle} colSpan={2}>
          I vs. 1 target
      </td>
          {initiatives}
      <td></td>
      <td></td>
      </tr>
      </tbody>
</table>
            <div className="durability"><label>Durability:</label>{weapon.durability}</div>

                {this.renderSweepTable()}
            </Col>
            <Col md={3}>
                {this.renderBurstTable()}
            </Col>
        </div>;
    }
}

FirearmControl.props = {
    skillHandler: React.PropTypes.object.isRequired,
    weapon: React.PropTypes.object.isRequired
};

export default FirearmControl;