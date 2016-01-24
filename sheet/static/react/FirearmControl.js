import React from 'react';
var util = require('sheet-util');

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

    skillChecks(actions) {
        var rof = this.rof();
        var baseCheck = this.skillCheck();

        var checks = [];

        for (let act of actions) {
            if (act > 2 * rof) {
                checks.push(null);
            } else {
                checks.push(
                    FirearmControl.counterPenalty(
                        Math.round(FirearmControl.checkMod(rof, act, 10, 15)),
                        this.getStat("FIT")) +
                    baseCheck);
            }
        }
        return checks;
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

    render () {
        var weapon = this.props.weapon.base;
        var ammo = this.props.weapon.ammo;
        var unskilled = this.skillLevel() >= 0 ?
            "" : <div style={{color:"red"}}>unskilled</div>;
        var ammoIdentifier = <div>{ammo.label} {ammo.bullet_type}</div>;

        var actions = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        var headerStyle = {paddingRight: 5, paddingBottom: 5};
        var actionCells = actions.map((act, ii) =>
        {return <th key={`act-${ii}`} style={headerStyle}>{act}</th>});

        var renderInit = function (init) {
            if (init !== null) {
                if (init >= 0) {
                    return "+" + init;
                } else {
                    return init;
                }
            } else {
                return '';
            }
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

        </div>;
    }
}

FirearmControl.props = {
    skillHandler: React.PropTypes.object.isRequired,
    weapon: React.PropTypes.object.isRequired
};

export default FirearmControl;