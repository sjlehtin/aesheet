import React from 'react'
import PropTypes from 'prop-types'

import SkillCheck from 'SkillCheck'
import {GoX} from 'react-icons/go'
import {IncreaseButton, DecreaseButton} from 'ModificationButton'

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

    skillCheck(stat) {
        return this.props.skillHandler.skillCheck(this.props.skillName, stat);
    }

    skillLevel() {
        return this.props.skillHandler.skillLevel(this.props.skillName);
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
        let checks;
        if (this.props.renderForStats) {
            var checkList = [];
            for (var ii = 0; ii < this.props.renderForStats.length; ii++) {
                var stat = this.props.renderForStats[ii];
                var check = this.skillCheck(stat);
                checkList.push(
                    <tr key={ii}>
                        <td>{stat.toUpperCase()}</td>
                        <td>
                            <SkillCheck skillName={this.props.skillName}
                                        skillCheck={check.value}
                                        checkBreakdown={check.breakdown}/>
                        </td>
                    </tr>
                );
            }
            checks = <table aria-label={"Skill checks for explicitly given stats"}><tbody>{checkList}</tbody></table>;
        } else {
            const check = this.skillCheck()
            if (check) {
                checks = <SkillCheck skillName={this.props.skillName}
                                     skillCheck={check.value}
                                     checkBreakdown={check.breakdown}/>
            }
        }
        var indent = 0;
        if (this.props.indent > 0) {
            indent = `${this.props.indent}em`;
        }

        var remove;
        if (this.props.skillHandler.hasSkill(this.props.skillName) &&
            this.props.onCharacterSkillRemove) {
            remove = <span aria-label={"Remove skill"} name={"Remove skill"} role={"button"} style={{color: "red", cursor: "pointer", float: "right", paddingRight: 5}}
                    onClick={(e) => {this.props.onCharacterSkillRemove(
                      this.props.characterSkill)}}
                    ><GoX /></span>;
        } else {
            remove = '';
        }

        var increaseButton, decreaseButton;
        if (this.canIncrease()) {
            increaseButton = <IncreaseButton name={"Increase skill level"}
                                             onClick={() => this.handleIncrease()}/>;
        } else {
            increaseButton = '';
        }
        if (this.canDecrease()) {
            decreaseButton = <DecreaseButton name={"Decrease skill level"}
                                             onClick={() => this.handleDecrease()}/>;
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
        return <tr style={skillStyle} title={missing} aria-label={"Skill"}>
            <td><span style={Object.assign(skillStyle, {paddingLeft: indent})}>{
              this.props.skillName}</span><span style={{position: "relative"}}>{remove}</span></td>
            <td><span aria-label={"Skill level"}>{this.skillLevel()}</span><span style={{position: "relative"}}>{increaseButton}{decreaseButton}</span></td>
            <td>{this.props.skillPoints ? this.props.skillPoints : ""}</td>
            <td className="skill-check">{checks}</td></tr>;
    }
}

SkillRow.propTypes = {
    skillName: PropTypes.string.isRequired,
    skillHandler: PropTypes.object.isRequired,

    /* Defaults to stat in the skill, but can be overridden for
       special cases. */
    renderForStats: PropTypes.array,

    indent: PropTypes.number,

    onCharacterSkillRemove: PropTypes.func,
    onCharacterSkillModify: PropTypes.func,


    // TODO: Rest of the props should be unnecessary with skillHandler as
    // prop.

    /* Either characterSkill of skillName must be given.  If
       characterSkill is missing, it is assumed that the character does not
       possess the skill. */
    characterSkill: PropTypes.object,
    skill: PropTypes.object.isRequired,

    skillPoints: PropTypes.number
};

SkillRow.defaultProps = {indent: 0, skillPoints: 0}

export default SkillRow;

