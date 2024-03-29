import React from 'react';
import TestUtils from 'react-dom/test-utils';

const rest = require('sheet-rest');

const StatBlock = require('StatBlock').default;
const SkillHandler = require('SkillHandler').default;

let objectId = 1;

const characterFactory = function (statOverrides) {
    var _charData = {
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
        stamina_damage: 0,
        total_xp: 0,
        free_edges: 0,
        xp_used_ingame: 0,

        edges: [],
        "campaign": 2
    };

    return Object.assign(_charData, statOverrides);
};

var skillFactory = function (overrideFields) {
    var props = {};
    // Simplify generating skills to allow using only the name.  Slight
    // allowance for older code.
    if (typeof(overrideFields) === "object") {
        props = overrideFields;
    } else if (overrideFields){
        props.name = overrideFields;
    }
    var _baseSkill = {
        "name": "Acting / Bluff",
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
        "max_level": 8
    };
    return Object.assign(_baseSkill, props);
};


var nextEdgeID = 0;

var edgeFactory = function (overrideFields) {
    "use strict";

    var props = {};

    // Treat an existing non-object as name.
    if (typeof(overrideFields) !== "object" && overrideFields) {
        props = {name: overrideFields};
    } else  if (overrideFields) {
        props = overrideFields;
    }

    var edge = {
        "name": "Acute Hearing",
        "description": "Can hear very well",
        "notes": "No notes to talk about"
    };
    return Object.assign(edge, props);
};

var edgeSkillBonusFactory = function (overrideFields) {
    if (!overrideFields){
        overrideFields = {};
    }

    var _baseBonus = {
        "id": objectId,
        "skill": "Surgery",
        "bonus": 15
    };

    var newBonus = Object.assign(_baseBonus, overrideFields);
    /* Overriding ID is possible. */
    objectId = newBonus.id + 1;
    return newBonus;
};

