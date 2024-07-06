/*
 * SkillHandler
 *
 * This is container, created typically in StatBlock, which handles
 * skills, characterskills and edges.
 */

/*
 * props:
 * characterSkills
 * allSkills
 * edges
 *
 * TODO: rename SkillHandler to CheckHandler (or CheckController).
 *
 * TODO: study Redux for handling state in a cleaner fashion.
 */

/** Rules update 2024-06-05 by JW
 *
 * 1.1.1       Balance, Low-G, and High-G maneuver
 * The Balance (MOV) skill is used in a multitude of close-combat situations.
 * With the Balance skill level one or more, you can also walk on a precarious surface. A successful skill check lets you move at MOV/6 along the surface for 1 turn.
 * Characters with a Tumbling skill level of 3 or higher get a +10 bonus to Balance skill checks.
 * 1.1.1.1        High-G maneuver
 * Higher than Earth gravity will have the following effects:
 * ·       AC penalty of -5*(effG-1). Note that this will most often apply in situations of temporary high-G acceleration. DONE
 * ·       Movement rates in all movement modes are reduced proportionally to the gravity. For example, movement of 30 m becomes 15 m in 2G. NOT DONE
 * ·       Carried weight is multiplied with the effective gravity. For example, carried weight of 50 kg becomes 100 kg in 2G. DONE
 * ·       Ranges of missile weapons are reduced proportionally to the gravity. For example, a range of 100 m becomes 50 m in 2G. DONE
 * ·       Falling damage is increased proportional to the gravity.
 * ·       Ranges of conventional firearms are reduced. Use GM judgment. Ranges of firearms with v0 greater than 10 km/s can be considered unaffected.
 * Mastering the High-G maneuver skill allows the PC to negate +5L of the AC penalty. DONE A successful skill check allows the PC to negate +10L of the AC penalty for L turns.
 * 1.1.1.2        Low-G maneuver
 * Lower than Earth gravity will have the following effects:
 * ·       REF penalty of -25*(1-effG). DONE
 * ·       Movement rates in all movement modes are increased proportionally to the gravity, up to maximum of quintupling. For example, movement of 30 m becomes 60 m in 0.5G. However, note the REF penalty that is calculated to MOV. Note also that attempting to move at increased speed requires a Low-G maneuverskill check. If the check fails, the PC falls, or moves uncontrollably at 0G. NOT DONE
 * ·       Carried weight is multiplied with the effective gravity. For example, carried weight of 50 kg becomes 25 kg in 0.5G. DONE
 * ·       Extreme range of missile weapons is increased proportionally to the gravity, up to maximum of quintupling. For example, an Extreme range of 100 m becomes 200 m in 0.5G. Note that throwing to Extreme range suffers a minimum penalty of -60 to hit, -2 TI, -2L/-2D, no FIT bonuses to damage. NOT DONE
 * ·       Falling damage is reduced proportional to the gravity.
 * ·       Felt recoil of conventional firearms is increased in low-G. If effect, there is a -25*(1-effG) to-hit penalty. Firearms with I of 1.0 or less can be considered unaffected. NOT DONE
 * Mastering the Low-G maneuver skill allows the PC to negate +5L of the REF penalty and +5L of the to-hit penalty with firearms. DONE
 */

