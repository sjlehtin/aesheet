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
            characterSkillMap: SkillHandler.getItemMap(this.props.characterSkills,
                (item) => { return item.skill; }),
            skillMap: SkillHandler.getItemMap(this.props.allSkills),
            edgeMap: SkillHandler.getItemMap(this.props.edges,
            (item) => { return item.edge.name; })
        };
    }

    static getItemMap(list, accessor) {
        if (!accessor) {
            accessor = (item) => { return item.name; };
        }
        if (!list) {
            return {};
        }
        var newMap = {};
        for (let item of list) {
            newMap[accessor(item)] = item;
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
            return 0;
        }
    }

    hasSkill(skillName) {
        return skillName in this.state.characterSkillMap;
    }

    getEdgeList() {
        return this.props.edges;
    }

    // Movement rates.

    sneakingSpeed() {
        return this.props.stats.getEffStats().mov / 5;
    }

    runningSpeed() {
        var rate = this.props.stats.getEffStats().mov;

        var edgeRate = this.props.stats.getEdgeModifier('run_multiplier');
        var effRate = this.props.stats.getEffectModifier('run_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
        }
        if (effRate) {
            rate *= effRate;
        }
        return rate;

    }

    sprintingSpeed() {
        return this.runningSpeed() * 1.5;
    }

    climbingSpeed() {
        var level = this.skillLevel('Climbing');
        var rate;
        if (typeof(level) !== 'number') {
            rate = this.props.stats.getEffStats().mov / 60;
        } else {
            rate = this.props.stats.getEffStats().mov / 30 + level;
        }

        var edgeRate = this.props.stats.getEdgeModifier('climb_multiplier');
        var effRate = this.props.stats.getEffectModifier('climb_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
        }
        if (effRate) {
            rate *= effRate;
        }
        return rate;
    }
    
    swimmingSpeed() {
        var level = this.skillLevel('Swimming');
        var rate;
        if (typeof(level) !== 'number') {
            rate = this.props.stats.getEffStats().mov / 10;
        } else {
            rate = this.props.stats.getEffStats().mov / 5 + level * 5;
        }

        var edgeRate = this.props.stats.getEdgeModifier('swim_multiplier');
        var effRate = this.props.stats.getEffectModifier('swim_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
        }
        if (effRate) {
            rate *= effRate;
        }
        return rate;
    }

    jumpingDistance() {
        var level = this.skillLevel('Jumping');
        var rate;
        if (typeof(level) !== 'number') {
            rate = this.props.stats.getEffStats().mov / 24;
        } else {
            rate = this.props.stats.getEffStats().mov / 12 + level*0.75;
        }

        var edgeRate = this.props.stats.getEdgeModifier('run_multiplier');
        var effRate = this.props.stats.getEffectModifier('run_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
        }
        if (effRate) {
            rate *= effRate;
        }
        return rate;

    }

    jumpingHeight() {
        return this.jumpingDistance() / 3;
    }
    
    
    flyingSpeed() {
        var canFly = false;
        var rate = this.props.stats.getEffStats().mov;
        var edgeRate = this.props.stats.getEdgeModifier('fly_multiplier');
        var effRate = this.props.stats.getEffectModifier('fly_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
            canFly = true;
        }
        if (effRate) {
            rate *= effRate;
            canFly = true;
        }

        if (canFly) {
            return rate;
        } else {
            return 0;
        }
    }
}

export default SkillHandler;