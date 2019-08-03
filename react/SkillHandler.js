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

const util = require('./sheet-util');

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

        for (const st of SkillHandler.allStatNames) {
            this._hardMods[st] = 0;
            this._softMods[st] = 0;
        }

        for (const mod of this.props.edges) {
            for (let st of SkillHandler.allStatNames) {
                this._hardMods[st] += mod[st];
            }
        }

        for (const mod of this.props.effects) {
            for (let st of SkillHandler.allStatNames) {
                this._softMods[st] += mod[st];
            }
        }

        for (const st of SkillHandler.allStatNames) {
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

    getInitiative() {
        return this.getStat('ref') / 10 +
            this.getStat('int') / 20 +
            this.getStat('psy') / 20 +
            SkillHandler.getInitPenaltyFromACPenalty(this.getACPenalty());
    }

    getACPenalty() {
        return util.rounddown(this.props.character.stamina_damage/
            this.getBaseStats().stamina * (-20));
    }

    static getInitPenaltyFromACPenalty(acPenalty) {
        if (acPenalty > 0) {
            return 0;
        }
        return util.rounddown(acPenalty/10);
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
        check += this.getACPenalty();
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
        // Return the sum of modifiers from effects for modifier `mod`.
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

            this._baseStats.baseBody = util.roundup(this._baseStats.fit / 4);
            this._baseStats.body =
                this._baseStats.baseBody + this.edgeLevel("Toughness");
        }

        return this._baseStats;
    }

    getWoundPenalties() {
        if (!this._woundPenalties) {
            var locationDamages = {H: 0, T: 0, RA: 0, LA: 0, RL: 0, LL: 0};
            for (let ww of this.props.wounds) {
                locationDamages[ww.location] += ww.damage - ww.healed;
            }

            var toughness = this.edgeLevel("Toughness");

            for (let loc of ["H", "T", "RA", "RL", "LA", "LL"]) {
                locationDamages[loc] = Math.max(0, locationDamages[loc] - toughness);
            }

            this._woundPenalties = {};

            this._woundPenalties.aa = -10 * locationDamages.H;
            this._woundPenalties.aa += -5 * locationDamages.T;
            for (let loc of ["RA", "LA", "RL", "LL"]) {
                this._woundPenalties.aa +=
                    util.rounddown(locationDamages[loc] / 3) * -5;
            }

            this._woundPenalties.mov = -10 * locationDamages.RL;
            this._woundPenalties.mov += -10 * locationDamages.LL;

            this._woundPenalties.la_fit_ref = -10 * locationDamages.LA;
            this._woundPenalties.ra_fit_ref = -10 * locationDamages.RA;
        }
        return this._woundPenalties;
    }

    getEffStats() {
        if (!this._effStats) {
            this._effStats = {};
            var baseStats = this.getBaseStats();

            var woundPenalties = this.getWoundPenalties();

            for (let st of SkillHandler.baseStatNames) {
                this._effStats[st] = baseStats[st] +
                    this._softMods[st] + woundPenalties.aa;
            }

            // Encumbrance and armor are calculated after soft mods
            // (transient effects, such as spells) and hard mods (edges)
            // in the excel combat sheet.
            if (this._effStats.fit > 0) {
                var encumbrancePenalty = util.roundup(
                    (-10 * this.props.weightCarried) / this._effStats.fit);

                this._effStats.fit += encumbrancePenalty;
                this._effStats.ref += encumbrancePenalty;
            } else {
                // Effective FIT zero or negative, the character cannot move.
                this._effStats.fit = -100;
                this._effStats.ref = -100;
            }

            this._effStats.mov = util.roundup((this._effStats.fit +
                this._effStats.ref)/2) + this._hardMods.mov +
                this._softMods.mov + woundPenalties.mov;
            this._effStats.dex = util.roundup((this._effStats.int +
                this._effStats.ref)/2) + this._hardMods.dex +
                this._softMods.dex;
            this._effStats.imm = util.roundup((this._baseStats.fit +
                this._baseStats.psy)/2) + this._hardMods.imm +
                this._softMods.imm;
        }
        return this._effStats;
    }

    detectionLevel(goodEdge, badEdge) {
        let level = -this.edgeLevel(badEdge);
        if (!level) {
            level = this.edgeLevel(goodEdge);
        }
        return level;
    }

    getTotalModifier(target) {
        return this._hardMods[target] + this._softMods[target];
    }

    dayVisionCheck() {
        let check = this.getEffStats().int;
        check += this.getTotalModifier("vision");
        check -= 5 * this.edgeLevel("Color Blind");
        return {check: check,
            detectionLevel: this.detectionLevel("Acute Vision", "Poor Vision")};
    }

    nightVisionCheck() {
        return {check: this.getEffStats().int + this.getTotalModifier("vision"),
            detectionLevel: util.rounddown(
                this.detectionLevel("Acute Vision", "Poor Vision") / 2),
            darknessDetectionLevel: this.detectionLevel("Night Vision",
                "Night Blindness")};
    }

    surpriseCheck() {
        return this.getEffStats().psy + this.getTotalModifier("surprise");
    }

    smellCheck() {
        return {check: this.getEffStats().int + this.getTotalModifier("smell"),
            detectionLevel: this.detectionLevel("Acute Smell and Taste",
                            "Poor Smell and Taste")};
    }

    hearingCheck() {
        return {check: this.getEffStats().int + this.getTotalModifier("hear"),
            detectionLevel: this.detectionLevel("Acute Hearing", "Poor Hearing")};
    }

    touchCheck() {
        return {check: this.getEffStats().int +
                        util.roundup(this.getSkillMod("climb") / 2),
                detectionLevel: this.edgeLevel("Acute Touch")};
    }
}

SkillHandler.baseStatNames = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos"];
SkillHandler.allStatNames =  SkillHandler.baseStatNames.concat(
    ["mov", "dex", "imm", "vision", "hear", "smell", "surprise"]);

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
    edges: [],
    wounds: []
};

export default SkillHandler;