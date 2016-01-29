var statsFactory = function (overrideStats) {
    var _baseStats = {
        fit: 45,
        ref: 45,
        lrn: 45,
        int: 45,
        wil: 45,
        psy: 45,
        cha: 45,
        pos: 45,
        dex: 45,
        mov: 45,
        imm: 45
    };
    return Object.assign(_baseStats, overrideStats);
};

var skillFactory = function (overrideFields) {
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
    return Object.assign(_baseSkill, overrideFields);
};

// Test pollute each other, need some reset functionality.
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

var firearmFactory = function (overrideFields) {
    "use strict";
    var firearm ={
        "id": 5,
        "base": {
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
            "weapon_class_modifier": "6.00",
            "tech_level": 4,
            "base_skill": "Handguns",
            "skill": null,
            "skill2": null
        },
        "ammo": {
            "id": 256,
            "num_dice": 1,
            "dice": 6,
            "extra_damage": 0,
            "leth": 5,
            "plus_leth": 0,
            "label": "9Pb",
            "type": "P",
            "bullet_type": "FMJ",
            "bypass": 0,
            "weight": "7.500",
            "velocity": 440,
            "tech_level": 4
        }
    };

    var overrides = Object.assign({}, overrideFields ? overrideFields : {});
    if ('ammo' in overrides) {
        firearm.ammo = Object.assign(firearm.ammo, overrideFields.ammo);
        delete overrides.ammo;
    }
    if ('base' in overrides) {
        firearm.base = Object.assign(firearm.base, overrideFields.base);
        delete overrides.base;
    }

    return Object.assign(firearm, overrides);
};

var weaponFactory = function (overrideFields) {
    "use strict";
    var weapon ={
        "id": 3,
        "name": "Broadsword",
        "description": "",
        "size": 1,
        "quality": {
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
        },
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
    
    var overrides = Object.assign({}, overrideFields ? overrideFields : {});
    if ('base' in overrides) {
        weapon.base = Object.assign(weapon.base, overrideFields.base);
        delete overrides.base;
    }

    if ('quality' in overrides) {
        weapon.quality = Object.assign(weapon.quality, overrideFields.quality);
        delete overrides.quality;
    }
    return Object.assign(weapon, overrides);
};

module.exports = {characterSkillFactory: characterSkillFactory,
    skillFactory: skillFactory,
    statsFactory: statsFactory,
    firearmFactory: firearmFactory,
    weaponFactory: weaponFactory,
};