import SkillHandler from 'SkillHandler'

let objectId = 1;
let created = {skills: {}}

export function clearAll() {
    objectId = 1
    created = {skills: {}}
}

const characterFactory = function (statOverrides) {
    let _charData = {
        id: 2,

        "start_fit": 43,
        "start_ref": 43,
        "start_lrn": 43,
        "start_int": 43,
        "start_psy": 43,
        "start_wil": 43,
        "start_cha": 43,
        "start_pos": 43,

        "cur_fit": 43,
        "cur_ref": 43,
        "cur_lrn": 43,
        "cur_int": 43,
        "cur_psy": 43,
        "cur_wil": 43,
        "cur_cha": 43,
        "cur_pos": 43,

        "gained_sp": 0,

        "base_mod_fit": 0,
        "base_mod_ref": 0,
        "base_mod_lrn": 0,
        "base_mod_int": 0,
        "base_mod_psy": 0,
        "base_mod_wil": 0,
        "base_mod_cha": 0,
        "base_mod_pos": 0,
        "base_mod_mov": 0,
        "base_mod_dex": 0,
        "base_mod_imm": 0,
        bought_mana: 0,
        bought_stamina: 0,
        total_xp: 0,
        free_edges: 0,
        xp_used_ingame: 0,

        weigth: "75.0",
        edges: [],
        "campaign": 2
    };

    return Object.assign(_charData, statOverrides);
};


function minimalSkillFactory(overrideFields = {}) {
    const sk = skillFactory(overrideFields)
    return {id: sk.id, name: sk.name}
}


const skillFactory = function (overrideFields = {}) {
    let props = {};
    // Simplify generating skills to allow using only the name.  Slight
    // allowance for older code.
    if (typeof(overrideFields) === "string") {
        props.name = overrideFields;
    } else if (overrideFields){
        props = overrideFields;
    }
    let _baseSkill = {
        id: objectId,
        "name": "Foo Skill",
        "description": "",
        "notes": "",
        "can_be_defaulted": true,
        "is_specialization": false,
        "skill_cost_0": 2,
        "skill_cost_1": 2,
        "skill_cost_2": 3,
        "skill_cost_3": 4,
        "type": "Social",
        "stat": "CHA",
        "tech_level": 1,
        "required_skills": [],
        "required_edges": [],
        "min_level": 0,
        "max_level": 8,
        "powered_ref_counter": 0,
        "powered_fit_mod": 0,
    };
    const newSkill = Object.assign(_baseSkill, props);

    newSkill.required_skills = newSkill.required_skills.map((req) => minimalSkillFactory(req))

    if (created.skills[newSkill.name] === undefined) {
        created.skills[newSkill.name] = newSkill
    } else {
        return created.skills[newSkill.name]
    }
    objectId = newSkill.id + 1;

    return newSkill
};


export function characterSkillFactory (overrideFields = {}) {
    if (typeof(overrideFields.skill) === "string") {
        overrideFields.skill__name = overrideFields.skill
        delete overrideFields.skill
    }
    let _baseCS = {
        "id": objectId,
        "level": 1,
        "character": 1,
        "skill": objectId,
        "skill__name": "Acting / Bluff"
    };
    const newSkill = Object.assign(_baseCS, overrideFields);
    /* Overriding ID is possible. */
    objectId = newSkill.id + 1;

    const baseSkill = skillFactory(newSkill.skill__name)
    newSkill.skill = baseSkill.id
    newSkill.skill__name = baseSkill.name

    return newSkill
};

const edgeFactory = function (overrideFields) {
    let props = {};

    // Treat an existing non-object as name.
    if (typeof(overrideFields) !== "object" && overrideFields) {
        props = {name: overrideFields};
    } else  if (overrideFields) {
        props = overrideFields;
    }

    let edge = {
        "name": "Acute Hearing",
        "description": "Can hear very well",
        "notes": "No notes to talk about"
    };
    return Object.assign(edge, props);
};

const edgeSkillBonusFactory = function (overrideFields) {
    if (!overrideFields){
        overrideFields = {};
    }

    let _baseBonus = {
        "id": objectId,
        "skill": 42,
        "skill__name": "Surgery",
        "bonus": 15
    };

    const newBonus = Object.assign(_baseBonus, overrideFields);
    /* Overriding ID is possible. */
    objectId = newBonus.id + 1;
    return newBonus;
};

