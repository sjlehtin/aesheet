/*
 * SkillHandler
 *
 * This is container, created typically in StatBlock, which handles
 * skills, characterskills and edges.
 */

/*
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
 * ·       Movement rates in all movement modes are reduced proportionally to the gravity. For example, movement of 30 m becomes 15 m in 2G. DONE
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

import * as util from "./sheet-util";
import { getCounteredPenalty } from "./sheet-util";
import ValueBreakdown from "./ValueBreakdown";
import {
  AllAttributeValues,
  Armor,
  ArmorLocation,
  ArmorStatModifierType,
  Attribute,
  Character,
  CharacterAttribute,
  CharacterSkill,
  DerivedAttribute,
  EdgeLevel,
  EdgeModifierType,
  Effect,
  SenseAttribute,
  Skill,
  SkillAttribute,
  StatModifierType,
} from "./api";

const AllAttributes = {
  ...Attribute,
  ...DerivedAttribute,
  ...SkillAttribute,
  ...SenseAttribute,
};

export enum ArmorPieceAttribute {
  fit = Attribute.Fit,
  ref = Attribute.Ref,
  surprise = SenseAttribute.Surprise,
  climb = SkillAttribute.Climb,
  stealth = SkillAttribute.Stealth,
  conceal = SkillAttribute.Conceal,
  suspendedWeight = "suspendedWeight",
}

interface WoundPenalties {
  bodyDamage: number;
  staminaDamage: number;
  locationsDamages: { [loc in ArmorLocation]: number };
  aa: number;
  mov: number;
  la_fit_ref: number;
  ra_fit_ref: number;
}

type SkillAttributeTypes = Extract<
  AllAttributeValues,
  | SkillAttribute.Stealth
  | SkillAttribute.Conceal
  | SkillAttribute.Climb
  | SkillAttribute.Swim
>;

const SkillsToMod: SkillAttributeTypes[] = [
  SkillAttribute.Stealth,
  SkillAttribute.Conceal,
  SkillAttribute.Climb,
  SkillAttribute.Swim,
];

interface SkillHandlerCharacterSkill extends CharacterSkill {
  _children: SkillHandlerCharacterSkill[];
  _parent: SkillHandlerCharacterSkill | undefined;
  _missingRequired: string[];
  _unknownSkill: boolean;
  indent: number;
}

interface EdgeMod extends Record<AllAttributeValues, ValueBreakdown> {}

interface ArmorMod extends EdgeMod {
  suspendedWeight: number;
}

class SkillHandler {
  static BASE_VISION_RANGE = 9;
  static BASE_HEARING_RANGE = 6;
  static BASE_SMELL_RANGE = 3;

  static STATUS_OK = 1;
  static STATUS_WOUNDED = 5;
  static STATUS_CRITICAL = 9;

  _thresholds: Partial<{ [key in ArmorLocation]: number }> | undefined;
  _baseStats: { [key: string]: number } | undefined;
  _softMods: Record<AllAttributeValues, number>;

  #edgeMods: EdgeMod | undefined;
  #armorMods: ArmorMod | undefined;

  _effStatsV2: Record<AllAttributeValues, ValueBreakdown> | undefined;
  _woundPenalties: WoundPenalties | undefined;

  character;
  staminaDamage;
  weightCarried;
  characterSkills;
  edges;
  allSkills;
  gravity;
  effects;
  armor;
  helm;
  wounds;
  characterSkillMap;
  skillMap;
  skillBonusMap;
  edgeMap;
  skillList;
  acMod;

  constructor({
    character,
    weightCarried,
    characterSkills = [],
    allSkills = [],
    staminaDamage = 0,
    armor = {} as Armor,
    helm = {} as Armor,
    effects = [],
    edges = [],
    wounds = [],
    gravity = 1.0,
  }: {
    character: Character;
    weightCarried: ValueBreakdown;
    characterSkills: CharacterSkill[];
    allSkills: Skill[];
    staminaDamage: number;
    armor: Armor;
    helm: Armor;
    effects: Effect[];
    edges: EdgeLevel[];
    wounds: any;
    gravity: number;
  }) {
    this.character = character;
    this.staminaDamage = staminaDamage;
    this.weightCarried = weightCarried;
    // Store internal state in a new copy of the objects to avoid reusing it on re-render.
    this.characterSkills = characterSkills.map((cs) => {
      return {
        ...cs,
        _children: [],
        _parent: undefined,
        _missingRequired: [],
        _unknownSkill: false,
        indent: 0,
      } as SkillHandlerCharacterSkill;
    });
    this.edges = edges.map((edge: EdgeLevel) => {
      return {
        ...edge,
      };
    });
    this.allSkills = allSkills;
    this.gravity = gravity;
    this.effects = effects;
    this.armor = armor;
    this.helm = helm;
    this.wounds = wounds;
    this.acMod = new ValueBreakdown();

    this.edgeMap = SkillHandler.getItemMap(this.edges, (item) => {
      return item.edge.name;
    }) as { [key: string]: EdgeLevel };

    this.skillBonusMap = this.getSkillBonusMap();
    this.characterSkillMap = SkillHandler.getItemMap(
      this.characterSkills,
      (item) => {
        return item.skill__name;
      },
    ) as { [key: string]: SkillHandlerCharacterSkill };
    this.skillMap = SkillHandler.getItemMap(this.allSkills) as {
      [key: string]: Skill;
    };

    this.skillList = this.createSkillList();

    const softMods: Partial<Record<AllAttributeValues, number>> = {};

    for (const st of Object.values(AllAttributes) as AllAttributeValues[]) {
      softMods[st] = 0;

      for (const mod of this.effects) {
        softMods[st] += mod[st];
      }
      softMods[st] += (this.getArmorStatMod(st) as ValueBreakdown).value();
    }

    this._softMods = softMods as Record<AllAttributeValues, number>;

    for (const edge of this.edges) {
      if (edge.all_checks_mod !== 0) {
        this.acMod.add(
          edge.all_checks_mod,
          `AC mod from ${edge.edge.name} ${edge.level}`,
        );
      }
    }

    this._baseStats = undefined;
  }

  // TODO: Should be statmodifier
  getEdgeStatMod(stat: AllAttributeValues) {
    if (!this.#edgeMods) {
      const edgeMods: EdgeMod = {
        fit: new ValueBreakdown(),
        ref: new ValueBreakdown(),
        lrn: new ValueBreakdown(),
        int: new ValueBreakdown(),
        psy: new ValueBreakdown(),
        wil: new ValueBreakdown(),
        cha: new ValueBreakdown(),
        pos: new ValueBreakdown(),
        mov: new ValueBreakdown(),
        dex: new ValueBreakdown(),
        imm: new ValueBreakdown(),
        stamina: new ValueBreakdown(),
        mana: new ValueBreakdown(),
        body: new ValueBreakdown(),
        climb: new ValueBreakdown(),
        stealth: new ValueBreakdown(),
        conceal: new ValueBreakdown(),
        swim: new ValueBreakdown(),
        vision: new ValueBreakdown(),
        hear: new ValueBreakdown(),
        smell: new ValueBreakdown(),
        surprise: new ValueBreakdown(),
      };

      for (const mod of this.edges) {
        for (const st of Object.values(AllAttributes) as AllAttributeValues[]) {
          edgeMods[st].add(mod[st], mod.edge.name);
        }
      }
      this.#edgeMods = edgeMods;
    }
    return this.#edgeMods[stat];
  }

  getSkillBenefit(field: "powered_ref_counter" | "powered_fit_mod") {
    const bd = new ValueBreakdown();
    for (let cs of this.characterSkills) {
      const skill = this.skillMap[cs.skill__name] ?? {};
      bd.add(skill[field] * cs.level, cs.skill__name);
    }
    return bd;
  }

  getArmorStatMod(stat: AllAttributeValues | ArmorPieceAttribute) {
    if (!this.#armorMods) {
      let armorMods: ArmorMod = {
        fit: new ValueBreakdown(),
        ref: new ValueBreakdown(),
        lrn: new ValueBreakdown(),
        int: new ValueBreakdown(),
        psy: new ValueBreakdown(),
        wil: new ValueBreakdown(),
        cha: new ValueBreakdown(),
        pos: new ValueBreakdown(),
        mov: new ValueBreakdown(),
        dex: new ValueBreakdown(),
        imm: new ValueBreakdown(),
        stamina: new ValueBreakdown(),
        mana: new ValueBreakdown(),
        body: new ValueBreakdown(),
        climb: new ValueBreakdown(),
        stealth: new ValueBreakdown(),
        conceal: new ValueBreakdown(),
        swim: new ValueBreakdown(),
        vision: new ValueBreakdown(),
        hear: new ValueBreakdown(),
        smell: new ValueBreakdown(),
        surprise: new ValueBreakdown(),
        suspendedWeight: 0,
      };
      for (const st of Object.values(AllAttributes) as AllAttributeValues[]) {
        const helmMod = this.getArmorPartMod(this.helm, st);
        armorMods[st].add(helmMod, "helm");
        const armorMod = this.getArmorPartMod(this.armor, st);
        armorMods[st].add(armorMod, "armor");
      }

      if (this.armor.base?.is_powered) {
        /*
         * The Space Suit / Power Armor skill enhancement is required
         * to use a power armor effectively. A successful skill
         * check (INT) is required to use a previously unfamiliar
         * type of suit the first time. When using a power armor,
         * exoskeleton, or a powered space suit, each level of
         * Power Armor skill increases the FIT bonus by +2 and
         * reduces the REF penalty by +3.
         */
        armorMods.ref.add(
          getCounteredPenalty(
            armorMods.ref.value(),
            this.getSkillBenefit("powered_ref_counter").value(),
          ),
          "skill benefit",
        );
        armorMods.fit.add(
          this.getSkillBenefit("powered_fit_mod").value(),
          "skill benefit",
        );
        armorMods.suspendedWeight = armorMods.fit.value();
      } else {
        armorMods.suspendedWeight = 0;
      }
      this.#armorMods = armorMods as ArmorMod;
    }
    return this.#armorMods[stat];
  }

  getCarriedWeight() {
    const bd = new ValueBreakdown();
    if (this.weightCarried) bd.addBreakdown(this.weightCarried);
    bd.add(
      -Math.min(
        bd.value(),
        this.getArmorStatMod(ArmorPieceAttribute.suspendedWeight) as number,
      ),
      "power armor suspension",
    );
    bd.multiply(this.gravity, "from gravity");
    return bd;
  }

  static getItemMap<T>(
    list: T[] | undefined,
    accessor: (item: T) => string = (item: any) => {
      return item.name;
    },
  ): Record<string, T> {
    if (!list) {
      return {};
    }
    const newMap: Record<string, T> = {};
    for (let item of list) {
      newMap[accessor(item)] = item;
    }
    return newMap;
  }

  getSkillBonusMap() {
    if (!this.edges) {
      return {};
    }

    const skillBonusMap: Record<string, { bonus: number }> = {};

    for (let edge of this.edges) {
      for (let sb of edge.edge_skill_bonuses) {
        if (!(sb.skill__name in skillBonusMap)) {
          skillBonusMap[sb.skill__name] = {
            bonus: 0,
          };
        }
        skillBonusMap[sb.skill__name].bonus += sb.bonus;
      }
    }
    return skillBonusMap;
  }

  /* A base-level skill, i.e., Basic Artillery and the like. */
  isBaseSkill(skillName: string) {
    const skill = this.skillMap[skillName];

    return skill.skill_cost_1 === null;
  }

  getStat(stat: Attribute) {
    return this.getEffStats()[stat].value();
  }

  getEdgeSkillPoints() {
    let sum = 0;
    for (let edge of this.getEdgeList()) {
      sum += edge.extra_skill_points;
    }
    return sum;
  }

  getInitialSkillPoints() {
    const char = this.character;
    return (
      util.roundup(char.start_lrn / 3) +
      util.roundup(char.start_int / 5) +
      util.roundup(char.start_psy / 10)
    );
  }

  getEarnedSkillPoints() {
    return this.character.gained_sp;
  }

  getInitiative() {
    return (
      this.getStat(Attribute.Ref) / 10 +
      this.getStat(Attribute.Int) / 20 +
      this.getStat(Attribute.Psy) / 20 +
      SkillHandler.getInitPenaltyFromACPenalty(this.getACPenalty().value)
    );
  }

  // TODO: return ValueBreakdown
  getACPenalty() {
    let breakdown = [];
    let penalty = 0;

    /* Extra stamina should not give AC bonus. */
    if (this.staminaDamage > 0) {
      penalty = util.rounddown(
        (this.staminaDamage / this.getBaseStats().stamina) * -20,
      );
      if (penalty > 0) {
        breakdown.push({
          value: penalty,
          reason: "Stamina damage",
        });
      }
    }

    if (this.gravity > 1) {
      const gravityPenalty = util.roundup(-5 * (this.gravity - 1.0));
      penalty += gravityPenalty;
      breakdown.push({
        reason: "gravity",
        value: gravityPenalty,
      });

      // Low-G maneuver
      const level = this.skillLevel("High-G maneuver");
      if (typeof level === "number") {
        const skillOffset = Math.min(level * 5, -gravityPenalty);

        penalty += skillOffset;
        if (skillOffset > 0) {
          breakdown.push({
            reason: "high-g skill",
            value: skillOffset,
          });
        }
      }
    }

    /*
     * TODO: Tiring
     *
     * A character may normally run for FIT minutes, fight for FIT turns,
     * or sprint for FIT/10 turns, after which time she will suffer a
     * –10 AC penalty (see Section 5.1). Wearing armor will decrease
     * these times.
     * The AC penalty accumulates as shown in the table below. The
     * formula tells the number of turns after which one point of penalty
     * is taken. The number in parentheses indicates the time at FIT 45
     * where the penalty reaches –10 AC. The times are halved in adverse
     * environment (e.g. very hot or low pressure).
     *
     * Duration
     * Armor  | Running etc.*         | Fighting            | Sprinting
     * None   | FIT/10 min (45)       | FIT/10 t (45)       | FIT/100 t (5)
     * Light  | (FIT/10 – 1) min (35) | (FIT/10 – 1) t (35) | (FIT/100 – 0,1) t (4)
     * Medium | (FIT/10 – 2) min (25) | (FIT/10 – 2) t (25) | (FIT/100 – 0,2) t (3)
     * Heavy  | (FIT/10 – 3) min (15) | (FIT/10 – 3) t (15) | (FIT/100 – 0,3) t (2)
     *
     * *) Includes (non-combat) spell casting, heavy construction work,
     * and so on.
     *
     * After the penalty reaches –10 (and each full 10 points
     * thereafter), the PC suffers 1d6 non-lethal damage and must make
     * an endurance WIL check (modified by the Endurance skill). If the
     * check is successful, the PC can continue the activity. If the
     * check is failed, the PC must stop running or sprinting. If forced,
     * she may continue to fight, but may not move more than MOV/5 m per
     * turn (see below), and will suffer one stamina damage each turn.
     * The AC penalty due to tiring will return at the rate of 6 points
     * per hour of rest or 3 points per hour of light activity. Light
     * activity means that the PC can walk at the exhausted rate
     * (MOV/5 m per turn) but cannot run, fight, or sprint. If the PC
     * uses the exhausted rate for continuous overland movement,
     * AC penalty is not returned.
     *
     * The lost stamina (if any) will heal normally, assuming rest and
     * nourishment. See Section 5.6.1.
     */
    return { value: penalty, breakdown: breakdown };
  }

  static getInitPenaltyFromACPenalty(acPenalty: number) {
    if (acPenalty > 0) {
      return 0;
    }
    return util.rounddown(acPenalty / 10);
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

  skillCheck(
    skillName: string,
    stat: Attribute | DerivedAttribute | undefined = undefined,
    ignoreMissingSkill = false,
  ) {
    const skill = this.skillMap[skillName];

    if (!ignoreMissingSkill) {
      if (!skill || this.isBaseSkill(skillName)) {
        return null;
      }
      if (!stat) {
        stat = skill.stat;
      }
    } else {
      if (!stat) {
        throw "When ignoring missing skill, stat is required";
      }
    }

    const bd = new ValueBreakdown();

    const effStats = this.getEffStats();
    const ability = effStats[stat.toLowerCase() as AllAttributeValues].value();

    const level = this.skillLevelExt(skillName) ?? 0;

    if (level === "U" && !ignoreMissingSkill) {
      bd.add(Math.round(ability / 4), `1/4*${stat} (U)`);
    } else if (level === "B" && !ignoreMissingSkill) {
      bd.add(Math.round(ability / 2), `1/2*${stat} (B)`);
    } else {
      bd.add(ability, stat);

      const levelBonus = (level as number) * 5;
      bd.add(levelBonus, "skill level");
    }

    if (skillName in this.skillBonusMap) {
      bd.add(this.skillBonusMap[skillName].bonus, "skill bonuses");
    }

    if (skill) bd.addBreakdown(this.getSkillMod(skill));

    bd.addBreakdown(this.acMod);
    bd.add(this.getACPenalty().value, "AC penalty");

    return bd;
  }

  /* U is quarter-skill, i.e., using a pistol even without Basic
             Firearms.  B is half-skill, i.e., the character has top-level skill,
             but not the skill required.  Otherwise, if the character has the
              skill, return the level of the skill. */
  skillLevelExt(skillName: string) {
    const cs = this.characterSkillMap[skillName];
    const skill = this.skillMap[skillName];

    if (!skill) {
      return null;
    }

    if (!cs) {
      if (skill.required_skills.length > 0) {
        for (let reqd of skill.required_skills) {
          // TODO: should use id as key
          if (!(reqd.name in this.characterSkillMap)) {
            return "U";
          }
        }
      }
      if (skill.skill_cost_0 > 0) {
        return "B";
      } else {
        return 0;
      }
    } else {
      return cs.level;
    }
  }

  skillLevel(skillName: string) {
    const level = this.skillLevelExt(skillName);
    if (typeof level === "number") {
      return level;
    } else {
      return 0;
    }
  }

  edgeLevel(edgeName: string, givenMap?: Record<string, EdgeLevel>) {
    if (givenMap === undefined) {
      givenMap = this.edgeMap;
    }
    if (edgeName in givenMap) {
      return givenMap[edgeName].level;
    } else {
      return 0;
    }
  }

  hasSkill(skillName: string) {
    return skillName in this.characterSkillMap;
  }

  getEdgeList() {
    return this.edges;
  }

  getSkillList() {
    return [...this.skillList];
  }

  getCharacterSkillMap() {
    return this.characterSkillMap;
  }

  getSkillMap() {
    return this.skillMap;
  }

  createSkillList() {
    const csMap = this.characterSkillMap;
    const skillMap = this.skillMap;

    const addChild = function (
      parent: SkillHandlerCharacterSkill,
      child: SkillHandlerCharacterSkill,
    ) {
      parent._children.push(child);
    };

    const root = [];
    for (const cs of this.characterSkills) {
      const skill = skillMap[cs.skill__name];
      if (!skill) {
        cs._unknownSkill = true;
        root.push(cs);
      } else {
        if (skill.required_skills.length > 0) {
          const parent = skill.required_skills[0].name;
          for (let sk of skill.required_skills) {
            if (!(sk.name in csMap)) {
              cs._missingRequired.push(sk.name);
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

    const finalList: SkillHandlerCharacterSkill[] = [];
    const compare = function (a: CharacterSkill, b: CharacterSkill) {
      return (
        +(a.skill__name > b.skill__name) ||
        +(a.skill__name === b.skill__name) - 1
      );
    };
    const depthFirst = function (
      cs: SkillHandlerCharacterSkill,
      indent: number,
    ) {
      cs.indent = indent;
      finalList.push(cs);
      for (let child of cs._children.sort(compare)) {
        depthFirst(child, indent + 1);
      }
    };
    for (let cs of root.sort(compare)) {
      depthFirst(cs, 0);
    }
    return finalList;
  }

  // Movement rates.

  sneakingSpeed() {
    const bd = this.getBaseMovementSpeed();
    bd.divide(5, "sneaking");
    bd.multiply(this.getGravityMovementMultiplier(), "gravity");
    return bd;
  }

  getBaseMovementSpeed() {
    const bd = new ValueBreakdown();
    bd.addBreakdown(this.getEffStats().mov);
    if (bd.value() <= 0) {
      bd.set(0, "Base mov <= 0");
    }
    return bd;
  }

  getGravityMovementMultiplier() {
    return Math.min(4, 1 / this.gravity);
  }

  runningSpeed() {
    const bd = this.getBaseMovementSpeed();

    const edgeRate =
      this.getEdgeModifier(StatModifierType.RunMultiplier) || 1.0;
    const effRate =
      this.getEffectModifier(StatModifierType.RunMultiplier) || 1.0;
    bd.multiply(edgeRate, "edges");
    bd.multiply(effRate, "effects");

    bd.multiply(this.getGravityMovementMultiplier(), "gravity");

    return bd;
  }

  sprintingSpeed() {
    const bd = this.runningSpeed();
    bd.multiply(1.5, "sprint");
    return bd;
  }

  climbingSpeed() {
    const level = this.skillLevelExt("Climbing");
    const bd = this.getBaseMovementSpeed();

    bd.divide(30, "climbing");
    if (typeof level !== "number") {
      bd.divide(2, "unskilled");
    } else {
      bd.add(level, "skill level");
    }

    const edgeRate =
      this.getEdgeModifier(StatModifierType.ClimbMultiplier) || 1.0;
    const effRate =
      this.getEffectModifier(StatModifierType.ClimbMultiplier) || 1.0;
    bd.multiply(edgeRate, "edges");
    bd.multiply(effRate, "effects");

    bd.multiply(this.getGravityMovementMultiplier(), "gravity");

    return bd;
  }

  swimmingSpeed() {
    const level = this.skillLevelExt("Swimming");
    const bd = this.getBaseMovementSpeed();
    bd.divide(5, "swimming");

    if (typeof level !== "number") {
      bd.divide(2, "unskilled");
    } else {
      bd.add(level * 5, "skill level");
    }

    const edgeRate =
      this.getEdgeModifier(StatModifierType.SwimMultiplier) || 1.0;
    const effRate =
      this.getEffectModifier(StatModifierType.SwimMultiplier) || 1.0;
    bd.multiply(edgeRate, "edges");
    bd.multiply(effRate, "effects");

    bd.multiply(this.getGravityMovementMultiplier(), "gravity");

    return bd;
  }

  jumpingDistance() {
    const level = this.skillLevelExt("Jumping");
    const bd = this.getBaseMovementSpeed();
    bd.divide(12, "jumping");
    if (typeof level !== "number") {
      bd.divide(2, "unskilled");
    } else {
      bd.add(level * 0.75, "skill level");
    }

    const edgeRate =
      this.getEdgeModifier(StatModifierType.RunMultiplier) || 1.0;
    const effRate =
      this.getEffectModifier(StatModifierType.RunMultiplier) || 1.0;
    bd.multiply(edgeRate, "edges");
    bd.multiply(effRate, "effects");

    bd.multiply(this.getGravityMovementMultiplier(), "gravity");

    return bd;
  }

  jumpingHeight() {
    const bd = this.jumpingDistance();
    bd.divide(3, "jumping up");
    return bd;
  }

  flyingSpeed() {
    let canFly = false;
    const bd = this.getBaseMovementSpeed();
    const edgeRate = this.getEdgeModifier(StatModifierType.FlyMultiplier);
    const effRate = this.getEffectModifier(StatModifierType.FlyMultiplier);
    if (edgeRate) {
      bd.multiply(edgeRate, "edges");
      canFly = true;
    }
    if (effRate) {
      bd.multiply(effRate, "effects");
      canFly = true;
    }

    bd.multiply(this.getGravityMovementMultiplier(), "gravity");

    if (!canFly) bd.set(0, "cannot fly");

    return bd;
  }

  // Stats.

  getArmorPartMod(armor: Armor, givenStat: AllAttributeValues) {
    let fromArmor = 0;
    let fromQuality = 0;
    const stat = ("mod_" + givenStat) as ArmorStatModifierType;

    if (armor.base && stat in armor.base) {
      fromArmor += armor.base[stat];
    }

    if (armor.quality && stat in armor.quality) {
      fromQuality += armor.quality[stat];
    }

    // Quality cannot raise the stat, it only counters penalties.
    // Outlined in the armor xls.

    if (SkillsToMod.includes(givenStat as SkillAttributeTypes)) {
      return fromArmor + fromQuality;
    } else {
      return fromArmor + getCounteredPenalty(fromArmor, fromQuality);
    }
  }

  getSkillMod(skill: Skill) {
    const bd = new ValueBreakdown();
    for (let mod of SkillsToMod) {
      if (skill[`affected_by_armor_mod_${mod}`]) {
        bd.addBreakdown(this.getArmorStatMod(mod) as ValueBreakdown);
      }
    }
    return bd;
  }

  getEdgeModifier(mod: EdgeModifierType | StatModifierType) {
    // Return the sum of modifiers from edges for modifier `mod`.
    return this.getGenericModifier(mod, this.edges);
  }

  getEffectModifier(mod: EdgeModifierType | StatModifierType) {
    return this.getGenericModifier(mod, this.effects);
  }

  getGenericModifier<T extends string>(
    mod: T,
    list: Record<T, string | number>[],
  ) {
    let sum = 0;
    for (let gen of list) {
      const genElement = gen[mod];
      sum +=
        typeof genElement === "number" ? genElement : parseFloat(genElement);
    }
    return sum;
  }

  getBaseStats() {
    if (!this._baseStats) {
      this._baseStats = {};
      for (const st of Object.values(Attribute) as Attribute[]) {
        this._baseStats[st] =
          this.character[("cur_" + st) as CharacterAttribute] +
          this.character[("base_mod_" + st) as CharacterAttribute] +
          this.getEdgeStatMod(st).value();
      }
      this._baseStats.mov =
        util.roundup((this._baseStats.fit + this._baseStats.ref) / 2) +
        this.getEdgeStatMod(DerivedAttribute.Mov).value();
      this._baseStats.dex =
        util.roundup((this._baseStats.int + this._baseStats.ref) / 2) +
        this.getEdgeStatMod(DerivedAttribute.Dex).value();
      this._baseStats.imm =
        util.roundup((this._baseStats.fit + this._baseStats.psy) / 2) +
        this.getEdgeStatMod(DerivedAttribute.Imm).value();

      this._baseStats.stamina =
        util.roundup((this._baseStats.ref + this._baseStats.wil) / 4) +
        this.getEdgeModifier(EdgeModifierType.Stamina) +
        this.character.bought_stamina;

      this._baseStats.baseBody = util.roundup(this._baseStats.fit / 4);
      this._baseStats.body =
        this._baseStats.baseBody +
        2 * this.getEdgeModifier(EdgeModifierType.Toughness);

      this._baseStats.mana =
        util.roundup((this._baseStats.psy + this._baseStats.wil) / 4) +
        this.getEdgeModifier(EdgeModifierType.Mana) +
        this.character.bought_mana;
    }

    return this._baseStats;
  }

  getDamageThreshold(givenLoc: ArmorLocation): number {
    if (!this._thresholds) {
      const divider = { h: 10, t: 5, ra: 15, rl: 10, la: 15, ll: 10 };
      this._thresholds = {};
      for (const loc of ["h", "t", "ra", "rl", "la", "ll"] as ArmorLocation[]) {
        this._thresholds[loc] =
          util.roundup(this.getBaseStats().fit / divider[loc]) +
          this.getEdgeModifier(EdgeModifierType.Toughness);
      }
    }
    return this._thresholds[givenLoc] ?? 0;
  }

  getStatus() {
    const woundPenalties = this.getWoundPenalties();
    const acPenalty = this.getACPenalty().value;
    const painResistance =
      this.getEdgeModifier(EdgeModifierType.PainResistance) > 0;
    if (woundPenalties.aa > -10 && acPenalty > -10) {
      return SkillHandler.STATUS_OK;
    } else if (
      woundPenalties.aa < -20 ||
      (!painResistance && acPenalty <= -20)
    ) {
      /*
       * Pain resistance
       *
       * Never shocked due to wounding. Not subject to AA penalties
       * from leg and arm wounds. Automatically continue combat at
       * zero Stamina (at -20 AC, -2 I).
       *
       */
      return SkillHandler.STATUS_CRITICAL;
    } else {
      return SkillHandler.STATUS_WOUNDED;
    }
  }

  getWoundPenalties(): WoundPenalties {
    if (!this._woundPenalties) {
      // TODO: Use ValueBreakdown

      const woundPenalties = {} as Partial<WoundPenalties>;

      woundPenalties.bodyDamage = 0;
      woundPenalties.staminaDamage = 0;

      let locationDamages = { h: 0, t: 0, ra: 0, la: 0, rl: 0, ll: 0 };
      for (const ww of this.wounds) {
        const damage = ww.damage - ww.healed;
        locationDamages[ww.location.toLowerCase() as ArmorLocation] += damage;
      }

      // Cap body damage at threshold, rest is stamina damage.
      for (const loc of ["h", "t", "ra", "rl", "la", "ll"] as ArmorLocation[]) {
        const threshold = this.getDamageThreshold(loc);
        if (locationDamages[loc] > threshold) {
          // Damage exceeding twice the threshold is ignored.
          const damage = Math.min(threshold, locationDamages[loc] - threshold);

          woundPenalties.staminaDamage += damage;
          locationDamages[loc] = threshold;
        }
        woundPenalties.bodyDamage += locationDamages[loc];
      }

      const toughness = this.getEdgeModifier(EdgeModifierType.Toughness);

      woundPenalties.locationsDamages = Object.assign({}, locationDamages);

      for (let loc of ["h", "t", "ra", "rl", "la", "ll"] as ArmorLocation[]) {
        locationDamages[loc] = Math.max(0, locationDamages[loc] - toughness);
      }

      const maxAAPenaltyPerLoc = {
        h: -120,
        t: -100,
        ra: -10,
        la: -10,
        rl: -10,
        ll: -10,
      };
      woundPenalties.aa = Math.max(
        -10 * locationDamages.h,
        maxAAPenaltyPerLoc.h,
      );
      woundPenalties.aa += Math.max(
        -5 * locationDamages.t,
        maxAAPenaltyPerLoc.t,
      );
      if (this.getEdgeModifier(EdgeModifierType.PainResistance) <= 0) {
        for (let loc of ["ra", "la", "rl", "ll"] as ArmorLocation[]) {
          woundPenalties.aa += Math.max(
            util.rounddown(locationDamages[loc] / 3) * -5,
            maxAAPenaltyPerLoc[loc],
          );
        }
      }
      woundPenalties.mov = Math.max(-10 * locationDamages.rl, -75);
      woundPenalties.mov += Math.max(-10 * locationDamages.ll, -75);

      woundPenalties.la_fit_ref = -10 * locationDamages.la;
      woundPenalties.ra_fit_ref = -10 * locationDamages.ra;

      this._woundPenalties = woundPenalties as WoundPenalties;
    }
    return this._woundPenalties;
  }

  getCurrentBody() {
    return this.getBaseStats().body - this.getWoundPenalties().bodyDamage;
  }

  getStaminaDamage() {
    return this.staminaDamage + this.getWoundPenalties().staminaDamage;
  }

  getCurrentStamina() {
    return this.getBaseStats().stamina - this.getStaminaDamage();
  }

  getCurrentMana() {
    return this.getBaseStats().mana;
  }

  getEffStats() {
    function calculateEncumbrancePenalty(weightCarried: number, fit: number) {
      return util.roundup((-10 * weightCarried) / fit);
    }

    if (!this._effStatsV2) {
      const effStats: Record<AllAttributeValues, ValueBreakdown> = {
        fit: new ValueBreakdown(),
        ref: new ValueBreakdown(),
        lrn: new ValueBreakdown(),
        int: new ValueBreakdown(),
        psy: new ValueBreakdown(),
        wil: new ValueBreakdown(),
        cha: new ValueBreakdown(),
        pos: new ValueBreakdown(),
        mov: new ValueBreakdown(),
        dex: new ValueBreakdown(),
        imm: new ValueBreakdown(),
        stamina: new ValueBreakdown(),
        mana: new ValueBreakdown(),
        body: new ValueBreakdown(),
        climb: new ValueBreakdown(),
        stealth: new ValueBreakdown(),
        conceal: new ValueBreakdown(),
        swim: new ValueBreakdown(),
        vision: new ValueBreakdown(),
        hear: new ValueBreakdown(),
        smell: new ValueBreakdown(),
        surprise: new ValueBreakdown(),
      };

      const baseStats = this.getBaseStats();

      const woundPenalties = this.getWoundPenalties();

      for (const st of Object.values(AllAttributes) as AllAttributeValues[]) {
        const bd = effStats[st];

        bd.add(baseStats[st], st.toUpperCase());

        // TODO: handle armor mods separately
        const softMod = this._softMods[st];
        bd.add(softMod, "soft mods");

        bd.add(woundPenalties.aa, "wound penalties");
      }

      // Encumbrance and armor are calculated after soft mods
      // (transient effects, such as spells) and hard mods (edges)
      // in the Excel combat sheet.
      if (effStats.fit.value() > 0) {
        const encumbrancePenalty = calculateEncumbrancePenalty(
          this.getCarriedWeight().value(),
          effStats.fit.value(),
        );
        if (encumbrancePenalty < 0) {
          effStats.fit.add(encumbrancePenalty, "encumbrance");
          effStats.ref.add(encumbrancePenalty, "encumbrance");
        }

        if (this.gravity < 1.0) {
          const gravityPenalty = util.roundup(-25 * (1.0 - this.gravity));

          effStats.ref.add(gravityPenalty, "gravity");

          // Low-G maneuver
          const level = this.skillLevel("Low-G maneuver");
          const skillOffset = Math.min(level * 5, -gravityPenalty);
          effStats.ref.add(skillOffset, "low-g skill");
        }
      } else {
        // Effective FIT zero or negative, the character cannot move.
        effStats.ref.set(-100, "Eff-FIT negative");
        effStats.fit.set(-100, "Eff-FIT negative");
      }

      const addStatMods = (stat: DerivedAttribute) => {
        effStats[stat].add(this.getEdgeStatMod(stat).value(), "edges");
        effStats[stat].add(this._softMods[stat], "soft mods");
      };

      effStats.mov = new ValueBreakdown();

      const baseMov = util.roundup(
        (effStats.fit.value() + effStats.ref.value()) / 2,
      );
      effStats.mov.add(baseMov, "(FIT + REF) / 2");

      addStatMods(DerivedAttribute.Mov);
      effStats.mov.add(woundPenalties.mov, "wound penalties");

      effStats.dex = new ValueBreakdown();
      const baseDex = util.roundup(
        (effStats.int.value() + effStats.ref.value()) / 2,
      );
      effStats.dex.add(baseDex, "(INT + REF) / 2");
      addStatMods(DerivedAttribute.Dex);

      effStats.imm = new ValueBreakdown();

      const baseImm = util.roundup(
        (effStats.fit.value() + effStats.psy.value()) / 2,
      );
      effStats.imm.add(baseImm, "(FIT + PSY) / 2");
      addStatMods(DerivedAttribute.Imm);

      this._effStatsV2 = effStats as Record<AllAttributeValues, ValueBreakdown>;
    }
    return this._effStatsV2;
  }

  detectionLevel(
    goodEdge: string,
    badEdge: string,
    givenMap: Record<string, EdgeLevel> | undefined = undefined,
  ) {
    let level = -this.edgeLevel(badEdge, givenMap);
    if (!level) {
      level = this.edgeLevel(goodEdge, givenMap);
    }
    return level;
  }

  getTotalModifier(target: SenseAttribute) {
    return this.getEdgeStatMod(target).value() + this._softMods[target];
  }

  visionCheck(
    range: number,
    darknessDetectionLevel: number,
    givenPerks: EdgeLevel[],
  ) {
    const ranges = [2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

    if (darknessDetectionLevel > 0) {
      throw "Invalid value for darknessDetectionLevel";
    }

    const baseCheck =
      darknessDetectionLevel === 0
        ? this.dayVisionBaseCheck(givenPerks)
        : this.nightVisionBaseCheck(givenPerks);

    const darknessDL = Math.min(
      0,
      baseCheck.darknessDetectionLevel + darknessDetectionLevel,
    );

    const maxRangeIndex =
      baseCheck.detectionLevel + darknessDL + SkillHandler.BASE_VISION_RANGE;

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
    const bd = new ValueBreakdown();
    bd.addBreakdown(baseCheck.check);
    bd.add((maxRangeIndex - index) * 10, "from range");
    bd.add(darknessDL * 10, "from darkness");
    return bd;
  }

  dayVisionBaseCheck(givenPerks: EdgeLevel[]) {
    const perks = givenPerks
      ? SkillHandler.getItemMap(givenPerks, (item) => {
          return item.edge.name;
        })
      : {};

    const bd = new ValueBreakdown();
    bd.addBreakdown(this.skillCheck("Search", Attribute.Int, true));
    bd.add(this.getTotalModifier(SenseAttribute.Vision), "vision mods");

    bd.add(-5 * this.edgeLevel("Color Blind"), "from color blind");

    let acuteVision = this.detectionLevel("Acute Vision", "Poor Vision");
    acuteVision += this.detectionLevel("Acute Vision", "Poor Vision", perks);

    return {
      check: bd,
      detectionLevel: acuteVision,
      darknessDetectionLevel: 0,
    };
  }

  nightVisionBaseCheck(givenPerks: EdgeLevel[]) {
    const perks = givenPerks
      ? SkillHandler.getItemMap(givenPerks, (item) => {
          return item.edge.name;
        })
      : {};

    const bd = new ValueBreakdown();

    bd.addBreakdown(this.skillCheck("Search", Attribute.Int, true));
    bd.add(this.getTotalModifier(SenseAttribute.Vision), "vision mods");

    let acuteVision = this.detectionLevel("Acute Vision", "Poor Vision");
    acuteVision += this.detectionLevel("Acute Vision", "Poor Vision", perks);

    let nightVision = this.detectionLevel("Night Vision", "Night Blindness");
    nightVision += this.detectionLevel(
      "Night Vision",
      "Night Blindness",
      perks,
    );

    return {
      check: bd,
      detectionLevel: util.rounddown(acuteVision / 2),
      darknessDetectionLevel: nightVision,
    };
  }

  surpriseCheck() {
    const surpriseSkillCheck = this.skillCheck(
      "Tailing / Shadowing",
      Attribute.Psy,
      true,
    )?.value();
    return (
      (surpriseSkillCheck ?? 0) + this.getTotalModifier(SenseAttribute.Surprise)
    );
  }

  smellCheck() {
    const bd = new ValueBreakdown();

    bd.addBreakdown(this.skillCheck("Search", Attribute.Int, true));
    bd.add(this.getTotalModifier(SenseAttribute.Smell), "smell mods");

    return {
      check: bd,
      detectionLevel: this.detectionLevel(
        "Acute Smell and Taste",
        "Poor Smell and Taste",
      ),
    };
  }

  hearingCheck() {
    const bd = new ValueBreakdown();

    bd.addBreakdown(this.skillCheck("Search", Attribute.Int, true));
    bd.add(this.getTotalModifier(SenseAttribute.Hear), "hear mods");

    return {
      check: bd,
      detectionLevel: this.detectionLevel("Acute Hearing", "Poor Hearing"),
    };
  }

  touchCheck() {
    const bd = new ValueBreakdown();
    bd.addBreakdown(
      this.getArmorStatMod(SkillAttribute.Climb) as ValueBreakdown,
    );
    bd.divide(2, "touch coefficient");
    bd.roundup();
    bd.addBreakdown(this.skillCheck("Search", Attribute.Int, true));
    return {
      check: bd,
      detectionLevel: this.edgeLevel("Acute Touch"),
    };
  }
}

export default SkillHandler;
