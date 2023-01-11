import React from 'react';
import PropTypes from 'prop-types';

import {Grid, Col, Row, Label, Button} from 'react-bootstrap';

import Combobox from 'react-widgets/Combobox';

class AddSkillControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            skillValue: '',
            selectedSkill: undefined
        }
    }

    static filterSkills(skillList, characterSkills) {
        var filtered = [];
        for (var skill of skillList) {
            if (!(skill.name in characterSkills)) {
                filtered.push(skill);
            }
        }
        return filtered;
    }

    getLevelChoices() {
        if (this.state.selectedSkill) {
            var range = [];
            for (var ii = this.state.selectedSkill.min_level;
                 ii <= this.state.selectedSkill.max_level;
                 ii++) {
                range.push(ii)
            }
            return range;
        } else {
            return [];
        }
    }

    handleSkillChange(value) {

        var skill = undefined, minLevel = undefined;

        if (typeof(value) === "object") {
            skill = value;
            minLevel = value.min_level;
        }

        this.setState({skillValue: value,
            selectedSkill: skill,
            selectedLevel: minLevel});
    }

    handleLevelChange(value) {
        this.setState({selectedLevel: value});
    }

    skillValid() {
        var skill = this.state.selectedSkill;
        if (typeof(skill) === "undefined") {
            return false;
        }
        var level = this.state.selectedLevel;
        if (level <= skill.max_level && level >= skill.min_level) {
            return true;
        }
        return false;
    }

    handleAdd() {
        if (typeof(this.props.onCharacterSkillAdd) !== "undefined") {
            this.props.onCharacterSkillAdd(
                {skill: this.state.selectedSkill.name,
                 level: this.state.selectedLevel});
            this.setState({skillValue: '',
                selectedSkill: undefined,
                selectedLevel: ''})
        }
    }

    getSkillChoices() {
        return AddSkillControl.filterSkills(this.props.allSkills,
                this.props.characterSkillMap);
    }

    render () {
        var levelChoices = this.getLevelChoices();

        return <div>
            <table>
                <tbody>
                <tr>
                    <td><label>Skill</label></td>
                    <td><Combobox data={this.getSkillChoices()}
                                  textField='name'
                                  filter="contains" groupBy="type"
                                  value={this.state.skillValue}
                                  onChange={(value) =>
                                    this.handleSkillChange(value) }/></td>
                </tr>
                <tr>
                    <td><label>Level</label></td>
                    <td>
                        <Combobox data={levelChoices}
                                  value={this.state.selectedLevel}
                                  onChange={
                                  (value) => this.handleLevelChange(value)} />
                    </td>
                </tr>
                </tbody>
            </table>
            <Button size="sm" disabled={!this.skillValid()}
                    ref={(c) => this._addButton = c}
                    onClick={() => this.handleAdd()}>
                Add Skill</Button>
        </div>
    }
}

AddSkillControl.propTypes = {
    characterSkillMap: PropTypes.object.isRequired,
    allSkills: PropTypes.array.isRequired,
    onCharacterSkillAdd: PropTypes.func
};

export default AddSkillControl;
