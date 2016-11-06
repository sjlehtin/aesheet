/*
 * SkillHandler
 *
 * This is container, created typically in StatBlock, which handles
 * skills, characterskills and edges.
 */

/*
 * props: stats: statHandler
 * characterSkills
 * allSkills
 * edges <- probably should come from statHandler
 */
class SkillHandler {
    constructor(props) {
        this.props = props;
        this.state = {
            characterSkillMap: SkillHandler.getItemMap(this.props.characterSkills, 'skill'),
            skillMap: SkillHandler.getItemMap(this.props.allSkills),
            edgeMap: SkillHandler.getItemMap(this.props.edges, 'edge')
        }
    }

    static getItemMap(list, field) {
        if (!field) {
            field = 'name';
        }
        if (!list) {
            return {};
        }
        var newMap = {};
        for (let item of list) {
            newMap[item[field]] = item;
        }
        return newMap;
    }

    /* A base-level skill, i.e., Basic Artillery and the like. */
    isBaseSkill(skill) {
        if (skill.skill_cost_1 === null) {
            return true;
        } else {
            return false;
        }
    }

    getStat(stat) {
        return this.props.stats.getEffStats()[stat.toLowerCase()];
    }

    /*
     * If character has the skill, use the check directly.
     *
     * If character does not have the skill, but the skill level 0
     * has cost of 0, use level 0 check.  This should use the normal
     * skill check calculation, as the character may have armor
     * or edges which modify the skill check.
     *
     * If character doesn't have the skill, and the skill level 0 has
     * a non-zero cost, calculate check defaulted to half-ability.
     */
    skillCheck(skillName, stat) {
        var skill = this.state.skillMap[skillName];
        if (!skill || this.isBaseSkill(skill)) {
            return null;
        }

        if (!stat) {
            stat = skill.stat;
        }
        var ability = this.getStat(stat);
        var level = this.skillLevel(skillName);
        if (level === "U") {
            return Math.round(ability / 4)
        } else if (level === "B") {
            return Math.round(ability / 2)
        } else {
            return ability + level * 5;
        }
    }

    /* U is quarter-skill, i.e., using a pistol even without Basic
       Firearms.  B is half-skill, i.e., the character has top-level skill,
       but not the skill required.  Otherwise, if the character has the
        skill, return the level of the skill. */
    skillLevel(skillName) {
        var cs = this.state.characterSkillMap[skillName];
        var skill = this.state.skillMap[skillName];
        if (!skill) {
            return null;
        }
        if (!cs) {
            if (skill.required_skills.length > 0) {
                for (let reqd of skill.required_skills) {
                    if (!(reqd in this.state.characterSkillMap)) {
                        return "U";
                    }
                }
            }
            if (skill.skill_cost_0 > 0) {
                return 'B';
            } else {
                return 0;
            }
        } else {
            return cs.level;
        }
    }

    edgeLevel(edgeName) {
        if (edgeName in this.state.edgeMap) {
            return this.state.edgeMap[edgeName].level;
        } else {
            return null;
        }
    }

    hasSkill(skillName) {
        return skillName in this.state.characterSkillMap;
    }

    getEdgeList() {
        return this.props.edges;
    }
}

export default SkillHandler;