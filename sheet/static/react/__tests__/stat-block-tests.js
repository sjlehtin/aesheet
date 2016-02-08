jest.dontMock('../StatBlock');
jest.dontMock('../StatRow');
jest.dontMock('../XPControl');
jest.dontMock('../AddSPControl');
jest.dontMock('../NoteBlock');
jest.dontMock('../InitiativeBlock');
jest.dontMock('../Loading');
jest.dontMock('../SkillTable');
jest.dontMock('../SkillRow');
jest.dontMock('../AddSkillControl');
jest.dontMock('../SkillHandler');
jest.dontMock('../StatHandler');
jest.dontMock('../WeaponRow');
jest.dontMock('../RangedWeaponRow');
jest.dontMock('../AddWeaponControl');
jest.dontMock('../AddRangedWeaponControl');
jest.dontMock('../FirearmControl');
jest.dontMock('../AddFirearmControl');
jest.dontMock('../TransientEffectRow');
jest.dontMock('../AddTransientEffectControl');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

var factories = require('./factories');

const StatBlock = require('../StatBlock').default;
const NoteBlock = require('../NoteBlock').default;
const AddSPControl = require('../AddSPControl').default;

describe('stat block', function() {
    "use strict";

    var promises;

    var sheetDataFactory = function (statOverrides) {
        var _sheetData = {
            id: 1,
            character: 2,
            "weight_carried": "0.00",
            "mod_fit": 0,
            "mod_ref": 0,
            "mod_lrn": 0,
            "mod_int": 0,
            "mod_psy": 0,
            "mod_wil": 0,
            "mod_cha": 0,
            "mod_pos": 0,
            "mod_mov": 0,
            "mod_dex": 0,
            "mod_imm": 0
        };

        return Object.assign(_sheetData, statOverrides);
    };

    var edgeFactory = function (statOverrides) {
        var _edgeLevelData = {
            "id": 1,
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
            "run_multiplier": 0.0,
            "swim_multiplier": 0.0,
            "climb_multiplier": 0.0,
            "fly_multiplier": 0.0,
            "level": 1,
            "cost": 2.0,
            "requires_hero": false,
            "edge": "Toughness",
            "skill_bonuses": []
        };
        return Object.assign(_edgeLevelData, statOverrides);
    };

    var jsonResponse = function (json) {
        var promise = Promise.resolve(json);
        promises.push(promise);
        return promise;
    };

    var getStatBlock = function (charData, sheetData) {
        rest.getData.mockImplementation(function (url) {
            if (url === "/rest/sheets/1/") {
                return jsonResponse(sheetData);
            } else if (url === "/rest/characters/2/") {
                return jsonResponse(charData);
            } else if (url === "/rest/characters/2/characterskills/") {
                return jsonResponse([]);
            } else if (url === "/rest/skills/campaign/2/") {
                return jsonResponse([]);
            } else if (url === "/rest/weapontemplates/campaign/2/") {
                return jsonResponse([]);
            } else if (url === "/rest/weaponqualities/campaign/2/") {
                return jsonResponse([]);
            } else if (url === "/rest/weapons/campaign/2/") {
                return jsonResponse([]);
            } else if (url === "/rest/sheets/1/sheetfirearms/") {
                return jsonResponse([]);
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
            } else {
                /* Throwing errors here do not cancel the test. */
                fail("this is an unsupported url:" + url);
            }
        });
        var table = TestUtils.renderIntoDocument(
            <StatBlock url="/rest/sheets/1/"/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            StatBlock);
    };

    beforeEach(function () {
        rest.getData = jest.genMockFunction();
        rest.patch = jest.genMockFunction();
        promises = [];
    });

    var getAllArgsByIndex = function (mockCalls, ind) {
        var list = [];
        for (let call of mockCalls) {
            list.push(call[ind]);
        }
        return list;
    };

    it('fetched initial data', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        expect(block.state.char).toBe(undefined);

        Promise.all(promises).then(function () {
            expect(block.state.sheet).not.toBe(undefined);
            expect(block.state.url).not.toBe(undefined);
            expect(getAllArgsByIndex(rest.getData.mock.calls, 0)).toContain('/rest/sheets/1/');

            Promise.all(promises).then(function () {
                expect(getAllArgsByIndex(rest.getData.mock.calls, 0))
                    .toContain('/rest/characters/2/');

                Promise.all(promises).then(function () {
                    /* TODO: Ridiculoso! */
                    expect(block.state.char).not.toBe(undefined);
                    done();
                });
            }).catch(function (err) {
                throw Error(err);
            });
        }).catch(function (err) {
            throw Error(err);
        });
    });


    var afterLoad = function (callback) {
        Promise.all(promises).then(function () {
            Promise.all(promises).then(function () {
                Promise.all(promises).then(function () {
                    callback()
                }).catch(function (err) { fail("failed with " + err)});
            }).catch(function (err) { fail("failed with " + err)});
        }).catch(function (err) { fail("failed with " + err)});
    };

    it('calculates MOV', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());

        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            var effStats = block.getStatHandler().getEffStats();
            expect(baseStats.mov).toEqual(50);
            expect(effStats.mov).toEqual(50);
            done();
        });
    });

    it('calculates DEX', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());

        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            var effStats = block.getStatHandler().getEffStats();
            expect(baseStats.dex).toEqual(52);
            expect(effStats.dex).toEqual(52);
            done();
        });
    });

    it('calculates IMM', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());

        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            var effStats = block.getStatHandler().getEffStats();
            expect(baseStats.imm).toEqual(45);
            expect(effStats.imm).toEqual(45);
            done();
        });
    });

    it('calculates stamina', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());

        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            expect(block.stamina(baseStats)).toEqual(26);
            done();
        });
    });

    it('calculates stamina with bought stamina', function (done) {
        var block = getStatBlock(factories.characterFactory({bought_stamina: 5}),
            sheetDataFactory());

        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            expect(block.stamina(baseStats)).toEqual(31);
            done();
        });
    });

    it('calculates mana', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            expect(block.mana(baseStats)).toEqual(24);
            done();
        });
    });

    it('calculates mana with bought mana', function (done) {
        var block = getStatBlock(factories.characterFactory({bought_mana: 5}),
            sheetDataFactory());
        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            expect(block.mana(baseStats)).toEqual(29);
            done();
        });
    });

    it('calculates body upwards', function (done) {
        var block = getStatBlock(factories.characterFactory({cur_fit: 41}),
            sheetDataFactory());
        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            expect(block.baseBody(baseStats)).toEqual(11);
            done();
        });
    });

    it('calculates body', function (done) {
        var block = getStatBlock(factories.characterFactory({cur_fit: 39}),
            sheetDataFactory());
        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            expect(block.baseBody(baseStats)).toEqual(10);
            done();
        });
    });

    it('handles edge addition', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleEdgeAdded(edgeFactory({name: "Toughness", level: 2}));
            expect(Object.keys(block.state.edges).length).toBe(1);
            expect(block.state.edges.Toughness).not.toBe(undefined);
            expect(block.state.edges.Toughness.level).toEqual(2);
            done();
        });
    });

    it('handles a list of edges to pass to child components', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            expect(block.state.edgeList.length).toBe(0);
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 3}));
            expect(block.state.edgeList.length).toBe(1);
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 3}));
            expect(block.state.edgeList.length).toBe(2);
            done();
        });
    });

    it('handles edge point calculation', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            expect(block.state.edgesBought).toEqual(0);
            block.handleEdgeAdded(edgeFactory({
                edge: "Toughness", level: 2, cost: 4}));
            block.handleEdgeAdded(edgeFactory({
                edge: "Acute Touch", level: 1, cost: 1}));
            expect(block.state.edgesBought).toEqual(5);
            done();
        });
    });

    xit('handles edge removal');
    xit('handles edge point calculation after edge removal');

    it('can indicate toughness', function (done) {
        var block = getStatBlock(factories.characterFactory({cur_fit: 40}),
            sheetDataFactory());
        afterLoad(function () {
            var baseStats = block.getStatHandler().getBaseStats();
            expect(block.toughness()).toEqual(0);
            block.handleEdgeAdded(edgeFactory({"Toughness": 1}));
            expect(block.toughness()).toEqual(1);
            expect(block.baseBody(baseStats)).toEqual(10);
            done();
        });
    });

    it('can indicate stamina recovery', function (done) {
        var block = getStatBlock(factories.characterFactory(),
            sheetDataFactory());
        afterLoad(function () {
            var effStats = block.getStatHandler().getEffStats();
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 1}));
            expect(block.staminaRecovery(effStats)).toEqual('1d6/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 2}));
            expect(block.staminaRecovery(effStats)).toEqual('2d6/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 3}));
            expect(block.staminaRecovery(effStats)).toEqual('4d6/8h');
            done();
        });
    });

    it('can indicate stamina recovery with high stat', function (done) {
        var block = getStatBlock(factories.characterFactory({cur_fit: 75}),
            sheetDataFactory());
        afterLoad(function () {
            var effStats = block.getStatHandler().getEffStats();
            expect(block.staminaRecovery(effStats)).toEqual('1/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 1}));
            expect(block.staminaRecovery(effStats)).toEqual('1+1d6/8h');
            done();
        });
    });

    it('can indicate mana recovery', function (done) {
        var block = getStatBlock(factories.characterFactory(),
            sheetDataFactory());
        afterLoad(function () {
            var effStats = block.getStatHandler().getEffStats();
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 1}));
            expect(block.manaRecovery(effStats)).toEqual('2d6/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 2}));
            expect(block.manaRecovery(effStats)).toEqual('4d6/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 3}));
            expect(block.manaRecovery(effStats)).toEqual('8d6/8h');
            done();
        });
    });

    it('can indicate mana recovery with high stat', function (done) {
        var block = getStatBlock(factories.characterFactory({cur_cha: 70}),
            sheetDataFactory());
        afterLoad(function () {
            var effStats = block.getStatHandler().getEffStats();
            expect(block.manaRecovery(effStats)).toEqual('2/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 1}));
            expect(block.manaRecovery(effStats)).toEqual('2+2d6/8h');
            done();
        });
    });

    it('can indicate body healing', function (done) {
        var block = getStatBlock(factories.characterFactory(),
            sheetDataFactory());
        afterLoad(function () {
            expect(block.bodyHealing()).toEqual('3/16d');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 3}));
            expect(block.bodyHealing()).toEqual('3/2d');
            done();
        });
    });

    it('handles modifications of stats from child components', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleModification("fit", 40, 41);
            var baseStats = block.getStatHandler().getBaseStats();
            expect(baseStats.mov).toEqual(51);
            done();
        });
    });

    it('handles modifications of xp from child components', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleXPMod("total_xp", 0, 231);
            expect(block.state.char.total_xp).toEqual(231);
            done();
        });
    });

    it('contains a NoteBlock component', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 1, notes: "Foofaafom"}));

            var noteBlock = TestUtils.findRenderedComponentWithType(
                block, NoteBlock);
            expect(TestUtils.isCompositeComponent(noteBlock)).toBe(true);
            done();
        });
    });

    it('should not contain a NoteBlock without edges', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {

            var noteBlocks = TestUtils.scryRenderedComponentsWithType(
                block, NoteBlock);
            expect(noteBlocks.length).toEqual(0);
            done();
        });
    });

    it('should not contain a NoteBlock with only edges without notes', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 1, notes: ""}));

            var noteBlocks = TestUtils.scryRenderedComponentsWithType(
                block, NoteBlock);
            expect(noteBlocks.length).toEqual(0);
            done();
        });
    });

    it('calculate runMultiplier with an edge', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleEdgeAdded(edgeFactory({edge: "Natural Runner",
                level: 1, run_multiplier: 1.5}));

            expect(block.runMultiplier()).toEqual(1.5);
            done();
        });
    });

    it('have a decent default for runMultiplier', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            expect(block.runMultiplier()).toEqual(1);
            done();
        });
    });

    it('can calculate all effective stats', function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos", "mov", "dex", "imm"];
            for (var ii = 0; ii < stats.length; ii++) {
                expect(typeof(block.getStatHandler().getEffStats().ref))
                    .toEqual("number");
            }
            expect(block.getStatHandler().getEffStats().ref).toEqual(60);
            done();
        });
    });

    it("handles skill removal", function (done) {
        var skill = factories.characterSkillFactory({
            id: 2, skill: "Weaponsmithing", level: 1 });
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleSkillsLoaded([skill,
                factories.characterSkillFactory({
                    id: 1, skill: "Gardening",
                    level: 3
                })
            ]);

            var promise = Promise.resolve({});
            rest.delete.mockReturnValue(promise);

            block.handleCharacterSkillRemove({id: 1});

            expect(rest.delete.mock.calls[0][0]).toEqual(
                '/rest/characters/2/characterskills/1/');

            promise.then(() => {
                expect(block.state.characterSkills).toEqual([skill]);
                done();
            }).catch((err) => fail(err));
        });
    });

    it("handles skill addition", function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleSkillsLoaded([], []);

            var expectedSkill = {
                id: 1, skill: "Gardening",
                level: 3
            };
            var promise = Promise.resolve(expectedSkill);
            rest.post.mockReturnValue(promise);

            var skill = {
                skill: "Gardening",
                level: 3
            };
            block.handleCharacterSkillAdd(skill);

            expect(rest.post.mock.calls[0][0]).toEqual(
                '/rest/characters/2/characterskills/');
            expect(rest.post.mock.calls[0][1]).toEqual({
                skill: "Gardening",
                level: 3
            });

            promise.then(() => {
                expect(block.state.characterSkills).toEqual([expectedSkill]);
                done();
            }).catch((err) => fail(err));
        });
    });

    it("handles skill level changes", function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {

            var skillList = [
                factories.characterSkillFactory({
                    id: 2, skill: "Weaponsmithing",
                    level: 1
                }),
                factories.characterSkillFactory({
                    id: 1, skill: "Gardening",
                    level: 3
                })
            ];
            block.handleSkillsLoaded(skillList);

            var promise = Promise.resolve({
                id: 1, skill: "Gardening",
                level: 2
            });
            rest.patch.mockReturnValue(promise);
            block.handleCharacterSkillModify({
                id: 1, skill: "Gardening",
                level: 2
            });
            expect(rest.patch.mock.calls[0][0]).toEqual(
                '/rest/characters/2/characterskills/1/');
            expect(rest.patch.mock.calls[0][1]).toEqual({
                id: 1, skill: "Gardening",
                level: 2
            });

            promise.then(() => {
                var listCopy = skillList.map((elem) => {
                    return Object.assign({}, elem)
                });
                listCopy[1].level = 2;
                expect(block.state.characterSkills).toEqual(listCopy);
                done();
            }).catch((err) => {
                fail(err)
            });
        });
    });

    it ("can add firearms", function () {
        // TODO
    });

    it ("can remove firearms", function (done) {
        var block = getStatBlock(factories.characterFactory(), sheetDataFactory());
        afterLoad(function () {
            var skillList = [
                factories.characterSkillFactory({
                    id: 1, skill: "Handguns",
                    level: 1
                })
            ];
            block.handleSkillsLoaded(skillList);
            block.handleFirearmsLoaded([factories.firearmFactory({id: 3}),
            factories.firearmFactory({id: 5})]);

            var promise = Promise.resolve({});
            rest.delete.mockReturnValue(promise);

            block.handleFirearmRemoved({id: 3});

            promise.then(() => {
                expect(block.state.firearmList.length).toEqual(1);
                expect(block.state.firearmList[0].id).toEqual(5);

                expect(getAllArgsByIndex(rest.delete.mock.calls, 0)).toContain(
                    '/rest/sheets/1/sheetfirearms/3/');
                done();
            }).catch((err) => {fail(err)});
        });
    });

    it ("can add weapons", function () {
        // TODO
    });

    it ("can remove weapons", function () {
        // TODO
    });

    // TODO: Add system tests to check integration through this up till
    // SkillRow.

    it("handles age SP additions", function (done) {
        var block = getStatBlock(factories.characterFactory({gained_sp: 4}), sheetDataFactory());
        afterLoad(function () {

            var promise = Promise.resolve({});
            rest.patch.mockReturnValue(promise);

            var addSPControl = TestUtils.findRenderedComponentWithType(
                block, AddSPControl);
            expect(addSPControl.props.initialAgeSP).toEqual(6);

            block.handleAddGainedSP(4);

            expect(rest.patch.mock.calls[0][0]).toEqual(
                '/rest/characters/2/');
            expect(rest.patch.mock.calls[0][1]).toEqual({gained_sp: 8});
            promise.then(() => {
                expect(block.state.char.gained_sp).toEqual(8);
                done();
            }).catch(err => fail(err));
        });
    });

});
