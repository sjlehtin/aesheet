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

    skillCheck() {
        var check = this.props.skillHandler.skillCheck(
            this.props.weapon.base.base_skill);

        check += this.props.weapon.base.ccv + this.props.weapon.quality.ccv;

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

    renderDamage() {
        var ammo = this.props.weapon.ammo;
        var extraDamage;
        if (ammo.extra_damage) {
            extraDamage = `${Math.sign(ammo.extra_damage) > 0 ?
                "+" : ""}${ammo.extra_damage}`;
        } else {
            extraDamage = "";
        }
        var plusLeth;
        if (ammo.plus_leth) {
            plusLeth = ` (${Math.sign(ammo.plus_leth) > 0 ?
                "+" : ""}${ammo.plus_leth})`
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

    handleRemove() {
        if (this.props.onRemove) {
            this.props.onRemove({id: this.props.weapon.id});
        }
    }

    render() {
        return <div></div>
    }
}

WeaponRow.SPECIAL = 1;
WeaponRow.FULL = 2;
WeaponRow.PRI = 3;
WeaponRow.SEC = 4;

WeaponRow.props = {
    skillHandler: React.PropTypes.object.isRequired,
    weapon: React.PropTypes.object.isRequired,
    onRemove: React.PropTypes.func
};

export default WeaponRow;