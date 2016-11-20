import React from 'react';
import ReactDOM from 'react-dom';

var rest = require('sheet-rest');
var util = require('sheet-util');

import {Panel, Table} from 'react-bootstrap';
import SkillRow from 'SkillRow';
import AddSkillControl from 'AddSkillControl';

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
        if (!skill) {
            return null;
        }
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

    // TODO: move to skillhandler
    edgeSkillPoints() {
        var sum = 0;
        for (let edge of this.props.skillHandler.getEdgeList()) {
            sum += edge.extra_skill_points;
        }
        return sum;
    }

    initialSkillPoints() {
        return util.roundup(this.props.character.start_lrn/3) + util.roundup(this.props.character.start_int/5) +
                util.roundup(this.props.character.start_psy/10);
    }

    earnedSkillPoints() {
        return this.props.character.gained_sp;
    }

    optimizeAgeSP() {
        /* Optimal stat raises, slightly munchkin, but only sensible. */
        var raw = this.props.baseStats.lrn/15 + this.props.baseStats.int/25
            + this.props.baseStats.psy/50;
        var diff = util.roundup(raw) - raw;
        var lrn = util.rounddown(diff * 15);
        var int = util.rounddown((diff - lrn/15) * 25);
        var psy = util.roundup(diff - lrn/15 - int/25);
        return {lrn: lrn, int: int, psy: psy};
    }

    render () {
        var rows = [];
        var ii;
        var csMap = SkillTable.getCharacterSkillMap(
            this.props.characterSkills);
        var skillMap = SkillTable.getSkillMap(this.props.allSkills);
        var totalSP = 0, spCost;
        var skill;

        for (ii = 0; ii < SkillTable.prefilledPhysicalSkills.length; ii++) {
            var skillName = SkillTable.prefilledPhysicalSkills[ii];
            skill = skillMap[skillName];
            if (skill) {
                spCost = SkillTable.spCost(csMap[skillName], skill);
                rows.push(
                    <SkillRow key={`${skillName}-${ii}`}
                              stats={this.props.effStats}
                              characterSkill={csMap[skillName]}
                              skillName={skillName}
                              onCharacterSkillRemove={(skill) => this.handleCharacterSkillRemove(skill)}
                              onCharacterSkillModify={(skill) => this.handleCharacterSkillModify(skill)}
                              skillPoints={spCost}
                              skill={skill}/>);
                totalSP += spCost;
            } else {
                rows.push(<tr key={`${skillName}-${ii}`}>
                    <td style={{color: "red"}}
                    >Real skill missing for {skillName}.</td></tr>);
            }
        }

        var skillList = SkillTable.mangleSkillList(this.props.characterSkills,
            this.props.allSkills);

        for (ii = 0; ii < skillList.length; ii++) {
            var cs = skillList[ii];
            skill = skillMap[cs.skill];
            if (skill) {
                spCost = SkillTable.spCost(cs, skill);
                var idx = SkillTable.prefilledPhysicalSkills.length + ii;
                rows.push(<SkillRow key={`${cs.skill}-${idx}`}
                                    stats={this.props.effStats}
                                    characterSkill={cs}
                                    onCharacterSkillRemove={(skill) => this.handleCharacterSkillRemove(skill)}
                                    onCharacterSkillModify={(skill) => this.handleCharacterSkillModify(skill)}
                                    indent={cs.indent}
                                    skillPoints={spCost}
                                    skill={skill}/>);
                totalSP += spCost;
            } else {
                rows.push(<tr key={`${cs.skill}-${idx}`}>
                    <td style={{color: "red"}}
                    >Real skill missing for {cs.skill}.</td></tr>);
            }
        }

        var edgeSP = this.edgeSkillPoints(),
            initialSP = this.initialSkillPoints(),
            ageSP = this.earnedSkillPoints(),
            gainedSP = edgeSP + initialSP + ageSP;

        var totalStyle = {};
        if (totalSP > gainedSP) {
            var totalTitle = "Too much SP used!";
            totalStyle.color = "red";
        }
        var opt = this.optimizeAgeSP();

        return <Panel style={this.props.style} header={<h4>Skills</h4>}><Table style={{fontSize: "inherit"}} striped fill>
            <thead>
            <tr><th>Skill</th><th>Level</th><th>SP</th><th>Check</th></tr>
            </thead>
            <tbody>{rows}</tbody>
            <tfoot><tr>
                <td colSpan="2" style={{ fontWeight: 'bold'}}>
                    Total SP used</td>
                <td colSpan={2} style={totalStyle} title={totalTitle}>{totalSP}</td></tr>
            <tr><td colSpan={2} style={{ fontWeight: 'bold'}}>Gained SP</td>
                <td colSpan={2}>
                <span title="From starting stats">{initialSP}</span>
                <span> + </span>
                <span title="From edges">{edgeSP}</span>
                <span> + </span>
                <span title="Earned during play">{ageSP}</span>
                <span> = </span>
                <span title="Total gained">{gainedSP}</span></td></tr>
            <tr><td colSpan={2} style={{ fontWeight: 'bold'}}>Next age SP increase</td>
                <td colSpan={2}>{util.renderInt(opt.lrn)
                } LRN, {util.renderInt(opt.int)} INT,  {
                    util.renderInt(opt.psy)} PSY
                </td>
            </tr>
            </tfoot>
        </Table>
            <AddSkillControl characterSkillMap={csMap}
                             allSkills={this.props.allSkills}
                             onCharacterSkillAdd={this.props.onCharacterSkillAdd}
                             style={this.props.style}/>
        </Panel>;
    }
}

SkillTable.propTypes = {
    characterSkills: React.PropTypes.array.isRequired,
    allSkills: React.PropTypes.array.isRequired,
    effStats: React.PropTypes.object.isRequired,
    baseStats: React.PropTypes.object.isRequired,
    skillHandler: React.PropTypes.object.isRequired,
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

