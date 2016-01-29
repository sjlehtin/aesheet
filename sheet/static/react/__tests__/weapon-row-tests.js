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
            allSkills: [
                factories.skillFactory({
                    name: "Weapon combat",
                    stat: "mov"
                }),
                factories.skillFactory({
                    name: "Sword",
                    stat: "mov"
                })
            ],
            stats: {mov: 45}
        };
        if (givenProps && 'handlerProps' in givenProps) {
            handlerProps = Object.assign(handlerProps,
                givenProps.handlerProps);
            delete givenProps.handlerProps;
        }
        handlerProps.stats = factories.statsFactory(handlerProps.stats);

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
        var firearm = getWeaponRow({
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
        expect(firearm.skillCheck()).toEqual(65);
    });

    it("calculates correct ROA for full", function () {
        var firearm = getWeaponRow({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Weapon combat",
                    level: 3
                })]
            },
            weapon: factories.weaponFactory({
                base: {base_skill: "Weapon combat", roa: "1.5"}})
        });
        expect(firearm.roa()).toBeCloseTo(1.95, 2);
    });

    it("calculates correct ROA for a large weapon", function () {
        var firearm = getWeaponRow({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Weapon combat",
                    level: 0
                })]
            },
            weapon: factories.weaponFactory({
                base: {base_skill: "Weapon combat", roa: "1.5"},
                size: 2})
        });
        expect(firearm.roa()).toBeCloseTo(1.35, 2);
    });

    it("calculates very high two-weapon style effect correctly", function () {
        // TODO: Even 6th level TWS should only counter the PRI penalty,
        // not give an actual bonus.
    });
});