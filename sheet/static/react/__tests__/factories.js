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

module.exports = {characterSkillFactory: characterSkillFactory,
    skillFactory: skillFactory,
    statsFactory: statsFactory,
    firearmFactory: firearmFactory
};