const edgeLevelFactory = function (overrideFields) {
    if (!overrideFields){
        overrideFields = {};
    }
    const edge = edgeFactory(overrideFields.edge);

    if ('edge' in overrideFields) {
        delete overrideFields.edge;
    }

    let edgeSkillBonuses = [];
    if (overrideFields.edge_skill_bonuses) {
        for (let bonus of overrideFields.edge_skill_bonuses) {
            edgeSkillBonuses.push(edgeSkillBonusFactory(bonus));
        }
        delete overrideFields.edge_skill_bonuses;
    }

    let _baseEdge = {
        "id": objectId,
    "notes": "",
    "cc_skill_levels": 0,
    "fit": 0,
    "ref": 0,
    "lrn": 0,
    "int": 0,
    "psy": 0,
    "wil": 0,
    "cha": 0,
    "pos": 0,
    "mov": 0,
    "dex": 0,
    "imm": 0,
    "saves_vs_fire": 0,
    "saves_vs_cold": 0,
    "saves_vs_lightning": 0,
    "saves_vs_poison": 0,
    "saves_vs_all": 0,
    "run_multiplier": "0.00",
    "swim_multiplier": "0.00",
    "climb_multiplier": "0.00",
    "fly_multiplier": "0.00",
    "armor_l": "0.00",
    "armor_dr": "0.00",
    "pain_resistance": 0,
    "vision": 0,
    "hear": 0,
    "smell": 0,
    "surprise": 0,
    "level": 1,
    "cost": "-1.0",
    "requires_hero": false,
    "edge": edge,
    "edge_skill_bonuses": edgeSkillBonuses,
    "extra_skill_points": 0
    };

    const newEdge = Object.assign(_baseEdge, overrideFields);
    /* Overriding ID is possible. */
    objectId = newEdge.id + 1;
    return newEdge;
};

const characterEdgeFactory = function (overrideFields) {
    if (!overrideFields){
        overrideFields = {};
    }
    let edge= edgeLevelFactory(overrideFields.edge);

    if ('edge' in overrideFields) {
        delete overrideFields.edge;
    }

    let _baseCharacterEdge = {
        "id": objectId,
        "edge": edge,
        "character": 1,
        "ignore_cost": false
    };
    const newEdge = Object.assign(_baseCharacterEdge, overrideFields);
    /* Overriding ID is possible. */
    objectId = newEdge.id + 1;
    return newEdge;
};


const baseFirearmFactory = (props) => {
    if (!props) {
        props = {};
    }

    let _base = {
            "id": objectId,

            "name": "Glock 19",
            "short_name": "",
            "description": "",
            "notes": "",
            "draw_initiative": -3,
            "durability": 4,
            "dp": 3,
            "weight": "0.7",
            "target_initiative": -1,
            "range_pb": null, "range_xs": null, "range_vs": null,
            "range_s": 12, "range_m": 24, "range_l": 48,
            "range_xl": null, "range_e": null,
            "autofire_rpm": null,
            "autofire_class": "",
            "sweep_fire_disabled": false,
            "restricted_burst_rounds": 0,
            "stock": "1.00",
            "duration": "0.110",
            "accuracy": "1.00",
            "sight": 153,
            "barrel_length": 102,
            "weapon_class_modifier": "6.00",
            "tech_level": 4,
            "base_skill": "Handguns",
            "required_skills": [],
            "magazine_size": 8,
            "magazine_weight": 0.350
    };

    const newFirearm = Object.assign(_base, props);

    objectId = newFirearm.id + 1

    newFirearm.base_skill = minimalSkillFactory(newFirearm.base_skill)
    newFirearm.required_skills = newFirearm.required_skills.map((req) => minimalSkillFactory(req))

    return newFirearm
};

const ammunitionFactory = (props) => {
    if (!props) {
        props = {};
    }

    let _base = {
        "id": objectId,
        "num_dice": 1,
        "dice": 6,
        "extra_damage": 0,
        "leth": 5,
        "plus_leth": 0,
        "type": "P",
        "bullet_type": "FMJ",
        "bypass": 0,
        "weight": "7.500",
        "velocity": 440,
        "tech_level": 4,
        "calibre": {
            "name": "9Pb"
        }
    };
    let newAmmo = Object.assign(_base, props);
    objectId = newAmmo.id + 1;
    return newAmmo;
};

