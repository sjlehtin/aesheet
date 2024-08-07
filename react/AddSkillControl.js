import React from "react";
import PropTypes from "prop-types";

import { Button } from "react-bootstrap";

import Combobox from "react-widgets/Combobox";

class AddSkillControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      skillValue: "",
      selectedSkill: undefined,
    };
  }

  getLevelChoices() {
    if (this.state.selectedSkill) {
      var range = [];
      for (
        var ii = this.state.selectedSkill.min_level;
        ii <= this.state.selectedSkill.max_level;
        ii++
      ) {
        range.push(ii);
      }
      return range;
    } else {
      return [];
    }
  }

  handleSkillChange(value) {
    var skill = undefined,
      minLevel = undefined;

    if (typeof value === "object") {
      skill = value;
      minLevel = value.min_level;
    }

    this.setState({
      skillValue: value,
      selectedSkill: skill,
      selectedLevel: minLevel,
    });
  }

  handleLevelChange(value) {
    this.setState({ selectedLevel: value });
  }

  skillValid() {
    var skill = this.state.selectedSkill;
    if (typeof skill === "undefined") {
      return false;
    }
    var level = parseInt(this.state.selectedLevel);
    if (level <= skill.max_level && level >= skill.min_level) {
      return true;
    }
    return false;
  }

  async handleAdd() {
      await this.props.onCharacterSkillAdd({
        skill: this.state.selectedSkill.id,
        level: parseInt(this.state.selectedLevel),
      })
      this.setState({
        skillValue: "",
        selectedSkill: undefined,
        selectedLevel: "",
      });
  }

  render() {
    var levelChoices = this.getLevelChoices();

    return (
      <div>
        <table>
          <tbody>
            <tr aria-label={"Add skill name"}>
              <td>
                <label>Skill</label>
              </td>
              <td>
                <Combobox
                  data={this.props.allSkills}
                  textField="name"
                  filter="contains"
                  groupBy="type"
                  value={this.state.skillValue}
                  onChange={(value) => this.handleSkillChange(value)}
                />
              </td>
            </tr>
            <tr aria-label={"Add skill level"}>
              <td>
                <label>Level</label>
              </td>
              <td>
                <Combobox
                  data={levelChoices}
                  value={this.state.selectedLevel}
                  onChange={(value) => this.handleLevelChange(value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <Button
          aria-label={"Add skill"}
          size="sm"
          disabled={!this.skillValid()}
          onClick={() => this.handleAdd()}
        >
          Add Skill
        </Button>
      </div>
    );
  }
}

AddSkillControl.propTypes = {
  allSkills: PropTypes.array.isRequired,
  onCharacterSkillAdd: PropTypes.func,
};

export default AddSkillControl;
