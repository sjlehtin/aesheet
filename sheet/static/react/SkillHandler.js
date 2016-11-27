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
 * edges
 *
 * StatHandler functionality to SkillHandler, nuke StatHandler,
 * TODO: rename SkillHandler to CheckHandler (or CheckController).
 *
 * TODO: study Redux for handling state in a cleaner fashion.
 */

var util = require('sheet-util');

class SkillHandler {
    constructor(props) {
        this.props = Object.assign({}, SkillHandler.defaultProps, props);

        // TODO: unify state variables after meld.
        this.state = {
            edgeMap: SkillHandler.getItemMap(this.props.edges,
            (item) => { return item.edge.name; }),
            skillBonusMap: this.getSkillBonusMap()
        };

        this.state.skillList = this.createSkillList();

        this._hardMods = {};
        this._softMods = {};

        for (let st of SkillHandler.allStatNames) {
            this._hardMods[st] = 0;
            this._softMods[st] = 0;
        }

        for (let mod of this.props.edges) {
            for (let st of SkillHandler.allStatNames) {
                this._hardMods[st] += mod[st];
            }
        }

        for (let mod of this.props.effects) {
            for (let st of SkillHandler.allStatNames) {
                this._softMods[st] += mod[st];
            }
        }

        for (let st of ["fit", "ref", "psy"]) {

            this._softMods[st] += this.getArmorMod(this.props.helm, st) +
                 this.getArmorMod(this.props.armor, st);
        }

        this._baseStats = undefined;
        this._effStats = undefined;

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

    getSkillBonusMap() {
        if (!this.props.edges) {
            return {};
        }

        var skillBonusMap = {};
        for (let edge of this.props.edges) {
            for (let sb of edge.edge_skill_bonuses) {
                if (!(sb.skill in skillBonusMap)) {
                    skillBonusMap[sb.skill] = {bonus: 0};
                }
                skillBonusMap[sb.skill].bonus += sb.bonus;
            }
        }
        return skillBonusMap;
    }

    /* A base-level skill, i.e., Basic Artillery and the like. */
    isBaseSkill(skillName) {
        var skill = this.state.skillMap[skillName];

        if (skill.skill_cost_1 === null) {
            return true;
        } else {
            return false;
        }
    }

    getStat(stat) {
        return this.getEffStats()[stat.toLowerCase()];
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
        if (!skill || this.isBaseSkill(skillName)) {
            return null;
        }

        if (!stat) {
            stat = skill.stat;
        }
        var ability = this.getStat(stat);
        var level = this.skillLevel(skillName);

        var check = 0;
        if (level === "U") {
            check = Math.round(ability / 4)
        } else if (level === "B") {
            check = Math.round(ability / 2)
        } else {
            check = ability + level * 5;
        }
        if (skillName in this.state.skillBonusMap) {
            check += this.state.skillBonusMap[skillName].bonus;
        }

        check += this.getSkillMod(skillName);
        return check;
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

    getSkillList() {
        return this.state.skillList;
    }

    createSkillList() {
        var newList = [];
        var cs;

        // Make a deep copy of the list so as not accidentally mangle
        // parent copy of the props.
        var skillList = this.props.characterSkills.map(
            (elem) => {var obj = Object.assign({}, elem);
        obj._children = [];
        return obj; });

        this.state.characterSkillMap = SkillHandler.getItemMap(skillList,
                (item) => { return item.skill; });
        this.state.skillMap = SkillHandler.getItemMap(this.props.allSkills);

        var csMap = this.state.characterSkillMap;
        var skillMap = this.state.skillMap;

        var addChild = function (parent, child) {
            parent._children.push(child);
        };

        var root = [];
        for (cs of skillList) {
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

    // Movement rates.

    sneakingSpeed() {
        return this.getEffStats().mov / 5;
    }

    runningSpeed() {
        var rate = this.getEffStats().mov;

        var edgeRate = this.getEdgeModifier('run_multiplier');
        var effRate = this.getEffectModifier('run_multiplier');
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
            rate = this.getEffStats().mov / 60;
        } else {
            rate = this.getEffStats().mov / 30 + level;
        }

        var edgeRate = this.getEdgeModifier('climb_multiplier');
        var effRate = this.getEffectModifier('climb_multiplier');
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
            rate = this.getEffStats().mov / 10;
        } else {
            rate = this.getEffStats().mov / 5 + level * 5;
        }

        var edgeRate = this.getEdgeModifier('swim_multiplier');
        var effRate = this.getEffectModifier('swim_multiplier');
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
            rate = this.getEffStats().mov / 24;
        } else {
            rate = this.getEffStats().mov / 12 + level*0.75;
        }

        var edgeRate = this.getEdgeModifier('run_multiplier');
        var effRate = this.getEffectModifier('run_multiplier');
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
        var rate = this.getEffStats().mov;
        var edgeRate = this.getEdgeModifier('fly_multiplier');
        var effRate = this.getEffectModifier('fly_multiplier');
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

    // Stats.

    getArmorMod(armor, givenStat) {
        var mod = 0;
        var stat = "mod_" + givenStat;
        if (armor.base && stat in armor.base) {
            mod += armor.base[stat];
        }
        if (armor.quality && stat in armor.quality) {
            mod += armor.quality[stat];
        }
        // Quality can not raise the stat, it only counters penalties.
        // Outlined in the armor excel.
        if (mod > 0) {
            mod = 0;
        }
        return mod;
    }

    getSkillMod(skill) {
        var normalized = skill.toLowerCase();
        if (normalized === "climbing") {
            normalized = "climb";
        } else if (normalized === "concealment") {
            normalized = "conceal";
        } else if (normalized === "tumbling") {
            normalized = "tumble";
        }
        return this.getArmorMod(this.props.armor, normalized) +
            this.getArmorMod(this.props.helm, normalized);
    }

    getEdgeModifier(mod) {
        // Return the sum of modifiers from edges for modifier `mod`.
        var edges = [];
        if (this.props.edges) {
            edges = this.props.edges;
        }
        return this.getEffectModifier(mod, edges);
    }

    getEffectModifier(mod, effects) {
        // Return the sum of modifiers from edges for modifier `mod`.
        if (!effects) {
            effects = this.props.effects;
            if (!effects) {
                effects = [];
            }
        }
        var sum = 0;
        for (let eff of effects) {
            sum += parseFloat(eff[mod]);
        }
        return sum;
    }

    getHardMods() {
        return this._hardMods;
    }

    getSoftMods() {
        return this._softMods;
    }
    
    getBaseStats() {
        if (!this._baseStats) {
            this._baseStats = {};
            for (let st of SkillHandler.baseStatNames) {
                this._baseStats[st] = this.props.character['cur_' + st] +
                    this.props.character['base_mod_' + st] +
                    this._hardMods[st];
            }
            this._baseStats.mov = util.roundup((this._baseStats.fit +
                this._baseStats.ref)/2) + this._hardMods.mov;
            this._baseStats.dex = util.roundup((this._baseStats.int +
                this._baseStats.ref)/2) + this._hardMods.dex;
            this._baseStats.imm = util.roundup((this._baseStats.fit +
                this._baseStats.psy)/2) + this._hardMods.mov;

            this._baseStats.stamina = util.roundup(
                (this._baseStats.ref + this._baseStats.wil)/ 4)
                + this.props.character.bought_stamina;
        }

        return this._baseStats;
    }
    
    getEffStats() {
        if (!this._effStats) {
            this._effStats = {};
            var baseStats = this.getBaseStats();
            for (let st of SkillHandler.baseStatNames) {
                this._effStats[st] = baseStats[st] +
                    this._softMods[st];
            }
            // Encumbrance and armor are calculated after soft mods
            // (transient effects, such as spells) and hard mods (edges)
            // in the excel combat sheet.
            var encumbrancePenalty = util.roundup(
                (-10 * this.props.weightCarried) / this._effStats.fit);

            this._effStats.fit += encumbrancePenalty;
            this._effStats.ref += encumbrancePenalty;

            this._effStats.mov = util.roundup((this._effStats.fit +
                this._effStats.ref)/2) + this._hardMods.mov +
                this._softMods.mov;
            this._effStats.dex = util.roundup((this._effStats.int +
                this._effStats.ref)/2) + this._hardMods.dex +
                this._softMods.dex;
            this._effStats.imm = util.roundup((this._baseStats.fit +
                this._baseStats.psy)/2) + this._hardMods.imm +
                this._softMods.imm;
        }
        return this._effStats;
    }
}

SkillHandler.baseStatNames = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos"];
SkillHandler.allStatNames =  SkillHandler.baseStatNames.concat(
    ["mov", "dex", "imm"]);

// SkillHandler.props = {
//     character: React.PropTypes.object.isRequired,
//     edges: React.PropTypes.array,
//     effects: React.PropTypes.array,
//     weightCarried: React.PropTypes.number.isRequired
//};

SkillHandler.defaultProps = {
    weightCarried: 0,
    armor: {},
    helm: {},
    effects: [],
    edges: []
};

export default SkillHandler;