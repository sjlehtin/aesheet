var statsFactory = function (overrideStats) {
    var _baseStats = {
        cha: 45
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

module.exports = {characterSkillFactory: characterSkillFactory,
    skillFactory: skillFactory,
    statsFactory: statsFactory}