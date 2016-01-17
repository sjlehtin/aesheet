import React from 'react';
import ReactDOM from 'react-dom';

import {Button} from 'react-bootstrap';

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
        var skillName = this.props.skillName;
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
            remove = <Button bsSize="xsmall"
                    onClick={(e) => {this.props.onCharacterSkillRemove(
                      this.props.characterSkill)}}
                    >Remove</Button>;
        } else {
            remove = '';
        }

        var increaseButton = <Button ref={(c) => this._increaseButton = c}
                                     onClick={() => this.handleIncrease()}
                                     bsSize="xsmall"
                                     >+</Button>;
        var decreaseButton = <Button ref={(c) => this._decreaseButton = c}
                                     onClick={() => this.handleDecrease()}
                                     bsSize="xsmall"
                                     >-</Button>;

        return <tr><td><span style={{paddingLeft: indent}}>{
              this.skillName()}</span>{remove}</td>
            <td>{this.skillLevel()}{increaseButton}{decreaseButton}</td>
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

