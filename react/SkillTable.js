import React from 'react';
import PropTypes from 'prop-types';

const rest = require('./sheet-rest');
const util = require('./sheet-util');

import {Card, Table} from 'react-bootstrap';
import SkillRow from './SkillRow';
import AddSkillControl from './AddSkillControl';

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
            if (obj.hasOwnProperty(field)) {
                if (field[0] === '_') {
                    toRemove.push(field);
                }
            }
        }
        for (field of toRemove) {
            delete obj[field];
        }
        return obj;
    }

    handleCharacterSkillRemove(skill) {
        if (this.props.onCharacterSkillRemove) {
            this.props.onCharacterSkillRemove(SkillTable.sanitizeSkillObject(skill));
        }
    }

    handleCharacterSkillModify(skill) {
        if (this.props.onCharacterSkillModify) {
            this.props.onCharacterSkillModify(SkillTable.sanitizeSkillObject(skill));
        }
    }

    mangleSkillList() {
        return this.props.skillHandler.getSkillList().filter(
            (cs) => { return !(cs.skill in SkillTable.prefilledPhysicalSkillsMap)});
    }

    static getCharacterSkillMap(skillList) {
        if (!skillList) {
            return {};
        }
        let csMap = {};
        for (let cs of skillList) {
            csMap[cs.skill] = cs;
        }
        return csMap;
    }

    static getSkillMap(skillList) {
        if (!skillList) {
            return {};
        }
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
        // TODO: data privacy.
        const char = this.props.skillHandler.props.character;
        console.assert(typeof(char) !== "undefined");
        return util.roundup(char.start_lrn/3) + util.roundup(char.start_int/5) +
                util.roundup(char.start_psy/10);
    }

    earnedSkillPoints() {
        // TODO: data privacy.
        var char = this.props.skillHandler.props.character;

        return char.gained_sp;
    }

    optimizeAgeSP() {
        var baseStats = this.props.skillHandler.getBaseStats();
        /* Optimal stat raises, slightly munchkin, but only sensible. */
        var raw = baseStats.lrn/15 + baseStats.int/25
            + baseStats.psy/50;
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
            this.props.skillHandler.props.characterSkills);
        var skillMap = SkillTable.getSkillMap(this.props.skillHandler.props.allSkills);
        var totalSP = 0, spCost;
        var skill;

        for (ii = 0; ii < SkillTable.prefilledPhysicalSkills.length; ii++) {
            var skillName = SkillTable.prefilledPhysicalSkills[ii];
            skill = skillMap[skillName];
            if (skill) {
                spCost = SkillTable.spCost(csMap[skillName], skill);
                rows.push(
                    <SkillRow key={`${skillName}-${ii}`}
                              skillHandler={this.props.skillHandler}
                              skillName={skillName}
                              onCharacterSkillRemove={(skill) => this.handleCharacterSkillRemove(skill)}
                              onCharacterSkillModify={(skill) => this.handleCharacterSkillModify(skill)}

                              stats={this.props.skillHandler.getEffStats()}
                              characterSkill={csMap[skillName]}
                              skillPoints={spCost}
                              skill={skill}/>);
                totalSP += spCost;
            } else {
                rows.push(<tr key={`${skillName}-${ii}`}>
                    <td style={{color: "red"}}
                    >Real skill missing for {skillName}.</td></tr>);
            }
        }

        var skillList = this.mangleSkillList();

        for (ii = 0; ii < skillList.length; ii++) {
            var cs = skillList[ii];
            skill = skillMap[cs.skill];
            if (skill) {
                spCost = SkillTable.spCost(cs, skill);
                var idx = SkillTable.prefilledPhysicalSkills.length + ii;
                rows.push(<SkillRow key={`${cs.skill}-${idx}`}
                                    skillName={skill.name}
                                    skillHandler={this.props.skillHandler}
                                    stats={this.props.skillHandler.getEffStats()}
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

        const edgeSP = this.edgeSkillPoints(),
            initialSP = this.initialSkillPoints(),
            ageSP = this.earnedSkillPoints();
        const gainedSP = edgeSP + initialSP + ageSP;

        let totalStyle = {};
        let totalTitle = "";
        if (totalSP > gainedSP) {
            totalTitle = "Too much SP used!";
            totalStyle.color = "red";
        }
        const opt = this.optimizeAgeSP();

        return <Card style={this.props.style}>
            <Card.Header>
                <h4>Skills</h4>
            </Card.Header>
            <Card.Body className={"table-responsive p-0"}>
            <Table style={{fontSize: "inherit"}} striped>
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
            </Card.Body>
            <Card.Footer>
            <AddSkillControl characterSkillMap={csMap}
                             allSkills={this.props.skillHandler.props.allSkills}
                             onCharacterSkillAdd={this.props.onCharacterSkillAdd}
                             style={this.props.style}/>
            </Card.Footer>
        </Card>;
    }
}

SkillTable.propTypes = {
    skillHandler: PropTypes.object.isRequired,
    onCharacterSkillAdd: PropTypes.func,
    onCharacterSkillRemove: PropTypes.func,
    onCharacterSkillModify: PropTypes.func,
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