const magazineFactory = (props) => {
    if (!props) {
        props = {};
    }

    let _base = {
        "id": objectId,
        "capacity": 15,
        "current": 7
    };
    let newObject = Object.assign(_base, props);
    objectId = newObject.id + 1;
    return newObject;
};

const scopeFactory = (props) => {
    if (!props) {
        props = {};
    }

    let _base = {
        "id": objectId,
        "name": "Bronze sights",
        "target_i_mod": 0,
        "to_hit_mod": 0,
        "tech_level": 4,
        "weight": "7.500",
        "sight": 100,
        "notes": "",
        perks: []
    };

    let perks = [];
    if (props.perks) {
        for (let edge of props.perks) {
            // Rest endpoint for firearm addons and scopes returns edge
            // with only the name in the field.
            const edgeName = edge.edge
            const perk = edgeLevelFactory(edge);
            perk.edge = edgeName
            perks.push(perk);
        }
    }

    let newScope = Object.assign(_base, props);
    newScope.perks = perks;
    objectId = newScope.id + 1;
    return newScope;
};

const firearmFactory = function (overrideFields) {
    if (!overrideFields) {
        overrideFields = {};
    }
    let id = objectId++;
    if (overrideFields.id) {
        id = overrideFields.id;
    }
    let magazines = []
    if (overrideFields.magazines) {
        for (const mag of overrideFields.magazines) {
            magazines.push(magazineFactory(mag))
        }
    }
    return {id: id,
            base: baseFirearmFactory(overrideFields.base),
            ammo: ammunitionFactory(overrideFields.ammo),
            scope: overrideFields.scope === null ? null : scopeFactory(overrideFields.scope),
            magazines: magazines,
            use_type: overrideFields.use_type ?? "FULL"
    };
};

function firearmControlPropsFactory(givenProps) {
    if (!givenProps) {
        givenProps = {};
    }
    let handlerProps = {
        skills: [],
        allSkills: [
            {
                name: "Basic Firearms",
                stat: "dex"
            },
            {
                name: "Pistol", stat: "dex",
                required_skills: ["Basic Firearms"]
            },
            {
                name: "Wheeled",
                stat: "dex"
            },
            {
                name: "Handguns",
                stat: "dex",
                required_skills: ["Basic Firearms"]
            },
            {
                name: "Long guns",
                stat: "dex",
                required_skills: ["Basic Firearms"]
            }
        ],
        character: {cur_int: 45, cur_ref: 45}
    };
    let weaponProps = {base: {base_skill: "Pistol"}};
    if (givenProps.handlerProps) {
        handlerProps = Object.assign(handlerProps,
            givenProps.handlerProps);
    }
    if (givenProps.weapon) {
        weaponProps = Object.assign(weaponProps, givenProps.weapon);
    }
    // Should be initialized before firearm to prime the base skills.
    const skillHandler = skillHandlerFactory(handlerProps);
    let props = {
        campaign: givenProps.campaign || 3,
        weapon: firearmFactory(weaponProps),
        skillHandler: skillHandler
    };

    return Object.assign(givenProps, props);
}

const miscellaneousItemFactory = function (overrideFields) {
    let item = {
        "id": objectId++,
        "name": "Bullet proof cloak",
        "description": "",
        "notes": "",
        "weight": "1.00",
        "tech_level": 5,
        "armor_qualities": [
        ],
        "weapon_qualities": []
    };
    if (!overrideFields) {
        overrideFields = {};
    }
    return Object.assign(item, overrideFields);
};

const sheetMiscellaneousItemFactory = function (overrideFields) {

    if (!overrideFields) {
        overrideFields = {};
    }

    let item = {};
    if (overrideFields.item) {
        item = overrideFields.item;
        delete overrideFields.item;
    }
    let sheetItem = Object.assign({id: objectId++}, overrideFields);
    sheetItem.item = miscellaneousItemFactory(item);
    return sheetItem;
};

