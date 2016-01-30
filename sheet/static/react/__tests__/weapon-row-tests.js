jest.dontMock('../WeaponRow');
jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const WeaponRow = require('../WeaponRow').default;
const SkillTable = require('../SkillTable').default;
const SkillHandler = require('../SkillHandler').default;

var rest = require('sheet-rest');

var factories = require('./factories');

describe('WeaponRow', function() {
    "use strict";

    var getWeaponRow = function (givenProps) {
        var handlerProps = {
            characterSkills: [],
            stats: {mov: 45}
        };
        if (givenProps && 'handlerProps' in givenProps) {
            handlerProps = Object.assign(handlerProps,
                givenProps.handlerProps);
            delete givenProps.handlerProps;
        }

        var allSkills = [];
        for (let skill of handlerProps.characterSkills) {
            allSkills.push(factories.skillFactory({
                name: skill.skill,
                stat: "mov"}));
        }
        handlerProps.stats = factories.statsFactory(handlerProps.stats);
        handlerProps.allSkills = allSkills;

        var props = {
            weapon: factories.weaponFactory(
                {base: {base_skill: "Weapon combat"}}),
            skillHandler: new SkillHandler(handlerProps)
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <WeaponRow {...props}/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            WeaponRow);
    };

    it("can calculate effect of missing specialization skill checks",
        function () {
            var firearm = getWeaponRow({
                handlerProps: {
                    characterSkills: [factories.characterSkillFactory({
                        skill: "Weapon combat",
                        level: 0
                    })]
                },
                weapon: factories.weaponFactory({
                    base: {
                        base_skill: "Weapon combat",
                        skill: "Greatsword",
                        ccv: 15,
                        ccv_unskilled_modifier: -10
                    }
                })
            });
            expect(firearm.skillCheck()).toEqual(50);
        });

    it("notices specializations", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Greatsword",
                    level: 1
                }),
                    factories.characterSkillFactory({
                        skill: "Weapon combat",
                        level: 1
                    })]
            },
            weapon: factories.weaponFactory({
                base: {
                    base_skill: "Weapon combat",
                    skill: "Greatsword",
                    ccv: 15,
                    ccv_unskilled_modifier: -10
                }
            })
        });
        expect(weapon.skillCheck()).toEqual(65);
    });

    it("calculates correct ROA for full", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Weapon combat",
                    level: 3
                })]
            },
            weapon: factories.weaponFactory({
                base: {base_skill: "Weapon combat", roa: "1.5"}})
        });
        expect(weapon.roa()).toBeCloseTo(1.95, 2);
    });

    var getWeapon = function (givenProps) {
        var props = {roa: "1.5", size: 1, skillLevel: 0, extraSkills: []};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }

        var skills = [factories.characterSkillFactory({
            skill: "Weapon combat",
            level: props.skillLevel
        })];

        for (let skill of props.extraSkills) {
            skills.push(factories.characterSkillFactory(skill));
        }
        return getWeaponRow({
            handlerProps: {
                characterSkills: skills,
            },
            weapon: factories.weaponFactory({
                base: {base_skill: "Weapon combat", roa: props.roa},
                size: props.size})
        });
    };

    it("calculates correct ROA for a large weapon", function () {
        var weapon = getWeapon({size: 2});
        expect(weapon.roa()).toBeCloseTo(1.35, 2);
    });

    it("calculates correct ROA for FULL use", function () {
        var weapon = getWeapon();
        expect(weapon.roa(WeaponRow.FULL)).toBeCloseTo(1.5, 2);
    });

    it("calculates correct ROA for PRI use", function () {
        var weapon = getWeapon();
        expect(weapon.roa(WeaponRow.PRI)).toBeCloseTo(1.25, 2);
    });

    it("calculates correct ROA for SEC use", function () {
        var weapon = getWeapon();
        expect(weapon.roa(WeaponRow.SEC)).toBeCloseTo(1.0, 2);
    });

    it("calculates very high two-weapon style effect correctly", function () {
        // Even 6th level TWS should only counter the PRI penalty,
        // not give an actual bonus.
        var weapon = getWeapon({
            extraSkills: [{skill: "Two-weapon style", level: 6}]
        });
        expect(weapon.roa(WeaponRow.PRI)).toBeCloseTo(1.5, 2);
        expect(weapon.roa(WeaponRow.SEC)).toBeCloseTo(1.3, 2);
    });

    it("caps roa", function () {
        var weapon = getWeapon({skillLevel: 5, roa: 2.0});
        expect(weapon.roa(WeaponRow.FULL)).toBeCloseTo(2.5, 2);
    });

    it("calculates skill checks for full use", function () {
        var weapon = getWeaponRow({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Weapon combat",
                    level: 0
                })]
            },
            weapon: factories.weaponFactory({
                base: {base_skill: "Weapon combat", roa: "1.5", ccv:10}})
        });
        expect(weapon.skillChecks([0.5, 1, 2, 3])).toEqual([60, 55, 38, 25]);
    });

});