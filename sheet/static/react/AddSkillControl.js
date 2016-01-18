import React from 'react';
import ReactDOM from 'react-dom';

import {Grid, Col, Row, Label, Button} from 'react-bootstrap';

import Combobox from 'react-widgets/lib/Combobox';

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
        var skill = undefined;
        if (typeof(value) === "object") {
            skill = value;
        }

        this.setState({skillValue: value, selectedSkill: skill});
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

    handleAdd(){
        if (typeof(this.props.onCharacterSkillAdd) !== "undefined") {
            this.props.onCharacterSkillAdd(
                {skill: this.state.selectedSkill.name,
                 level: this.state.selectedLevel});
            this.setState({skillValue: '',
                selectedSkill: undefined,
                selectedLevel: ''})
        }
    }

    render () {
        var levelChoices = this.getLevelChoices();

        return <div style={{verticalAlign: "center"}}>
                    <Row>
                        <Col md={2}>
                        <Label>Skill</Label>
                        </Col>
                        <Col md={10}>
                <Combobox data={
              AddSkillControl.filterSkills(this.props.allSkills,
                this.props.characterSkillMap)} textField='name' suggest
                      filter="contains" groupBy="type"
                          value={this.state.skillValue}
                          onChange={(value) => this.handleSkillChange(value) }
                />
                </Col>
                    </Row>

            <Row>
                        <Col md={2}>
                        <Label>Level</Label>
                            </Col>
                    <Col md={10}>
                        <Combobox data={levelChoices}
                                  value={this.state.selectedLevel}
                                  onChange={
                                  (value) => this.handleLevelChange(value)}
                        />
                    </Col>
            </Row>
            <Row>
                <Col md={3}>
            <Button bsSize="small" disabled={!this.skillValid()}
                    ref={(c) => this._addButton = c}
                    onClick={() => this.handleAdd()}>
                Add Skill</Button>
                    </Col>
            </Row>
        </div>
    }
}

AddSkillControl.propTypes = {
    characterSkillMap: React.PropTypes.object.isRequired,
    allSkills: React.PropTypes.array.isRequired,
    onCharacterSkillAdd: React.PropTypes.func
};

export default AddSkillControl;