const armorTemplateFactory = function (overrideFields) {
    let template = {
        "name": "Cloth cloak",
        "description": "",
        "is_helm": false,
        "is_powered": false,
        "armor_h_p": "0.0",
        "armor_h_s": "0.0",
        "armor_h_b": "0.0",
        "armor_h_r": "0.0",
        "armor_h_dr": "0.0",
        "armor_h_dp": "0.0",
        "armor_t_p": "0.0",
        "armor_t_s": "0.0",
        "armor_t_b": "0.0",
        "armor_t_r": "0.0",
        "armor_t_dr": "0.0",
        "armor_t_dp": "0.0",
        "armor_ll_p": "0.0",
        "armor_ll_s": "0.0",
        "armor_ll_b": "0.0",
        "armor_ll_r": "0.0",
        "armor_ll_dr": "0.0",
        "armor_ll_dp": "0.0",
        "armor_la_p": "0.0",
        "armor_la_s": "0.0",
        "armor_la_b": "0.0",
        "armor_la_r": "0.0",
        "armor_la_dr": "0.0",
        "armor_la_dp": "0.0",
        "armor_rl_p": "0.0",
        "armor_rl_s": "0.0",
        "armor_rl_b": "0.0",
        "armor_rl_r": "0.0",
        "armor_rl_dr": "0.0",
        "armor_rl_dp": "0.0",
        "armor_ra_p": "0.0",
        "armor_ra_s": "0.0",
        "armor_ra_b": "0.0",
        "armor_ra_r": "0.0",
        "armor_ra_dr": "0.0",
        "armor_ra_dp": "0.0",
        "armor_h_pl": 0,
        "armor_t_pl": 0,
        "armor_ll_pl": 0,
        "armor_rl_pl": 0,
        "armor_la_pl": 0,
        "armor_ra_pl": 0,
        "mod_fit": 0,
        "mod_ref": 0,
        "mod_psy": 0,
        "mod_vision": 0,
        "mod_hear": 0,
        "mod_smell": 0,
        "mod_surprise": 0,
        "mod_stealth": 0,
        "mod_conceal": 0,
        "mod_climb": 0,
        "mod_tumble": 0,
        "weight": "1.00",
        "encumbrance_class": 0,
        "tech_level": 1
        };
    if (!overrideFields) {
        overrideFields = {};
    }
    return Object.assign(template, overrideFields);
};

const armorQualityFactory = function (overrideFields) {
    let quality = {
        "name": "normal",
        "short_name": "",
        "dp_multiplier": "1.0",
        "armor_p": "0.0",
        "armor_s": "0.0",
        "armor_b": "0.0",
        "armor_r": "0.0",
        "armor_dr": "0.0",
        "mod_fit_multiplier": "1.0",
        "mod_fit": 0,
        "mod_ref": 0,
        "mod_psy": 0,
        "mod_sensory": 0,
        "mod_stealth": 0,
        "mod_conceal": 0,
        "mod_climb": 0,
        "mod_tumble": 0,
        "mod_weight_multiplier": "1.0",
        "mod_encumbrance_class": 0,
        "tech_level": 1
        };
    if (!overrideFields) {
        overrideFields = {};
    }
    return Object.assign(quality, overrideFields);
};

const armorFactory = function(overrideFields) {
    if (!overrideFields) {
        overrideFields = {};
    }

    let base = {};
    if (overrideFields.base) {
        base = overrideFields.base;
        delete overrideFields.base;
    }

    let quality = {};
    if (overrideFields.quality) {
        quality = overrideFields.quality;
        delete overrideFields.quality;
    }

    let armor = {
        "id": 1,
        "name": "Leather armor",
        "description": "",
        "base": armorTemplateFactory(Object.assign(
                {name: "Leather armor"}, base)),
        "quality": armorQualityFactory(quality),
        "special_qualities": []
    };
    return Object.assign(armor, overrideFields);
};

export function weaponTemplateFactory(overrideFields) {
    let template = {
            "id": objectId,

            "name": "Broadsword",
            "short_name": "Spatha",
            "description": "",
            "notes": "",
            "draw_initiative": -4,
            "durability": 7,
            "dp": 7,
            "weight": "1.4",
            "num_dice": 1,
            "dice": 8,
            "extra_damage": 0,
            "leth": 5,
            "plus_leth": 0,
            "roa": "1.000",
            "bypass": -1,
            "type": "S",
            "ccv": 13,
            "ccv_unskilled_modifier": -10,
            "defense_leth": 5,
            "is_lance": false,
            "is_shield": false,
            "tech_level": 3,
            "base_skill": "Sword",
            "required_skills": []
        };
    if (!overrideFields) {
        overrideFields = {};
    }
    let newWeapon = Object.assign(template, overrideFields);

    objectId = newWeapon.id + 1;

    newWeapon.base_skill = minimalSkillFactory(newWeapon.base_skill)
    newWeapon.required_skills = newWeapon.required_skills.map((req) => minimalSkillFactory(req))

    return newWeapon
};

