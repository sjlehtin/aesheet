jest.dontMock('../WeaponRow');
jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const WeaponRow = require('../WeaponRow').default;
const SkillHandler = require('../SkillHandler').default;

var rest = require('sheet-rest');

var factories = require('./factories');

describe('WeaponRow', function() {
    "use strict";

    var getWeaponRow = function (givenProps) {
        var handlerProps = {
            characterSkills: [],
            edges: [],
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

        var edges = [];
        for (let edge of handlerProps.edges) {
            edges.push(factories.edgeLevelFactory(edge));
        }
        handlerProps.edges = edges;

        var props = {
            weapon: factories.weaponFactory(
                {base: {base_skill: "Weapon combat"}}),
            // TODO: use factories.skillHandlerFactory
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
        var props = {roa: "1.5", size: 1, ccv: 10, skillLevel: 0, fit: 45,
            int: 45, extraSkills: [], edges: [], quality: {}, base: {}};
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

        var base = Object.assign({
            base_skill: "Weapon combat", roa: props.roa,
            ccv: props.ccv, num_dice: 2, dice: 6, extra_damage: 2,
            leth: 5, plus_leth: 1, defense_leth: 6, durability: 7,
            draw_initiative: -3, dp: 7}, props.base);

        return getWeaponRow({
            handlerProps: {
                characterSkills: skills,
                edges: props.edges,
                stats: {mov: 45, int: props.int, fit: props.fit}
            },
            weapon: factories.weaponFactory({
                base: base,
                quality: props.quality,
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

    it("takes Single-weapon style into account", function () {
        var weapon = getWeapon({
            extraSkills: [{skill: "Single-weapon style", level: 3}]
        });
        expect(weapon.roa(WeaponRow.FULL)).toBeCloseTo(1.65, 2);
    });

    it("stacks SWS and WC", function () {
        var weapon = getWeapon({
            skillLevel: 5,
            extraSkills: [{skill: "Single-weapon style", level: 3}]
        });
        expect(weapon.roa(WeaponRow.FULL)).toBeCloseTo(2.47, 2);
    });

    it("calculates skill checks for full use", function () {
        var weapon = getWeapon();
        expect(weapon.skillChecks([0.5, 1, 2, 3])).toEqual([60, 55, 38, 25]);
    });

    it("calculates skill checks for primary use", function () {
        var weapon = getWeapon();
        expect(weapon.skillChecks([0.5, 1, 2, 3],
            {useType: WeaponRow.PRI})).toEqual([60, 55, 33, null]);
    });

    it("calculates skill checks for secondary use", function () {
        var weapon = getWeapon();
        expect(weapon.skillChecks([0.5, 1, 2, 3],
            {useType: WeaponRow.SEC})).toEqual([35, 30, 0, null]);
    });

    it("takes Ambidexterity into account in secondary skill checks", function () {
        var weapon = getWeapon({edges: [{edge: {name: "Ambidexterity"}, level: 3}]});
        expect(weapon.skillChecks([0.5, 1, 2, 3],
            {useType: WeaponRow.SEC})).toEqual([50, 45, 15, null]);
    });

    it("counters penalty for high INT", function () {
        var weapon = getWeapon({int: 66});
        expect(weapon.skillChecks([0.5, 1, 2, 3])).toEqual([60, 55, 45, 32]);
    });

    it("calculates initiatives for full use", function () {
        var weapon = getWeapon();
        expect(weapon.initiatives([0.5, 1, 2, 3],
            {useType: WeaponRow.FULL})).toEqual([6, 6, -4, -14]);
    });

    it("calculates initiatives for primary use", function () {
        var weapon = getWeapon();
        expect(weapon.initiatives([0.5, 1, 2, 3],
            {useType: WeaponRow.PRI})).toEqual([6, 5, -7, null]);
    });

    it("calculates initiatives for secondary use", function () {
        var weapon = getWeapon();
        expect(weapon.initiatives([0.33, 1, 2, 3],
            {useType: WeaponRow.SEC})).toEqual([6, 4, -11, null]);
    });

    it("calculates defense initiatives for full use", function () {
        var weapon = getWeapon();
        expect(weapon.defenseInitiatives([1, 2, 3],
            {useType: WeaponRow.FULL})).toEqual([9, -1, -11]);
    });

    it("calculates defense initiatives for primary use", function () {
        var weapon = getWeapon();
        expect(weapon.defenseInitiatives([1, 2, 3],
            {useType: WeaponRow.PRI})).toEqual([9, -3, -15]);
    });

    it("calculates defense initiatives for secondary use", function () {
        var weapon = getWeapon();
        expect(weapon.defenseInitiatives([1, 2, 3],
            {useType: WeaponRow.SEC})).toEqual([9, -6, -21]);
    });

    it("calculates damage", function () {
        var weapon = getWeapon();
        expect(weapon.renderDamage({useType: WeaponRow.FULL})).toEqual("2d6+2/5+1");
    });

    it("calculates damage with odd number fit", function () {
        var weapon = getWeapon({fit: 58});
        expect(weapon.renderDamage({useType: WeaponRow.FULL})).toEqual("2d6+3/5+1");
    });

    it("calculates damage with quality", function () {
        var weapon = getWeapon({quality: {damage: 3, leth: 1,
            plus_leth: 1}});
        expect(weapon.renderDamage({useType: WeaponRow.FULL})).toEqual("2d6+5/6+2");
    });

    it("calculates defense damage", function () {
        var weapon = getWeapon();
        expect(weapon.renderDamage({useType: WeaponRow.FULL,
            defense: true})).toEqual("2d6+2/6");
    });

    it("calculates defense damage with quality", function () {
        var weapon = getWeapon({quality: {damage: 3, leth: 1,
            plus_leth: 1, defense_leth: 1}});
        expect(weapon.renderDamage({useType: WeaponRow.FULL, defense: true}))
            .toEqual("2d6+5/7");
    });

    // Damage capping
    // Lethality capping
    it("caps damage and lethality", function () {
        var weapon = getWeapon({quality: {damage: 1}, base: {num_dice: 1}});
        expect(weapon.renderDamage({useType: WeaponRow.FULL})).toEqual("1d6+3/5+1");
        weapon = getWeapon({quality: {damage: 1}, base: {num_dice: 1},
            fit: 180});
        expect(weapon.renderDamage({useType: WeaponRow.FULL}))
            .toEqual("1d6+12/8+1");
    });

    it("takes martial arts expertise into account", function () {
        var weapon = getWeapon({quality: {damage: 1}, base: {num_dice: 1},
        extraSkills: [{skill: "Martial arts expertise", level: 6}]});
        expect(weapon.renderDamage({useType: WeaponRow.FULL}))
            .toEqual("1d6+7/6+1");
    });

    // Size

    it("takes size into account with damage", function () {
        var weapon = getWeapon({size: 2, quality: {damage: 1}});
        expect(weapon.renderDamage({useType: WeaponRow.FULL})).toEqual("4d6+5/6+1");
    });

    it("takes size into account with defense damage", function () {
        var weapon = getWeapon({size: 2, base: {defense_leth: 6},
            quality: {damage: 1}});
        expect(weapon.renderDamage({useType: WeaponRow.FULL,
            defense: true})).toEqual("4d6+5/7");
    });

    it("takes size into account with durability", function () {
        var weapon = getWeapon({size: 2});
        expect(weapon.durability()).toEqual(9);
    });

    it("takes size into account with damage points", function () {
        var weapon = getWeapon({size: 2});
        expect(weapon.dp()).toEqual(14);
        weapon = getWeapon({size: 3});
        expect(weapon.dp()).toEqual(28);
    });

    it("takes size into account with draw initiative", function () {
        var weapon = getWeapon({size: 2});
        expect(weapon.drawInitiative()).toEqual(-5);
    });

    it("takes size into account with ccv", function () {
        var weapon = getWeapon({size: 2});
        expect(weapon.ccv()).toEqual(15);
        weapon = getWeapon({size: 3});
        expect(weapon.ccv()).toEqual(20);
    });

    it("takes size into account with bypass", function () {
        var weapon = getWeapon({size: 2});
        expect(weapon.bypass()).toEqual(-2);
    });

    // Weapons requiring one-handed use cannot be used PRI or SEC
    // without the skill.
    it("observes weapon One-handed use requirement", function () {
        var weapon = getWeapon({size: 2, base: {skill2: "One-handed use"}});

        var rows = ReactDOM.findDOMNode(weapon).querySelectorAll('tbody tr');
        expect(rows[1].textContent).not.toContain("Unskilled");
        expect(rows[2].textContent).toContain("Unskilled");
        expect(rows[3].textContent).toContain("Unskilled");
    });

    // Special damage

    // TODO: Lance damage on charge.


});