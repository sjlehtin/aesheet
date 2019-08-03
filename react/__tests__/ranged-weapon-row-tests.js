jest.dontMock('../RangedWeaponRow');
jest.dontMock('../WeaponRow');
jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

const RangedWeaponRow = require('../RangedWeaponRow').default;
const SkillHandler = require('../SkillHandler').default;

var rest = require('../sheet-rest');

var factories = require('./factories');

describe('RangedWeaponRow', function() {
    "use strict";

    var getWeaponRow = function (givenProps) {
        var handlerProps = {
            characterSkills: [],
            edges: [],
            stats: {mov: 45}
        };

        if (!givenProps) {
            givenProps = {};
        }

        if ('handlerProps' in givenProps) {
            handlerProps = Object.assign(handlerProps,
                givenProps.handlerProps);
            delete givenProps.handlerProps;
        }

        var weaponProps = givenProps.weaponProps;
        delete givenProps.weaponProps;

        var weapon = factories.rangedWeaponFactory(
                Object.assign({base: {base_skill: "Bow"}},
                    weaponProps ? weaponProps : {}));

        var allSkills = [];
        for (let skill of handlerProps.skills) {
            allSkills.push({
                name: skill.skill,
                stat: "dex"});
        }
        var addExtraSkill = function (skill) {
            if (skill) {
                allSkills.push({
                    name: skill,
                    stat: "dex"});
            }
        };

        addExtraSkill(weapon.base.base_skill);
        addExtraSkill(weapon.base.skill);
        addExtraSkill(weapon.base.skill2);

        handlerProps.allSkills = allSkills;

        var props = {
            weapon: weapon,
            skillHandler: factories.skillHandlerFactory(handlerProps)
        };

        props = Object.assign(props, givenProps);
        var table = TestUtils.renderIntoDocument(
            <RangedWeaponRow {...props}/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            RangedWeaponRow);
    };

    it("caps ROF", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 5}],
            },
            weaponProps: {base: {roa: "4", base_skill: "Bow"}}
        });
        expect(weapon.rof()).toEqual(5.0);
    });

    it("takes Rapid archery into account", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0},
                    {skill: "Rapid archery", level: 3}]
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Bow"}}
        });
        expect(weapon.rof()).toEqual(1.65);
    });

    it("ignores Rapid archery for crossbows", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                skills: [
                    {skill: "Bow", level: 0},
                    {skill: "Rapid archery", level: 3}]
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Crossbow"}}
        });
        expect(weapon.rof()).toEqual(1.5);
    });

    it("counters penalties with FIT", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 66}
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Bow"}}
        });
        expect(weapon.skillChecks([1, 2, 3, 4])).toEqual([45, 35, 22, null]);
    });

    it("does not give damage bonus for crossbows for high FIT", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 66}
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Crossbow",
            num_dice: 1, dice: 6, extra_damage: 2, leth: 5, plus_leth: 1}}
        });
        expect(weapon.renderDamage()).toEqual("1d6+2/5+1");
    });

    it("gives damage bonus for bows for high FIT", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 66}
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Bow",
            num_dice: 1, dice: 6, extra_damage: 2, leth: 5, plus_leth: 1}}
        });
        expect(weapon.renderDamage()).toEqual("1d6+4/5+1");
    });

    it("caps FIT bonus", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 190}
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Bow",
            num_dice: 1, dice: 6, extra_damage: 2, leth: 5, plus_leth: 1},
                quality: {max_fit: 100}}
        });
        expect(weapon.renderDamage()).toEqual("1d6+7/6+1");
    });

});