import * as util from './sheet-util'
import ValueBreakdown from "./ValueBreakdown";

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
                    skillBonusMap[sb.skill] = {bonus: 0
                        // , breakdown: []
                    };
                }
                skillBonusMap[sb.skill].bonus += sb.bonus;
                // skillBonusMap[sb.skill]
            }
        }
        return skillBonusMap;
    }

    /* A base-level skill, i.e., Basic Artillery and the like. */
    isBaseSkill(skillName) {
        const skill = this.state.skillMap[skillName];

        return skill.skill_cost_1 === null;
    }

    getStat(stat) {
        return this.getEffStats()[stat.toLowerCase()].value();
    }

    getInitiative() {
        return this.getStat('ref') / 10 +
            this.getStat('int') / 20 +
            this.getStat('psy') / 20 +
            SkillHandler.getInitPenaltyFromACPenalty(this.getACPenalty().value);
    }

    getACPenalty() {
        let breakdown = []
        let penalty = 0

        /* Extra stamina should not give AC bonus. */
        if (this.props.staminaDamage > 0) {
            penalty = util.rounddown(this.props.staminaDamage /
                this.getBaseStats().stamina * (-20))
            if (penalty > 0) {
                breakdown.push({
                    value: penalty,
                    reason: "Stamina damage"
                })
            }
        }

        if (this.props.gravity > 1) {
            const gravityPenalty = util.roundup(-5 * (this.props.gravity - 1.0))
            penalty += gravityPenalty
            breakdown.push({
                reason: "gravity",
                value: gravityPenalty
            })

            // Low-G maneuver
            const level = this.skillLevel("High-G maneuver");
            if (typeof(level) === "number") {
                const skillOffset = Math.min(level * 5, -gravityPenalty)

                penalty += skillOffset
                if (skillOffset > 0) {
                    breakdown.push({
                        reason: "high-g skill",
                        value: skillOffset
                    })
                }
            }

        }
        return {value: penalty, breakdown: breakdown}
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

    skillCheck(skillName, stat, ignoreMissingSkill) {
        const skill = this.state.skillMap[skillName];

        if (!ignoreMissingSkill) {
            if (!skill || this.isBaseSkill(skillName)) {
                return null;
            }
            if (!stat) {
                stat = skill.stat;
            }
        } else {
            if (!stat) {
                throw "When ignoring missing skill, stat is required"
            }
        }

        const bd = new ValueBreakdown()

        const effStats = this.getEffStats();
        const ability = effStats[stat.toLowerCase()].value();

        const level= this.skillLevel(skillName);

        if (level === "U" && !ignoreMissingSkill) {
            bd.add(Math.round(ability / 4), `1/4*${stat} (U)`)
        } else if (level === "B" && !ignoreMissingSkill) {
            bd.add(Math.round(ability / 2), `1/2*${stat} (B)`)
        } else {
            bd.add(ability, stat)

            const levelBonus = level * 5;
            bd.add(levelBonus, "skill level")
        }

        if (skillName in this.state.skillBonusMap) {
            bd.add(this.state.skillBonusMap[skillName].bonus, "skill bonuses")
        }

        bd.add(this.getSkillMod(skillName), "skill mods")
        bd.add(this.getACPenalty().value, "AC penalty")

        return bd
    }

    /* U is quarter-skill, i.e., using a pistol even without Basic
       Firearms.  B is half-skill, i.e., the character has top-level skill,
       but not the skill required.  Otherwise, if the character has the
        skill, return the level of the skill. */
    skillLevel(skillName) {
        const cs = this.state.characterSkillMap[skillName];
        const skill = this.state.skillMap[skillName];

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

    edgeLevel(edgeName, givenMap) {
        if (typeof(givenMap) === "undefined") {
            givenMap = this.state.edgeMap;
        }
        if (edgeName in givenMap) {
            return givenMap[edgeName].level;
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
        const bd = this.getBaseMovementSpeed()
        bd.divide(5, "sneaking")
        bd.multiply(this.getGravityMovementMultiplier(), "gravity")
        return bd
    }

    getBaseMovementSpeed() {
        const bd = new ValueBreakdown();
        bd.addBreakdown(this.getEffStats().mov)
        if (bd.value() <= 0) {
            bd.set(0, "Base mov <= 0")
        }
        return bd;
    }

    getGravityMovementMultiplier() {
        return Math.min(4, 1/this.props.gravity)
    }

    runningSpeed() {
        const bd = this.getBaseMovementSpeed();

        const edgeRate = this.getEdgeModifier('run_multiplier') || 1.0;
        const effRate = this.getEffectModifier('run_multiplier') || 1.0;
        bd.multiply(edgeRate, "edges")
        bd.multiply(effRate, "effects")

        bd.multiply(this.getGravityMovementMultiplier(), "gravity")

        return bd;
    }

    sprintingSpeed() {
        const bd = this.runningSpeed()
        bd.multiply(1.5, "sprint")
        return bd;
    }

    climbingSpeed() {
        const level = this.skillLevel('Climbing');
        const bd = this.getBaseMovementSpeed();

        bd.divide(30, "climbing")
        if (typeof(level) !== 'number') {
            bd.divide(2, "unskilled")
        } else {
            bd.add(level, "skill level")
        }

        const edgeRate = this.getEdgeModifier('climb_multiplier') || 1.0;
        const effRate = this.getEffectModifier('climb_multiplier') || 1.0;
        bd.multiply(edgeRate, "edges")
        bd.multiply(effRate, "effects")

        bd.multiply(this.getGravityMovementMultiplier(), "gravity")

        return bd;
    }
    
    swimmingSpeed() {
        const level = this.skillLevel('Swimming');
        const bd = this.getBaseMovementSpeed();
        bd.divide(5, "swimming")

        if (typeof(level) !== 'number') {
            bd.divide(2, "unskilled")
        } else {
            bd.add(level * 5, "skill level")
        }

        const edgeRate = this.getEdgeModifier('swim_multiplier') || 1.0;
        const effRate = this.getEffectModifier('swim_multiplier') || 1.0;
        bd.multiply(edgeRate, "edges")
        bd.multiply(effRate, "effects")

        bd.multiply(this.getGravityMovementMultiplier(), "gravity")

        return bd;
    }

    jumpingDistance() {
        const level = this.skillLevel('Jumping');
        const bd = this.getBaseMovementSpeed();
        bd.divide(12, "jumping")
        if (typeof(level) !== 'number') {
            bd.divide(2, "unskilled")
        } else {
            bd.add(level * 0.75, "skill level")
        }

        const edgeRate = this.getEdgeModifier('run_multiplier') || 1.0;
        const effRate = this.getEffectModifier('run_multiplier') || 1.0;
        bd.multiply(edgeRate, "edges")
        bd.multiply(effRate, "effects")

        bd.multiply(this.getGravityMovementMultiplier(), "gravity")

        return bd;
    }

    jumpingHeight() {
        const bd = this.jumpingDistance()
        bd.divide(3, "jumping up")
        return bd;
    }
    
    
    flyingSpeed() {
        let canFly = false;
        const bd = this.getBaseMovementSpeed();
        const edgeRate = this.getEdgeModifier('fly_multiplier');
        const effRate = this.getEffectModifier('fly_multiplier');
        if (edgeRate) {
            bd.multiply(edgeRate, "edges")
            canFly = true;
        }
        if (effRate) {
            bd.multiply(effRate, "effects")
            canFly = true;
        }

        bd.multiply(this.getGravityMovementMultiplier(), "gravity")

        if (!canFly) bd.set(0, "cannot fly")

        return bd
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
        let normalized = skill.toLowerCase();
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
        return this.getEffectModifier(mod, this.props.edges ?? []);
    }

    getEffectModifier(mod, effects) {
        // Return the sum of modifiers from effects for modifier `mod`.
        if (!effects) {
            effects = this.props.effects;
            if (!effects) {
                effects = [];
            }
        }
        let sum = 0;
        for (let eff of effects) {
            sum += parseFloat(eff[mod]);
        }
        return sum;
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
                this._baseStats.baseBody + 2 * this.edgeLevel("Toughness");

            this._baseStats.mana = util.roundup(
                (this._baseStats.psy + this._baseStats.wil)/ 4)
                + this.props.character.bought_mana;
        }

        return this._baseStats;
    }

    getDamageThreshold(givenLoc) {
        if (!this._thresholds) {
            const divider = {H: 10, T: 5, RA: 15, RL: 10, LA: 15, LL: 10}
            this._thresholds = {}
            for (const loc of ["H", "T", "RA", "RL", "LA", "LL"]) {
                this._thresholds[loc] = util.roundup(this.getBaseStats().fit / divider[loc]) + this.edgeLevel("Toughness")
            }
        }
        return this._thresholds[givenLoc]
    }

    getStatus() {
        const woundPenalties = this.getWoundPenalties()
        const acPenalty = this.getACPenalty().value
        const painResistance = this.getEdgeModifier("pain_resistance") > 0
        if (woundPenalties.aa > -10 && acPenalty > -10) {
            return SkillHandler.STATUS_OK
        } else if (woundPenalties.aa < -20 || (!painResistance && acPenalty <= -20)) {
            /*
             * Pain resistance
             *
             * TODO: -20 AC not enough for CRITICAL with this edge
             * TODO: also the AA calculation should take the edge into account
             *
             * Never shocked due to wounding. Not subject to AA penalties
             * from leg and arm wounds. Automatically continue combat at
             * zero Stamina (at -20 AC, -2 I).
             *
             */
            return SkillHandler.STATUS_CRITICAL
        } else {
            return SkillHandler.STATUS_WOUNDED
        }
    }
    getWoundPenalties() {
        if (!this._woundPenalties) {
            // TODO: Use ValueBreakdown
            this._woundPenalties = {};

            this._woundPenalties.bodyDamage = 0
            this._woundPenalties.staminaDamage = 0

            let locationDamages = {H: 0, T: 0, RA: 0, LA: 0, RL: 0, LL: 0};
            for (const ww of this.props.wounds) {
                const damage = ww.damage - ww.healed;
                locationDamages[ww.location] += damage;
            }

            // Cap body damage at threshold, rest is stamina damage.
            for (const loc of ["H", "T", "RA", "RL", "LA", "LL"]) {
                const threshold = this.getDamageThreshold(loc)
                if (locationDamages[loc] > threshold) {
                    // Damage exceeding twice the threshold is ignored.
                    const damage = Math.min(threshold,
                        locationDamages[loc] - threshold);

                    this._woundPenalties.staminaDamage += damage
                    locationDamages[loc] = threshold
                }
                this._woundPenalties.bodyDamage += locationDamages[loc]
            }

            const toughness = this.edgeLevel("Toughness");

            for (let loc of ["H", "T", "RA", "RL", "LA", "LL"]) {
                locationDamages[loc] = Math.max(0, locationDamages[loc] - toughness);
            }

            const maxAAPenaltyPerLoc = {H: -120, T: -100, RA: -10, LA: -10, RL: -10, LL: -10}
            this._woundPenalties.aa = Math.max(-10 * locationDamages.H, maxAAPenaltyPerLoc.H);
            this._woundPenalties.aa += Math.max(-5 * locationDamages.T, maxAAPenaltyPerLoc.T);
            if (this.getEdgeModifier('pain_resistance') <= 0) {
                for (let loc of ["RA", "LA", "RL", "LL"]) {
                    this._woundPenalties.aa +=
                        Math.max(util.rounddown(locationDamages[loc] / 3) * -5, maxAAPenaltyPerLoc[loc]);
                }
            }
            this._woundPenalties.mov = Math.max(-10 * locationDamages.RL, -75);
            this._woundPenalties.mov += Math.max(-10 * locationDamages.LL, -75);

            this._woundPenalties.la_fit_ref = -10 * locationDamages.LA;
            this._woundPenalties.ra_fit_ref = -10 * locationDamages.RA;

        }
        return this._woundPenalties;
    }

    getCurrentBody() {
        return this.getBaseStats().body - this.getWoundPenalties().bodyDamage
    }

    getStaminaDamage() {
        return this.props.staminaDamage + this.getWoundPenalties().staminaDamage
    }

    getCurrentStamina() {
        return this.getBaseStats().stamina - this.getStaminaDamage()
    }

    getCurrentMana() {
        return this.getBaseStats().mana
    }

    getEffStats() {
        function calculateEncumbrancePenalty(weightCarried, fit) {
            let encumbrancePenalty = util.roundup(
                (-10 * weightCarried) / fit);
            return encumbrancePenalty;
        }

        if (!this._effStatsV2) {
            this._effStats = {};
            this._effStatsV2 = {};
            this._effStats.breakdown = {}
            this._effStats.breakdownV2 = {}

            const baseStats = this.getBaseStats();

            const woundPenalties = this.getWoundPenalties();

            for (let st of SkillHandler.baseStatNames) {
                const bd = new ValueBreakdown()
                this._effStatsV2[st] = bd

                bd.add(baseStats[st], st.toUpperCase())

                // TODO: handle armor mods separately
                /*
                 * The Space Suit / Power Armor skill enhancement is required
                 * to use a power armor effectively. A successful skill
                 * check (INT) is required to use a previously unfamiliar
                 * type of suit the first time. When using a power armor,
                 * exoskeleton, or a powered space suit, each level of
                 * Power Armor skill increases the FIT bonus by +2 and
                 * reduces the REF penalty by +3.
                 */
                const softMod = this._softMods[st];
                bd.add(softMod, "soft mods")

                bd.add(woundPenalties.aa, "wound penalties")
            }

            // Encumbrance and armor are calculated after soft mods
            // (transient effects, such as spells) and hard mods (edges)
            // in the Excel combat sheet.
            if (this._effStatsV2.fit.value() > 0) {
                const encumbrancePenalty = calculateEncumbrancePenalty(this.props.weightCarried, this._effStatsV2.fit.value());
                if (encumbrancePenalty < 0) {
                    this.addEncumbrancePenalty(encumbrancePenalty);
                }

                if (this.props.gravity < 1.0) {
                    const gravityPenalty = util.roundup(-25 * (1.0 - this.props.gravity))

                    this._effStatsV2.ref.add(gravityPenalty, "gravity")

                    // Low-G maneuver
                    const level = this.skillLevel("Low-G maneuver");
                    if (typeof(level) === "number") {
                        const skillOffset = Math.min(level * 5, -gravityPenalty)
                        this._effStatsV2.ref.add(skillOffset, "low-g skill")
                    }
                }
            } else {
                // Effective FIT zero or negative, the character cannot move.
                this._effStats.fit = -100;
                this._effStats.ref = -100;
                this._effStatsV2.ref.set(-100, "Eff-FIT negative")
                this._effStatsV2.fit.set(-100, "Eff-FIT negative")
            }

            const addStatMods = (stat) => {
                this._effStatsV2[stat].add(this._hardMods[stat], "hard mods")
                this._effStatsV2[stat].add(this._softMods[stat], "soft mods")
            }

            this._effStatsV2.mov = new ValueBreakdown()

            const baseMov = util.roundup((this._effStatsV2.fit.value() +
                this._effStatsV2.ref.value()) / 2)
            this._effStatsV2.mov.add(baseMov, "(FIT + REF) / 2")

            addStatMods('mov')
            this._effStatsV2.mov.add(woundPenalties.mov, "wound penalties")

            this._effStatsV2.dex = new ValueBreakdown()
            const baseDex = util.roundup((this._effStatsV2.int.value() +
                this._effStatsV2.ref.value()) / 2);
            this._effStatsV2.dex.add(baseDex, "(INT + REF) / 2")
            addStatMods('dex')

            this._effStatsV2.imm = new ValueBreakdown()

            const baseImm = util.roundup((this._baseStats.fit +
                this._baseStats.psy)/2);
            this._effStatsV2.imm.add(baseImm, "(FIT + PSY) / 2")
            addStatMods('imm')

            for (const st of ["mov", "dex", "imm", ...SkillHandler.baseStatNames]) {
                this._effStats[st] = this._effStatsV2[st].value()
                this._effStats.breakdown[st] = this._effStatsV2[st].breakdown()
            }
        }
        return this._effStatsV2;
    }

    addEncumbrancePenalty(encumbrancePenalty, tag = "encumbrance") {
        this._effStatsV2.fit.add(encumbrancePenalty, tag)
        this._effStatsV2.ref.add(encumbrancePenalty, tag)
    }

    detectionLevel(goodEdge, badEdge, givenMap) {
        let level = -this.edgeLevel(badEdge, givenMap);
        if (!level) {
            level = this.edgeLevel(goodEdge, givenMap);
        }
        return level;
    }

    getTotalModifier(target) {
        return this._hardMods[target] + this._softMods[target];
    }

    // TODO: there should be a visionCheck() call which incorporates day and
    // night vision checks
    nightVisionCheck(range, detectionLevel, givenPerks) {
        const ranges = [2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000,
            10000];
        let perks = {};
        if (typeof(givenPerks) !== "undefined") {
            perks = SkillHandler.getItemMap(givenPerks, (item) => { return item.edge; });
        }

        const baseCheck = this.nightVisionBaseCheck(perks);
        const darknessDL = Math.min(0,
            baseCheck.darknessDetectionLevel + detectionLevel);

        const maxRangeIndex = baseCheck.detectionLevel + darknessDL +
            SkillHandler.BASE_VISION_RANGE;

        let index = 1; // Max bonus for under two meters = +80
        for (let curRange of ranges) {
            if (range <= curRange) {
                break;
            }
            index++;
        }
        // Too far, cannot see.
        if (index > maxRangeIndex) {
            return null;
        }
        // See SenseTable for the calculation of the senses. Basically,
        // the last of the checks is the basic check, with each range
        // increment below getting a +10 bump; for night detection levels, the
        // total detection level is also added as a penalty (* 10).
        return baseCheck.check + (maxRangeIndex - index) * 10 +
            darknessDL * 10;
    }

    dayVisionBaseCheck() {
        let check = this.skillCheck("Search", "INT", true)?.value();
        check += this.getTotalModifier("vision");
        check -= 5 * this.edgeLevel("Color Blind");
        return {check: check,
            detectionLevel: this.detectionLevel("Acute Vision", "Poor Vision")};
    }

    nightVisionBaseCheck(givenPerks) {
        const check = this.skillCheck("Search", "INT", true)?.value();
        let acuteVision = this.detectionLevel("Acute Vision", "Poor Vision");
        let nightVision = this.detectionLevel("Night Vision",
            "Night Blindness");
        if (typeof(givenPerks) !== "undefined") {
            acuteVision += this.detectionLevel("Acute Vision", "Poor Vision", givenPerks);
            nightVision += this.detectionLevel("Night Vision", "Night Blindness", givenPerks);
        }
        return {check: check + this.getTotalModifier("vision"),
            detectionLevel: util.rounddown(acuteVision / 2),
            darknessDetectionLevel: nightVision};
    }

    surpriseCheck() {
        const surpriseSkillCheck = this.skillCheck("Tailing / Shadowing", "PSY", true)?.value();
        return surpriseSkillCheck + this.getTotalModifier("surprise");
    }

    smellCheck() {
        const smellCheck = this.skillCheck("Search", "INT", true)?.value();
        return {check: smellCheck + this.getTotalModifier("smell"),
            detectionLevel: this.detectionLevel("Acute Smell and Taste",
                            "Poor Smell and Taste")};
    }

    hearingCheck() {
        const hearingCheck = this.skillCheck("Search", "INT", true)?.value();
        return {check: hearingCheck + this.getTotalModifier("hear"),
            detectionLevel: this.detectionLevel("Acute Hearing", "Poor Hearing")};
    }

    touchCheck() {
        const touchCheck = this.skillCheck("Search", "INT", true)?.value();
        return {check: touchCheck +
                        util.roundup(this.getSkillMod("climb") / 2),
                detectionLevel: this.edgeLevel("Acute Touch")};
    }
}

SkillHandler.baseStatNames = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos"];
SkillHandler.allStatNames =  SkillHandler.baseStatNames.concat(
    ["mov", "dex", "imm", "vision", "hear", "smell", "surprise"]);

SkillHandler.defaultProps = {
    weightCarried: 0,
    staminaDamage: 0,
    armor: {},
    helm: {},
    effects: [],
    edges: [],
    wounds: [],
    gravity: 1.0
};

SkillHandler.BASE_VISION_RANGE = 9;
SkillHandler.BASE_HEARING_RANGE = 6;
SkillHandler.BASE_SMELL_RANGE  = 3;

SkillHandler.STATUS_OK = 1
SkillHandler.STATUS_WOUNDED = 5
SkillHandler.STATUS_CRITICAL = 9

export default SkillHandler;