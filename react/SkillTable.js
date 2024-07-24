import React from "react";
import PropTypes from "prop-types";

import * as util from "./sheet-util";

import { Card, Table } from "react-bootstrap";
import SkillRow from "./SkillRow";
import AddSkillControl from "./AddSkillControl";

class SkillTable extends React.Component {
  mangleSkillList() {
    return this.props.skillHandler.getSkillList().filter((cs) => {
      return SkillTable.prefilledPhysicalSkills.indexOf(cs.skill__name) === -1;
    });
  }

  static getCharacterSkillMap(skillList) {
    if (!skillList) {
      return {};
    }
    let csMap = {};
    for (let cs of skillList) {
      csMap[cs.skill__name] = cs;
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
    if (level >= 3) {
      cost += skill.skill_cost_3;
    }
    if (level >= 2) {
      cost += skill.skill_cost_2;
    }
    if (level >= 1) {
      cost += skill.skill_cost_1;
    }
    if (level >= 0) {
      cost += skill.skill_cost_0;
    }
    return cost;
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
    console.assert(typeof char !== "undefined");
    return (
      util.roundup(char.start_lrn / 3) +
      util.roundup(char.start_int / 5) +
      util.roundup(char.start_psy / 10)
    );
  }

  earnedSkillPoints() {
    // TODO: data privacy.
    var char = this.props.skillHandler.props.character;

    return char.gained_sp;
  }

  optimizeAgeSP() {
    var baseStats = this.props.skillHandler.getBaseStats();
    /* Optimal stat raises, slightly munchkin, but only sensible. */
    var raw = baseStats.lrn / 15 + baseStats.int / 25 + baseStats.psy / 50;
    var diff = util.roundup(raw) - raw;
    var lrn = util.rounddown(diff * 15);
    var int = util.rounddown((diff - lrn / 15) * 25);
    var psy = util.roundup(diff - lrn / 15 - int / 25);
    return { lrn: lrn, int: int, psy: psy };
  }

  render() {
    var rows = [];
    var ii;
    var csMap = SkillTable.getCharacterSkillMap(
      this.props.skillHandler.props.characterSkills,
    );
    var skillMap = SkillTable.getSkillMap(
      this.props.skillHandler.props.allSkills,
    );
    var totalSP = 0,
      spCost;
    var skill;

    for (ii = 0; ii < SkillTable.prefilledPhysicalSkills.length; ii++) {
      var skillName = SkillTable.prefilledPhysicalSkills[ii];
      skill = skillMap[skillName];
      if (skill) {
        spCost = SkillTable.spCost(csMap[skillName], skill);
        rows.push(
          <SkillRow
            key={`${skillName}-${ii}`}
            skillHandler={this.props.skillHandler}
            skillName={skillName}
            onCharacterSkillRemove={(skill) =>
              this.props.onCharacterSkillRemove(skill)
            }
            onCharacterSkillModify={(skill) =>
              this.props.onCharacterSkillModify(skill)
            }
            stats={this.props.skillHandler.getEffStats()}
            characterSkill={csMap[skillName]}
            skillPoints={spCost}
            skill={skill}
          />,
        );
        totalSP += spCost;
      } else {
        rows.push(
          <tr key={`${skillName}-${ii}`}>
            <td style={{ color: "red" }}>
              Real skill missing for {skillName}.
            </td>
          </tr>,
        );
      }
    }

    var skillList = this.mangleSkillList();

    for (ii = 0; ii < skillList.length; ii++) {
      var cs = skillList[ii];
      skill = skillMap[cs.skill__name];
      if (skill) {
        spCost = SkillTable.spCost(cs, skill);
        var idx = SkillTable.prefilledPhysicalSkills.length + ii;
        rows.push(
          <SkillRow
            key={`${cs.skill}-${idx}`}
            skillName={skill.name}
            skillHandler={this.props.skillHandler}
            stats={this.props.skillHandler.getEffStats()}
            characterSkill={cs}
            onCharacterSkillRemove={(skill) =>
              this.props.onCharacterSkillRemove(skill)
            }
            onCharacterSkillModify={(skill) =>
              this.props.onCharacterSkillModify(skill)
            }
            indent={cs.indent}
            skillPoints={spCost}
            skill={skill}
          />,
        );
        totalSP += spCost;
      } else {
        rows.push(
          <tr key={`${cs.skill}-${idx}`}>
            <td style={{ color: "red" }}>
              Real skill missing for {cs.skill__name}.
            </td>
          </tr>,
        );
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

    return (
      <Card style={this.props.style}>
        <Card.Header>
          <h4>Skills</h4>
        </Card.Header>
        <Card.Body className={"table-responsive p-0"}>
          <Table aria-label={"Skills"} style={{ fontSize: "inherit" }} striped>
            <thead>
              <tr>
                <th>Skill</th>
                <th>Level</th>
                <th>SP</th>
                <th>Check</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
            <tfoot>
              <tr>
                <td colSpan="2" style={{ fontWeight: "bold" }}>
                  Total SP used
                </td>
                <td colSpan={2} style={totalStyle} title={totalTitle}>
                  {totalSP}
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ fontWeight: "bold" }}>
                  Gained SP
                </td>
                <td colSpan={2}>
                  <span
                    title="From starting stats"
                    aria-label={"SP from starting stats"}
                  >
                    {initialSP}
                  </span>
                  <span> + </span>
                  <span title="From edges" aria-label={"SP from edges"}>
                    {edgeSP}
                  </span>
                  <span> + </span>
                  <span
                    title="Earned during play"
                    aria-label={"SP earned during play"}
                  >
                    {ageSP}
                  </span>
                  <span> = </span>
                  <span title="Total gained" aria-label={"Total gained SP"}>
                    {gainedSP}
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ fontWeight: "bold" }}>
                  Next age SP increase
                </td>
                <td colSpan={2}>
                  <span aria-label={"SP optimization hint"}>
                    {util.renderInt(opt.lrn)} LRN, {util.renderInt(opt.int)}{" "}
                    INT, {util.renderInt(opt.psy)} PSY
                  </span>
                </td>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
        <Card.Footer>
          <AddSkillControl
            characterSkillMap={csMap}
            allSkills={this.props.skillHandler.props.allSkills}
            onCharacterSkillAdd={this.props.onCharacterSkillAdd}
            style={this.props.style}
          />
        </Card.Footer>
      </Card>
    );
  }
}

