import React from 'react';
import ReactDOM from 'react-dom';

var rest = require('sheet-rest');

import {Table} from 'react-bootstrap';
import SkillRow from 'SkillRow';

class SkillTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = { };
    }

    componentDidMount() {
        //rest.getData('skills')
    }

    findSkill(skillName) {
        for (var ii = 0; ii < this.props.allSkills.length; ii++) {
            var skill = this.props.allSkills[ii];
            if (skill.name === skillName) {
                return skill;
            }
        }
    }

    findCharacterSkill(skillName) {
        console.log()
        for (var ii = 0; ii < this.props.characterSkills.length; ii++) {
            var cs = this.props.characterSkills[ii];
            if (cs.skill === skillName) {
                return cs;
            }
        }
    }

    render () {
        var rows = [];
        var prefilled = ["Endurance / run",
            "Balance",
            "Stealth",
            "Concealment",
            "Search",
            "Climbing",
            "Swimming",
            "Jump",
            "Sleight of hand"
        ];
        var ii;
        for (ii = 0; ii < prefilled.length; ii++) {
            var skill = prefilled[ii];
            rows.push(
                <SkillRow key={`${skill}-${ii}`}
                          stats={this.props.stats}
                          characterSkill={this.findCharacterSkill(skill)}
                          skillName={skill}
                          skill={this.findSkill(skill)} />);
        }

        for (ii = 0; ii < this.props.characterSkills.length; ii++) {
            var cs = this.props.characterSkills[ii];
            rows.push(<SkillRow key={cs.id}
                                stats={this.props.stats}
                                characterSkill={cs}
                                skill={this.findSkill(cs.skill)} />);
        }
        return <Table striped><tbody>{rows}</tbody></Table>;
    }
}

SkillTable.propTypes = {
    characterSkills: React.PropTypes.array.isRequired,
    allSkills: React.PropTypes.array.isRequired,
    stats: React.PropTypes.object.isRequired
};

export default SkillTable;

