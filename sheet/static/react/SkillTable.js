import React from 'react';
import ReactDOM from 'react-dom';

var rest = require('sheet-rest');
var util = require('sheet-util');

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
        for (var ii = 0; ii < this.props.characterSkills.length; ii++) {
            var cs = this.props.characterSkills[ii];
            if (cs.skill === skillName) {
                return cs;
            }
        }
    }

    static mangleSkillList(skillList, allSkills) {
        var newList = [];
        var cs;

        // Make a deep copy of the list so as not accidentally mangle
        // parent copy of the props.
        skillList = skillList.map((elem) => {return Object.assign({}, elem)});

        var csMap = SkillTable.getCharacterSkillMap(skillList);
        var skillMap = SkillTable.getSkillMap(allSkills);

        for (cs of skillList) {
            if (cs.skill in SkillTable.prefilledPhysicalSkillsMap) {
                continue;
            }
            newList.push(cs);
        }

        var addChild = function (parent, child) {
            if (!('children' in parent)) {
                parent.children = [];
            }
            parent.children.push(child);
        };

        var root = [];
        for (cs of newList) {
            var skill = skillMap[cs.skill];
            if (!skill) {
                cs.unknownSkill = true;
                root.push(cs);
            } else {
                if (skill.required_skills.length > 0) {
                    var parent = skill.required_skills[0];
                    cs.missingRequired = [];
                    for (let sk of skill.required_skills) {
                        if (!(sk in csMap)) {
                            cs.missingRequired.push(sk);
                        }
                    }
                    if (parent in csMap) {
                        addChild(csMap[parent], cs);
                    } else {
                        root.push(cs);
                    }
                } else {
                    root.push(cs);
                }
            }
        }

        var finalList = [];
        var compare = function (a, b) {
            return +(a.skill > b.skill) || +(a.skill === b.skill) - 1;
        };
        var depthFirst = function (cs, indent) {
            cs.indent = indent;
            finalList.push(cs);
            if ('children' in cs) {
                for (let child of cs.children.sort(compare)) {
                    depthFirst(child, indent + 1);
                }
            }
        };
        for (cs of root.sort(compare)) {
            depthFirst(cs, 0);
        }
        return finalList;
    }

    static getCharacterSkillMap(skillList) {
        var csMap = {};
        for (let cs of skillList) {
            csMap[cs.skill] = cs;
        }
        return csMap;
    }

    static getSkillMap(skillList) {
        var skillMap = {};
        for (let skill of skillList) {
            skillMap[skill.name] = skill;
        }
        return skillMap;
    }

    render () {
        var rows = [];
        var ii;
        var csMap = SkillTable.getCharacterSkillMap(
            this.props.characterSkills);
        var skillMap = SkillTable.getSkillMap(this.props.allSkills);

        for (ii = 0; ii < SkillTable.prefilledPhysicalSkills.length; ii++) {
            var skill = SkillTable.prefilledPhysicalSkills[ii];
            rows.push(
                <SkillRow key={`${skill}-${ii}`}
                          stats={this.props.stats}
                          characterSkill={csMap[skill]}
                          skillName={skill}
                          skill={skillMap[skill]} />);
        }

        //var skills = this.sortSkills(this.props.characterSkills);
        var skillList = SkillTable.mangleSkillList(this.props.characterSkills,
            this.props.allSkills);

        for (ii = 0; ii < skillList.length; ii++) {
            var cs = skillList[ii];
            rows.push(<SkillRow key={cs.id}
                                stats={this.props.stats}
                                characterSkill={cs}
                                indent={cs.indent}
                                skill={skillMap[cs.skill]} />);
        }
        return <Table striped><tbody>{rows}</tbody></Table>;
    }
}

SkillTable.propTypes = {
    characterSkills: React.PropTypes.array.isRequired,
    allSkills: React.PropTypes.array.isRequired,
    stats: React.PropTypes.object.isRequired
};

SkillTable.prefilledPhysicalSkills = ["Endurance / run",
    "Balance",
    "Stealth",
    "Concealment",
    "Search",
    "Climbing",
    "Swimming",
    "Jump",
    "Sleight of hand"
];
SkillTable.prefilledPhysicalSkillsMap = util.toObject(
    SkillTable.prefilledPhysicalSkills);

export default SkillTable;