SkillTable.propTypes = {
  skillHandler: PropTypes.object.isRequired,
  onCharacterSkillAdd: PropTypes.func,
  onCharacterSkillRemove: PropTypes.func,
  onCharacterSkillModify: PropTypes.func,
};

/*
 * 2024 Update:
 *
 * SAVES / ALL (<AB>)
 *
 * Acquire asset (POS)                                             0/2/2/3
 * Balance (MOV)                                                   0/2/2/3
 * Dodge (REF)                                                     0/2/2/3
 * Endurance / Run (FIT)                                           0/2/2/3
 * Find information (LRN)                                          0/2/2/3
 * Mental fortitude (WIL)                                          0/2/2/3
 * Negotiate / Persuade (CHA)                                      0/2/2/3
 * Physical fortitude (IMM)                                        0/2/2/3
 * Search / Observe (INT)                                          0/2/2/3
 * Sneak / Stealth (DEX)                                           0/2/2/3
 * Surprise / Tail / Shadow (PSY)                                  0/2/2/3
 *
 * PHYSICAL (½ <AB>)
 * Basic movement modes  (½ <AB>)
 * Climb (MOV)                                                     1/1/2/3
 * Hide / Conceal (INT)                                            1/1/2/3
 * Jump (FIT)                                                      1/1/2/3
 * Swim (FIT)                                                      1/1/2/3
 */

SkillTable.prefilledPhysicalSkills = [
  "Acquire asset",
  "Balance",
  "Dodge",
  "Endurance / run",
  "Find information",
  "Mental fortitude",
  "Persuasion",
  "Physical fortitude",
  "Search",
  "Stealth",
  "Tailing / Shadowing",
  "Climbing",
  "Concealment",
  "Jump",
  "Swimming",
  "Sleight of hand",
];

export default SkillTable;
