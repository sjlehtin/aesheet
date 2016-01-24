import React from 'react';
import ReactDOM from 'react-dom';

import {Button} from 'react-bootstrap';

import Octicon from 'react-octicon';

/*
 * This component handles display of a skill, level, checks.  If the
 * skill in question has levels lower than the current, allow lowering the
 * skill; likewise, if the skill has levels higher than the current,
 * allow increasing the skill level.
 * The modification will be communicated to the containing component,
 * which will then signal a re-render of this component.
 *
 * This component requires the effective stats from the sheet to render the
 * skill checks correctly.  Also, the skill is required, as it contains
 * the information about specialization and skill costs per level.
 *
 */

class SkillRow extends React.Component {
    constructor(props) {
        super(props);

        this.state = {  };
    }

    /* A base-level skill, i.e., Basic Artillery and the like. */
    isBaseSkill(skill) {
        if (skill.skill_cost_1 === null) {
            return true;
        } else {
            return false;
        }
    }

    /*
     * If character has the skill, use the check directly.
     *
     * If character does not have the skill, but the skill level 0
     * has cost of 0, use level 0 check.  This should use the normal
     * skill check calculation, as the character may have armor
     * or edges which modify the skill check.
     *
     * If character doesn't have the skill, and the skill level 0 has
     * a non-zero cost, calculate check defaulted to half-ability.
     */
    skillCheck(stat) {
        var skill = this.props.skill;

        if (this.isBaseSkill(skill)) {
            return null;
        }

        if (!stat) {
            stat = skill.stat;
        }
        var ability = this.props.stats[stat.toLowerCase()];
        var level = this.skillLevel();
        if (level === "B") {
            return Math.round(ability / 2)
        } else {
            return ability + level * 5;
        }
    }

    skillName() {
        var skillName = this.props.skill.name;
        if (!skillName) {
            skillName = this.props.characterSkill.skill;
        }
        return skillName;
    }

    skillLevel() {
        if (!this.props.characterSkill) {
            if (this.props.skill.skill_cost_0 > 0) {
                return 'B';
            } else {
                return 0;
            }
        } else {
            return this.props.characterSkill.level;
        }
    }

    handleIncrease() {
        if (typeof(this.props.onCharacterSkillModify) !== "undefined") {
            var cs = Object.assign({}, this.props.characterSkill);
            cs.level += 1;
            this.props.onCharacterSkillModify(cs);
        }
    }

    handleDecrease() {
        if (typeof(this.props.onCharacterSkillModify) !== "undefined") {
            var cs = Object.assign({}, this.props.characterSkill);
            cs.level -= 1;
            this.props.onCharacterSkillModify(cs);
        }
    }

    canDecrease() {
        if (!this.props.characterSkill) {
            return false;
        }
        return this.props.characterSkill.level > this.props.skill.min_level;
    }

    canIncrease() {
        if (!this.props.characterSkill) {
            return false;
        }
        return this.props.characterSkill.level < this.props.skill.max_level;
    }

    render () {
        var checks;
        if (this.props.renderForStats) {
            var checkList = [];
            for (var ii = 0; ii < this.props.renderForStats.length; ii++) {
                var stat = this.props.renderForStats[ii];
                var check = this.skillCheck(stat);
                checkList.push(`${stat.toUpperCase()}: ${check}`);
            }
            checks = checkList.join(' ');
        } else {
            var skill = this.props.skill;
            checks = <span title={skill.stat}>{this.skillCheck(skill.stat)}</span>
        }
        var indent = 0;
        if (this.props.indent > 0) {
            indent = `${this.props.indent}em`;
        }

        var remove;
        if (this.props.characterSkill && this.props.onCharacterSkillRemove) {
            remove = <span style={{color: "red", cursor: "pointer", float: "right", paddingRight: 5}}
                    onClick={(e) => {this.props.onCharacterSkillRemove(
                      this.props.characterSkill)}}
                    ><Octicon name="x" /></span>;
        } else {
            remove = '';
        }

        var increaseButton, decreaseButton;
        if (this.canIncrease()) {
            increaseButton = <span style={{color: "green", position: "absolute", left: 10, bottom: 1, cursor: "pointer"}} ref={(c) => this._increaseButton = c}
                                         onClick={() => this.handleIncrease()}

            ><Octicon name="arrow-up" /></span>;
        } else {
            increaseButton = '';
        }
        if (this.canDecrease()) {
            decreaseButton = <span style={{color: "red", position: "absolute", left: 22, bottom: -3, cursor: "pointer"}} ref={(c) => this._decreaseButton = c}
                                         onClick={() => this.handleDecrease()}
                                         bsSize="xsmall"
            ><Octicon name="arrow-down" /></span>;
        } else {
            decreaseButton = '';
        }

        var skillStyle = {};
        var missing = '';
        var cs = this.props.characterSkill;
        if (cs && cs._missingRequired && (cs._missingRequired.length > 0)) {
            var pluralize = cs._missingRequired.length === 1 ? "" : "s";
            missing = `Missing skill${pluralize} ${
                cs._missingRequired.join(", ")}`;
            skillStyle.color = 'red';
        }
        return <tr style={skillStyle} title={missing}><td><span style={{paddingLeft: indent}}>{
              this.skillName()}</span><span style={{position: "relative"}}>{remove}</span></td>
            <td>{this.skillLevel()}<span style={{position: "relative"}}>{increaseButton}{decreaseButton}</span></td>
            <td>{this.props.skillPoints ? this.props.skillPoints : ""}</td>
            <td className="skill-check">{checks}</td></tr>;
    }
}

SkillRow.propTypes = {
    /* Either characterSkill of skillName must be given.  If
       characterSkill is missing, it is assumed that the character does not
       possess the skill. */
    characterSkill: React.PropTypes.object,
    skillName: React.PropTypes.string,

    stats: React.PropTypes.object.isRequired,

    skill: React.PropTypes.object.isRequired,

    skillPoints: React.PropTypes.number,

    /* Defaults to stat in the skill, but can be overridden for
       special cases. */
    renderForStats: React.PropTypes.array,

    indent: React.PropTypes.number,

    onCharacterSkillRemove: React.PropTypes.func,
    onCharacterSkillModify: React.PropTypes.func
};

SkillRow.defaultProps = {indent: 0, skillPoints: 0}

export default SkillRow;