const weaponQualityFactory = function (overrideFields) {
    let quality = {
            "name": "normal",
            "short_name": "",
            "roa": "0.0000",
            "ccv": 0,
            "damage": 0,
            "leth": 0,
            "plus_leth": 0,
            "bypass": 0,
            "durability": 0,
            "dp_multiplier": "1.0000",
            "weight_multiplier": "1.0000",
            "notes": "",
            "defense_leth": 0,
            "versus_missile_modifier": 0,
            "versus_area_save_modifier": 0,
            "max_fit": 90,
            "tech_level": 1
        };
    if (!overrideFields) {
        overrideFields = {};
    }
    return Object.assign(quality, overrideFields);
};

const weaponFactory = function (overrideFields) {
    if (!overrideFields) {
        overrideFields = {};
    }
    let weapon = {
        "id": 3,
        "name": "Broadsword",
        "description": "",
        "size": 1,
        "quality": weaponQualityFactory(overrideFields.quality),
        "base": weaponTemplateFactory(overrideFields.base),
        "special_qualities": []
    };
    
    let overrides = Object.assign({}, overrideFields);
    if (overrides.base !== undefined) {
        delete overrides.base;
    }

    if (overrides.quality !== undefined) {
        delete overrides.quality;
    }
    return Object.assign(weapon, overrides);
};

export function rangedWeaponTemplateFactory(overrideFields) {
    let template = {
            "id": objectId,
            "name": "Short bow, 2h w/ Broadhead arrow",
            "short_name": "Sb-bh",
            "description": "",
            "notes": "",
            "draw_initiative": -8,
            "durability": 6,
            "dp": 0,
            "weight": "1.0",
            "num_dice": 1,
            "dice": 6,
            "extra_damage": 0,
            "leth": 5,
            "plus_leth": -1,
            "roa": "1.000",
            "bypass": -1,
            "target_initiative": -2,
            "range_pb": 3,
            "range_xs": 5,
            "range_vs": 10,
            "range_s": 20,
            "range_m": 40,
            "range_l": 65,
            "range_xl": 98,
            "range_e": 130,
            "type": "P(S)",
            "ammo_weight": "0.0",
            "weapon_type": "bow",
            "tech_level": 1,
            "base_skill": "Bow",
            "required_skills": []
        };
    if (!overrideFields) {
        overrideFields = {};
    }
    let newWeapon = Object.assign(template, overrideFields);

    objectId = newWeapon.id + 1

    newWeapon.base_skill = minimalSkillFactory(newWeapon.base_skill)
    newWeapon.required_skills = newWeapon.required_skills.map((req) => minimalSkillFactory(req))
    return newWeapon
};

const rangedWeaponFactory = function (overrideFields = {}) {
    let weapon = {
        "id": 1,
        "name": "Short bow, 2h w/ Broadhead arrow Exceptional",
        "description": "",
        "size": 1,
        "quality": weaponQualityFactory(overrideFields.quality),
        "base": rangedWeaponTemplateFactory(overrideFields.base),
        "ammo_quality": null,
        "special_qualities": []
    };

    let overrides = Object.assign({}, overrideFields);
    if ('base' in overrides) {
        delete overrides.base;
    }
    if ('quality' in overrides) {
        delete overrides.quality;
    }
    return Object.assign(weapon, overrides);
};

const transientEffectFactory = function (overrideFields) {
    if (!overrideFields) {
        overrideFields = {};
    }

    let effect = {
        "name": "No effect",
        "notes": "",
        "cc_skill_levels": 0,
        "fit": 0,
        "ref": 0,
        "lrn": 0,
        "int": 0,
        "psy": 0,
        "wil": 0,
        "cha": 0,
        "pos": 0,
        "mov": 0,
        "dex": 0,
        "imm": 0,
        "saves_vs_fire": 0,
        "saves_vs_cold": 0,
        "saves_vs_lightning": 0,
        "saves_vs_poison": 0,
        "saves_vs_all": 0,
        "run_multiplier": "0.00",
        "swim_multiplier": "0.00",
        "climb_multiplier": "0.00",
        "fly_multiplier": "0.00",
        "description": "",
        "type": "enhancement",
        "tech_level": 1
    };

    return Object.assign(effect, overrideFields);
};

