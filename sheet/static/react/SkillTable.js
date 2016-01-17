import React from 'react';
import ReactDOM from 'react-dom';

var rest = require('sheet-rest');
var util = require('sheet-util');

import {Panel, Table} from 'react-bootstrap';
import SkillRow from 'SkillRow';
import AddSkill from 'AddSkill';

class SkillTable extends React.Component {
    handleCharacterSkillAdd(skill) {
        if (typeof(this.props.onCharacterSkillAdd) != "undefined") {
            this.props.onCharacterSkillAdd(SkillTable.sanitizeSkillObject(skill));
        }
    }

    static sanitizeSkillObject(skill) {
        var obj = Object.assign({}, skill);
        var toRemove = [];
        for (var field in obj) {
            if (field[0] === '_') {
                toRemove.push(field);
            }
        }
        for (field of toRemove) {
            delete obj[field];
        }
        return obj;
    }

    handleCharacterSkillRemove(skill) {
        console.log("Removed: ", skill);
        if (typeof(this.props.onCharacterSkillRemove) != "undefined") {
            this.props.onCharacterSkillRemove(SkillTable.sanitizeSkillObject(skill));
        }
    }

    handleCharacterSkillModify(skill) {
        if (typeof(this.props.onCharacterSkillModify) != "undefined") {
            this.props.onCharacterSkillModify(SkillTable.sanitizeSkillObject(skill));
        }
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
        skillList = skillList.map((elem) => {var obj = Object.assign({}, elem);
        obj._children = [];
        return obj; });

        var csMap = SkillTable.getCharacterSkillMap(skillList);
        var skillMap = SkillTable.getSkillMap(allSkills);

        for (cs of skillList) {
            if (cs.skill in SkillTable.prefilledPhysicalSkillsMap) {
                continue;
            }
            newList.push(cs);
        }

        var addChild = function (parent, child) {
            parent._children.push(child);
        };

        var root = [];
        for (cs of newList) {
            var skill = skillMap[cs.skill];
            if (!skill) {
                cs._unknownSkill = true;
                root.push(cs);
            } else {
                if (skill.required_skills.length > 0) {
                    var parent = skill.required_skills[0];
                    cs._missingRequired = [];
                    for (let sk of skill.required_skills) {
                        if (!(sk in csMap)) {
                            cs._missingRequired.push(sk);
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
            for (let child of cs._children.sort(compare)) {
                depthFirst(child, indent + 1);
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

    static spCost(cs, skill) {
        if (!cs) {
            return 0;
        }
        var cost = 0;
        var level = cs.level;
        if (level > 3) {
            cost += (level - 3) * (skill.skill_cost_3 + 2);
        }
        if (level >= 3){
            cost += skill.skill_cost_3;
        }
        if (level >= 2){
            cost += skill.skill_cost_2;
        }
        if (level >= 1){
            cost += skill.skill_cost_1;
        }
        if (level >= 0){
            cost += skill.skill_cost_0;
        }
        return cost
    }

    render () {
        var rows = [];
        var ii;
        var csMap = SkillTable.getCharacterSkillMap(
            this.props.characterSkills);
        var skillMap = SkillTable.getSkillMap(this.props.allSkills);
        var totalSP = 0, spCost;

        for (ii = 0; ii < SkillTable.prefilledPhysicalSkills.length; ii++) {
            var skill = SkillTable.prefilledPhysicalSkills[ii];
            spCost = SkillTable.spCost(csMap[skill], skillMap[skill]);
            rows.push(
                <SkillRow key={`${skill}-${ii}`}
                          stats={this.props.effStats}
                          characterSkill={csMap[skill]}
                          skillName={skill}
                          onCharacterSkillRemove={(skill) => this.handleCharacterSkillRemove(skill)}
                          onCharacterSkillModify={(skill) => this.handleCharacterSkillModify(skill)}
                          skillPoints={spCost}
                          skill={skillMap[skill]} />);
            totalSP += spCost;
        }

        var skillList = SkillTable.mangleSkillList(this.props.characterSkills,
            this.props.allSkills);

        for (ii = 0; ii < skillList.length; ii++) {
            var cs = skillList[ii];
            spCost = SkillTable.spCost(cs, skillMap[cs.skill]);
            var idx = SkillTable.prefilledPhysicalSkills.length + ii;
            rows.push(<SkillRow key={`${cs.skill}-${idx}`}
                                stats={this.props.effStats}
                                characterSkill={cs}
                                onCharacterSkillRemove={(skill) => this.handleCharacterSkillRemove(skill)}
                                onCharacterSkillModify={(skill) => this.handleCharacterSkillModify(skill)}
                                indent={cs.indent}
                                skillPoints={spCost}
                                skill={skillMap[cs.skill]} />);
            totalSP += spCost;
        }
        return <Panel style={this.props.style} header={<h4>Skills</h4>}><Table style={{fontSize: "inherit"}} striped fill>
            <thead>
            <tr><th>Skill</th><th>Level</th><th>SP</th><th>Check</th></tr>
            </thead>
            <tbody>{rows}</tbody>
            <tfoot><tr><td colSpan="2">Total SP</td><td>{totalSP}</td><td></td></tr></tfoot>
        </Table>
            <AddSkill characterSkillMap={csMap}
                      allSkills={this.props.allSkills}
                      onCharacterSkillAdd={this.props.onCharacterSkillAdd} />
        </Panel>;
    }
}

SkillTable.propTypes = {
    characterSkills: React.PropTypes.array.isRequired,
    allSkills: React.PropTypes.array.isRequired,
    effStats: React.PropTypes.object.isRequired,
    baseStats: React.PropTypes.object.isRequired,
    onCharacterSkillAdd: React.PropTypes.func,
    onCharacterSkillRemove: React.PropTypes.func,
    onCharacterSkillModify: React.PropTypes.func
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