var edgeLevelFactory = function (overrideFields) {
    if (!overrideFields){
        overrideFields = {};
    }
    var edge = edgeFactory(overrideFields.edge);

    if ('edge' in overrideFields) {
        delete overrideFields.edge;
    }

    var edgeSkillBonuses = [];
    if (overrideFields.edge_skill_bonuses) {
        for (let bonus of overrideFields.edge_skill_bonuses) {
            edgeSkillBonuses.push(edgeSkillBonusFactory(bonus));
        }
        delete overrideFields.edge_skill_bonuses;
    }

    var _baseEdge = {
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

    var newEdge = Object.assign(_baseEdge, overrideFields);
    /* Overriding ID is possible. */
    objectId = newEdge.id + 1;
    return newEdge;
};

const characterEdgeFactory = function (overrideFields) {
    if (!overrideFields){
        overrideFields = {};
    }
    var edge = edgeLevelFactory(overrideFields.edge);

    if ('edge' in overrideFields) {
        delete overrideFields.edge;
    }

    var _baseCharacterEdge = {
        "id": objectId,
        "edge": edge,
        "character": 1,
        "ignore_cost": false
    };
    var newEdge = Object.assign(_baseCharacterEdge, overrideFields);
    /* Overriding ID is possible. */
    objectId = newEdge.id + 1;
    return newEdge;
};

// Tests pollute each other, needs some reset functionality.
var nextSkillID = 0;

var characterSkillFactory = function (overrideFields) {
    var _baseCS = {
        "id": nextSkillID,
        "level": 1,
        "character": 1,
        "skill": "Acting / Bluff"
    };
    var newSkill = Object.assign(_baseCS, overrideFields);
    /* Overriding ID is possible. */
    nextSkillID = newSkill.id + 1;
    return newSkill
};

const baseFirearmFactory = (props) => {
    if (!props) {
        props = {};
    }

    let _base = {
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
            "skill": null,
            "skill2": null,
            "magazine_size": 8,
            "magazine_weight": 0.350
    };
    return Object.assign(_base, props);
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
    objectId += 1;
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
            perks.push(edgeLevelFactory(edge));
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
                name: "Pistol", stat: "dex",
                required_skills: ["Basic Firearms"]
            },
            {
                name: "Basic Firearms",
                stat: "dex"
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
    let props = {
        campaign: givenProps.campaign || 3,
        weapon: firearmFactory(weaponProps),
        skillHandler: skillHandlerFactory(handlerProps)
    };

    return Object.assign(givenProps, props);
}

var miscellaneousItemFactory = function (overrideFields) {
    "use strict";
    var item = {
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

var sheetMiscellaneousItemFactory = function (overrideFields) {
    "use strict";

    if (!overrideFields) {
        overrideFields = {};
    }

    var item = {};
    if (overrideFields.item) {
        item = overrideFields.item;
        delete overrideFields.item;
    }
    var sheetItem = Object.assign({id: objectId++}, overrideFields);
    sheetItem.item = miscellaneousItemFactory(item);
    return sheetItem;
};

var armorTemplateFactory = function (overrideFields) {
    "use strict";
    var template = {
        "name": "Cloth hood",
        "description": "",
        "is_helm": true,
        "armor_h_p": "0.0",
        "armor_h_s": "0.0",
        "armor_h_b": "0.0",
        "armor_h_r": "-0.5",
        "armor_h_dr": "-1.0",
        "armor_h_dp": "1.0",
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

var armorQualityFactory = function (overrideFields) {
    "use strict";
    var quality = {
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

var armorFactory = function(overrideFields) {
    "use strict";
    if (!overrideFields) {
        overrideFields = {};
    }

    var base = {};
    if (overrideFields.base) {
        base = overrideFields.base;
        delete overrideFields.base;
    }

    var quality = {};
    if (overrideFields.quality) {
        quality = overrideFields.quality;
        delete overrideFields.quality;
    }

    var armor = {
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

var weaponTemplateFactory = function (overrideFields) {
    var template = {
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
            "skill": null,
            "skill2": null
        };
    if (!overrideFields) {
        overrideFields = {};
    }
    return Object.assign(template, overrideFields);
};

var weaponQualityFactory = function (overrideFields) {
    "use strict";
    var quality = {
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

var weaponFactory = function (overrideFields) {
    "use strict";

    if (!overrideFields) {
        overrideFields = {};
    }
    var weapon = {
        "id": 3,
        "name": "Broadsword",
        "description": "",
        "size": 1,
        "quality": weaponQualityFactory(overrideFields.quality),
        "base": {
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
            "skill": null,
            "skill2": null
        },
        "special_qualities": []
    };
    
    var overrides = Object.assign({}, overrideFields);
    if ('base' in overrides) {
        weapon.base = Object.assign(weapon.base, overrideFields.base);
        delete overrides.base;
    }

    if ('quality' in overrides) {
        delete overrides.quality;
    }
    return Object.assign(weapon, overrides);
};

var rangedWeaponFactory = function (overrideFields) {
    "use strict";

    if (!overrideFields) {
        overrideFields = {};
    }

    var weapon = {
        "id": 1,
        "name": "Short bow, 2h w/ Broadhead arrow Exceptional",
        "description": "",
        "size": 1,
        "quality": weaponQualityFactory(overrideFields.quality),
        "base": {
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
            "skill": null,
            "skill2": null
        },
        "ammo_quality": null,
        "special_qualities": []
    };

    var overrides = Object.assign({}, overrideFields);
    if ('base' in overrides) {
        weapon.base = Object.assign(weapon.base, overrideFields.base);
        delete overrides.base;
    }

    if ('quality' in overrides) {
        delete overrides.quality;
    }
    return Object.assign(weapon, overrides);
};

var transientEffectFactory = function (overrideFields) {
    "use strict";

    if (!overrideFields) {
        overrideFields = {};
    }

    var effect = {
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

var sheetTransientEffectFactory = function (overrideFields) {
    "use strict";

    if (!overrideFields) {
        overrideFields = {};
    }

    var effect = {
        "id": 1,
        "effect": transientEffectFactory(overrideFields.effect),
        "sheet": 1
    };

    var overrides = Object.assign({}, overrideFields);
    if ('effect' in overrides) {
        delete overrides.effect;
    }
    return Object.assign(effect, overrides);
};

var inventoryEntryFactory = function (overrides) {
    var _entryData = {
        quantity: 1,
        unit_weight: "0.5",
        description: "Item",
        order: 0,
        location: "",
        id: objectId++
    };

    return Object.assign(_entryData, overrides);
};

var woundFactory = function (overrides) {
    var _entryData = {
        "id": objectId++,
        "location": "T",
        "damage": 1,
        "healed": 0,
        "damage_type": "S",
        "effect": "Grazed.",
        "character": 2
    };

    return Object.assign(_entryData, overrides);
};

var sheetFactory = function (statOverrides) {
    var _sheetData = {
        id: 1,
        character: 2,
    };

    return Object.assign(_sheetData, statOverrides);
};

var statBlockTreeFactory = function (overrides) {
    var characterOverrides = undefined;
    var sheetOverrides = undefined;
    let wounds = [], edges = [], firearms = [];
    if (overrides) {
        characterOverrides = overrides.character;
        sheetOverrides = overrides.sheet;
        if (overrides.wounds) {
            wounds = overrides.wounds.map(
                (props) => { return woundFactory(props); });
        }
        if (overrides.edges) {
            edges = overrides.edges.map(
                (props) => {return characterEdgeFactory(props)});
        }
        if (overrides.firearms) {
            firearms = overrides.firearms.map(
                (props) => {return firearmFactory(props)});
        }
    }

    var charData = characterFactory(characterOverrides);
    var sheetData = sheetFactory(sheetOverrides);


    var promises = [];

    var jsonResponse = function (json) {
        var promise = Promise.resolve(json);
        promises.push(promise);
        return promise;
    };

    var afterLoad = function (callback) {
        Promise.all(promises).then(function () {
            Promise.all(promises).then(function () {
                Promise.all(promises).then(function () {
                    callback()
                }).catch(function (err) { fail("failed with " + err)});
            }).catch(function (err) { fail("failed with " + err)});
        }).catch(function (err) { fail("failed with " + err)});
    };

    rest.getData.mockImplementation(function (url) {
        if (url === "/rest/sheets/1/") {
            return jsonResponse(sheetData);
        } else if (url === "/rest/characters/2/") {
            return jsonResponse(charData);
        } else if (url === "/rest/characters/2/characterskills/") {
            return jsonResponse([]);
        } else if (url === "/rest/characters/2/characteredges/") {
            return jsonResponse(edges);
        } else if (url === "/rest/characters/2/wounds/") {
            return jsonResponse(wounds);
        } else if (url === "/rest/skills/campaign/2/") {
            return jsonResponse([]);
        } else if (url === "/rest/weapontemplates/campaign/2/") {
            return jsonResponse([]);
        } else if (url === "/rest/weaponqualities/campaign/2/") {
            return jsonResponse([]);
        } else if (url === "/rest/weapons/campaign/2/") {
            return jsonResponse([]);
        } else if (url === "/rest/sheets/1/sheetfirearms/") {
            return jsonResponse(firearms);
        } else if (url === "/rest/sheets/1/sheetweapons/") {
            return jsonResponse([]);
        } else if (url === "/rest/sheets/1/sheetrangedweapons/") {
            return jsonResponse([]);
        } else if (url === "/rest/rangedweapontemplates/campaign/2/") {
            return jsonResponse([]);
        } else if (url === "/rest/rangedweapons/campaign/2/") {
            return jsonResponse([]);
        } else if (url === "/rest/sheets/1/sheettransienteffects/") {
            return jsonResponse([]);
        } else if (url === "/rest/transienteffects/campaign/2/") {
            return jsonResponse([]);
        } else if (url === "/rest/sheets/1/inventory/") {
            return jsonResponse([]);
        } else if (url === "/rest/sheets/1/sheetarmor/") {
            return jsonResponse([]);
        } else if (url === "/rest/sheets/1/sheethelm/") {
            return jsonResponse([]);
        } else if (url === "/rest/sheets/1/sheetmiscellaneousitems/") {
            return jsonResponse([]);
        } else if (url === "/rest/miscellaneousitems/campaign/2/") {
            return jsonResponse([]);
        } else if (url === "/rest/edgelevels/campaign/2/") {
            return jsonResponse([]);
        } else if (url.match(new RegExp('/rest/ammunition/firearm/.*/'))) {
            return jsonResponse([]);
        } else if (url ===  "/rest/scopes/campaign/2/") {
            return jsonResponse([]);
        } else {
            /* Throwing errors here do not cancel the test. */
            fail("this is an unsupported url:" + url);
        }
    });
    var table = TestUtils.renderIntoDocument(
        <StatBlock url="/rest/sheets/1/"/>
    );

    table.afterLoad = afterLoad;
    table.loaded = Promise.all(promises);
    return table;
};

var statBlockFactory = function (overrides) {
    "use strict";
    var table = statBlockTreeFactory(overrides);
    var statBlock = TestUtils.findRenderedComponentWithType(table,
        StatBlock);
    statBlock.afterLoad = table.afterLoad;
    statBlock.loaded = table.loaded;
    return statBlock;
};

var skillHandlerFactory = function (givenProps) {
    if (!givenProps) {
        givenProps = {};
    }
    var edgeList = [], skills = [], allSkills = [], effects = [], wounds = [];

    var skillMap = {};
    if (givenProps.allSkills) {
        for (let sk of givenProps.allSkills) {
            var newSkill = skillFactory(sk);
            allSkills.push(newSkill);
            skillMap[newSkill.name] = newSkill;
        }
    }
    if (givenProps.skills) {
        for (let sk of givenProps.skills) {
            var skill = skillFactory(sk.skill);
            if (!(skill.name in skillMap)) {
                allSkills.push(skill);
            } else {
                skill = skillMap[skill.name];
            }
            var charSkill = characterSkillFactory(
                Object.assign({}, sk, {skill: skill.name}));
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
    var handlerProps = {
        character: characterFactory(
            Object.assign({}, givenProps.character)),
        edges: edgeList,
        effects: effects,
        characterSkills: skills, allSkills: allSkills,
        wounds: wounds,
        armor: armor, helm: helm
    };
    if (givenProps.weightCarried) {
        handlerProps.weightCarried = givenProps.weightCarried;
    }
    return new SkillHandler(handlerProps);
};

module.exports = {
    characterFactory: characterFactory,
    sheetFactory: sheetFactory,
    statBlockFactory: statBlockFactory,
    statBlockTreeFactory: statBlockTreeFactory,
    characterSkillFactory: characterSkillFactory,
    skillFactory: skillFactory,
    edgeLevelFactory: edgeLevelFactory,
    edgeFactory: edgeFactory,
    characterEdgeFactory: characterEdgeFactory,
    ammunitionFactory: ammunitionFactory,
    scopeFactory: scopeFactory,
    baseFirearmFactory: baseFirearmFactory,
    firearmControlPropsFactory: firearmControlPropsFactory,
    magazineFactory: magazineFactory,
    firearmFactory: firearmFactory,
    weaponTemplateFactory: weaponTemplateFactory,
    weaponQualityFactory: weaponQualityFactory,
    weaponFactory: weaponFactory,
    rangedWeaponFactory: rangedWeaponFactory,
    transientEffectFactory: transientEffectFactory,
    sheetTransientEffectFactory: sheetTransientEffectFactory,
    inventoryEntryFactory: inventoryEntryFactory,
    armorTemplateFactory: armorTemplateFactory,
    armorQualityFactory: armorQualityFactory,
    armorFactory: armorFactory,
    miscellaneousItemFactory: miscellaneousItemFactory,
    sheetMiscellaneousItemFactory: sheetMiscellaneousItemFactory,
    skillHandlerFactory: skillHandlerFactory,
    woundFactory: woundFactory
};