const sheetTransientEffectFactory = function (overrideFields) {
    if (!overrideFields) {
        overrideFields = {};
    }

    let effect = {
        "id": 1,
        "effect": transientEffectFactory(overrideFields.effect),
        "sheet": 1
    };

    let overrides = Object.assign({}, overrideFields);
    if ('effect' in overrides) {
        delete overrides.effect;
    }
    return Object.assign(effect, overrides);
};

const inventoryEntryFactory = function (overrides) {
    let _entryData = {
        quantity: 1,
        unit_weight: "0.5",
        description: "Item",
        order: 0,
        location: "",
        id: objectId++
    };

    return Object.assign(_entryData, overrides);
};

const woundFactory = function (overrides) {
    let _entryData = {
        "id": objectId++,
        "location": "T",
        "damage": 1,
        "healed": 0,
        "damage_type": "S",
        "effect": "Grazed.",
        "character": 2,
        "sheet": 1
    };

    return Object.assign(_entryData, overrides);
};

const sheetFactory = function (statOverrides) {
    let _sheetData = {
        id: 1,
        character: 2,
        stamina_damage: 0,
    };

    return Object.assign(_sheetData, statOverrides);
};

function getSkillName(characterSkillCandidate) {
    // TODO: harmonize across tests. This function should not be needed.
    if (typeof(characterSkillCandidate) === "string") {
        return characterSkillCandidate
    } else if (characterSkillCandidate.skill__name !== undefined) {
        return characterSkillCandidate.skill__name
    } else if (typeof(characterSkillCandidate.skill) === "string") {
        return characterSkillCandidate.skill
    } else if (characterSkillCandidate.skill?.name !== undefined) {
        return characterSkillCandidate.skill.name
    }
    throw Error("unrecognized character skill candidate")
}

export function skillHandlerFactory (givenProps) {
    if (!givenProps) {
        givenProps = {};
    }
    let edgeList = [], skills = [], allSkills = [], effects = [], wounds = [];

    let skillMap = {};
    if (givenProps.allSkills) {
        for (let sk of givenProps.allSkills) {
            const newSkill = skillFactory(sk);
            allSkills.push(newSkill);
            skillMap[newSkill.name] = newSkill;
        }
    }
    if (givenProps.skills) {
        for (let sk of givenProps.skills) {
            let skill
            if (typeof(sk.skill) === "object") {
                skill = skillFactory(sk.skill);
            } else {
                skill = skillFactory(getSkillName(sk))
            }
            if (!(skill.name in skillMap)) {
                allSkills.push(skill);
            } else {
                skill = skillMap[skill.name];
            }
            const charSkill = characterSkillFactory(
                Object.assign({}, sk, {skill: skill.id, skill__name: skill.name}));
            skills.push(charSkill);
        }
    }
    if (givenProps.edges) {
        for (let edge of givenProps.edges) {
            var createdEdge = edgeLevelFactory(edge);
            edgeList.push(createdEdge);
        }
    }
    if (givenProps.effects) {
        for (let eff of givenProps.effects) {
            var createdEff = transientEffectFactory(eff);
            effects.push(createdEff);
        }
    }

    if (givenProps.wounds) {
        for (let ww of givenProps.wounds) {
            var wound = woundFactory(ww);
            wounds.push(wound);
        }

    }
    var armor = {};
    if (givenProps.armor) {
        armor = armorFactory(givenProps.armor);
    }
    var helm = {};
    if (givenProps.helm) {
        helm = armorFactory(givenProps.helm);
    }
    const handlerProps = {
        character: characterFactory(
            Object.assign({}, givenProps.character)),
        edges: edgeList,
        effects: effects,
        characterSkills: skills,
        allSkills: allSkills,
        wounds: wounds,
        armor: armor,
        helm: helm,
    };
    return new SkillHandler(Object.assign({}, givenProps, handlerProps));
};

export {
    characterFactory, sheetFactory, skillFactory,
    edgeLevelFactory, edgeFactory, characterEdgeFactory, ammunitionFactory,
    scopeFactory, baseFirearmFactory, firearmControlPropsFactory,
    magazineFactory, firearmFactory,
    weaponQualityFactory, weaponFactory, rangedWeaponFactory,
    transientEffectFactory, sheetTransientEffectFactory,
    inventoryEntryFactory, armorTemplateFactory, armorQualityFactory,
    armorFactory, miscellaneousItemFactory, sheetMiscellaneousItemFactory,
    woundFactory
}