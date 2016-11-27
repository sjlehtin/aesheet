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
jest.dontMock('../WeaponRow');
jest.dontMock('../RangedWeaponRow');
jest.dontMock('../AddWeaponControl');
jest.dontMock('../AddRangedWeaponControl');
jest.dontMock('../FirearmControl');
jest.dontMock('../AddFirearmControl');
jest.dontMock('../TransientEffectRow');
jest.dontMock('../AddTransientEffectControl');
jest.dontMock('../Inventory');
jest.dontMock('../InventoryRow');
jest.dontMock('../ArmorControl');
jest.dontMock('../AddArmorControl');
jest.dontMock('../MiscellaneousItemRow');
jest.dontMock('../AddMiscellaneousItemControl');
jest.dontMock('../EdgeRow');
jest.dontMock('../AddCharacterEdgeControl');
jest.dontMock('../CharacterNotes');
jest.dontMock('../MovementRates');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

var factories = require('./factories');
var getAllArgumentsByPosition = require('./testutils').getAllArgumentsByPosition;

const StatBlock = require('../StatBlock').default;
const NoteBlock = require('../NoteBlock').default;
const AddSPControl = require('../AddSPControl').default;
const XPControl = require('../XPControl').default;
const Inventory = require('../Inventory').default;


describe('stat block', function() {
    "use strict";

    it('fetched initial data', function (done) {
        var block = factories.statBlockFactory();
        expect(block.state.char).toBe(undefined);

        block.afterLoad(function () {
            expect(block.state.sheet).not.toBe(undefined);
            expect(block.state.url).not.toBe(undefined);
            expect(getAllArgumentsByPosition(rest.getData.mock.calls, 0)).toContain('/rest/sheets/1/');

            expect(getAllArgumentsByPosition(rest.getData.mock.calls, 0))
                        .toContain('/rest/characters/2/');

            expect(block.state.char).not.toBe(undefined);
            done();
        });
    });

    it('calculates MOV', function (done) {
        var block = factories.statBlockFactory({character: {cur_fit: 49, cur_ref: 51}});

        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            var effStats = block.getSkillHandler().getEffStats();
            expect(baseStats.mov).toEqual(50);
            expect(effStats.mov).toEqual(50);
            done();
        });
    });

    it('calculates DEX', function (done) {
        var block = factories.statBlockFactory({character: {
            cur_int: 49, cur_ref: 51}});

        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            var effStats = block.getSkillHandler().getEffStats();
            expect(baseStats.dex).toEqual(50);
            expect(effStats.dex).toEqual(50);
            done();
        });
    });

    it('calculates IMM', function (done) {
        var block = factories.statBlockFactory({character: {
            cur_fit: 49, cur_psy: 51}});

        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            var effStats = block.getSkillHandler().getEffStats();
            expect(baseStats.imm).toEqual(50);
            expect(effStats.imm).toEqual(50);
            done();
        });
    });

    it('calculates stamina', function (done) {
        var block = factories.statBlockFactory({character: {
            cur_ref: 53, cur_wil: 50}});

        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            expect(block.stamina(baseStats)).toEqual(26);
            done();
        });
    });

    it('calculates stamina with bought stamina', function (done) {
        var block = factories.statBlockFactory({
            character: {
            cur_ref: 53, cur_wil: 50, bought_stamina: 5}});

        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            expect(block.stamina(baseStats)).toEqual(31);
            done();
        });
    });

    it('calculates mana', function (done) {
        var block = factories.statBlockFactory({character: {
            cur_wil: 53, cur_psy: 42}});
        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            expect(block.mana(baseStats)).toEqual(24);
            done();
        });
    });

    it('calculates mana with bought mana', function (done) {
        var block = factories.statBlockFactory({character: {
            cur_wil: 53, cur_psy: 42, bought_mana: 5}});

        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            expect(block.mana(baseStats)).toEqual(29);
            done();
        });
    });

    it('calculates body upwards', function (done) {
        var block = factories.statBlockFactory({
            character: factories.characterFactory({cur_fit: 41})});
        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            expect(block.baseBody(baseStats)).toEqual(11);
            done();
        });
    });

    it('calculates body', function (done) {
        var block = factories.statBlockFactory({
            character: factories.characterFactory({cur_fit: 39})});
        block.afterLoad(function () {
            var baseStats = block.getSkillHandler().getBaseStats();
            expect(block.baseBody(baseStats)).toEqual(10);
            done();
        });
    });

    it('handles edge addition', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {

            var edge = factories.edgeLevelFactory({
                edge: {name: "Toughness"}, level: 2});

            var promise = Promise.resolve({
                id: 300, edge: edge.id, character: 1});
            rest.post.mockReturnValue(promise);

            // Updates character with REST.
            block.handleEdgeAdded(edge);

            promise.then(() => {
                expect(Object.keys(block.state.edgeList).length).toBe(1);
                var skillHandler = getSkillHandler(block);
                expect(skillHandler.edgeLevel('Toughness')).toEqual(2);
                done();
            }).catch((err) => {this.fail("err occurred:", err)});
        });
    });

    it('collects a list of edges while updating with REST', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(block.state.edgeList.length).toBe(0);
            var edge = factories.edgeLevelFactory({
                edge: {name: "Fast Healing"},
                level: 3});
            var promise = Promise.resolve({
                id: 300, edge: edge.id, character: 1});
            rest.post.mockReturnValue(promise);
            block.handleEdgeAdded(edge);

            promise.then(() => {
                expect(block.state.edgeList.length).toBe(1);
                var edge = factories.edgeLevelFactory({edge:
                {name: "Fast Mana recovery"},
                    level: 3});
                var promise = Promise.resolve({
                    id: 300, edge: edge.id, character: 1});
                rest.post.mockReturnValue(promise);

                block.handleEdgeAdded(edge);

                promise.then(() => {
                    expect(block.state.edgeList.length).toBe(2);
                    done();
                }).catch((err) => {this.fail("err occurred:", err)});
            }).catch((err) => {this.fail("err occurred:", err)});

        });
    });

    it('handles edge point calculation', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            var control = TestUtils.findRenderedComponentWithType(block,
                XPControl);
            expect(control.props.edgesBought).toEqual(0);

            addEdge(block, "Toughness", 2, {cost: 4});
            addEdge(block, "Acute Touch", 1, {cost: 1});

            expect(control.props.edgesBought).toEqual(5);
            done();
        });
    });

    xit('should not indicate negative XP with unbought free edges');
    xit('handles edge removal');
    xit('handles edge point calculation after edge removal');


    var getSkillHandler = function (block) {
        // TODO: skills need to be loaded because edges are handled by
        // skillhandler, which requires the skills.  edges should be contained
        // by the stat handler.

        return block.getSkillHandler();
    };

    var addEdge = function (block, edgeName, edgeLevel, props) {
        if (!props){
            props = {};
        }
        props = Object.assign({ edge: {name: edgeName},
                                level: edgeLevel }, props);
        var edgeList = [factories.characterEdgeFactory({
                edge: props})];
        if (block.state.characterEdges.length > 0) {
            edgeList = block.state.characterEdges.concat(edgeList);
        }
        block.handleEdgesLoaded(edgeList);
    };

    it('can indicate toughness', function (done) {
        var block = factories.statBlockFactory({
            character: factories.characterFactory({cur_fit: 40})});
        block.afterLoad(function () {
            var skillHandler = getSkillHandler(block);
            expect(block.toughness(skillHandler)).toEqual(0);

            addEdge(block, "Toughness", 1);

            skillHandler = getSkillHandler(block);
            expect(block.toughness(skillHandler)).toEqual(1);
            expect(block.baseBody(skillHandler.getBaseStats())).toEqual(10);
            done();
        });
    });

    it('can indicate stamina recovery', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            var effStats = block.getSkillHandler().getEffStats();

            addEdge(block, "Fast Healing", 1);
            expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('1d6/8h');
            addEdge(block, "Fast Healing", 2);
            expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('2d6/8h');
            addEdge(block, "Fast Healing", 3);
            expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('4d6/8h');
            done();
        });
    });

    it('can indicate stamina recovery with high stat', function (done) {
        var block = factories.statBlockFactory({
            character: {cur_fit: 70, cur_psy: 51}});
        block.afterLoad(function () {
            var effStats = block.getSkillHandler().getEffStats();
            expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('1/8h');
            addEdge(block, "Fast Healing", 1);
            expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('1+1d6/8h');
            done();
        });
    });

    it('can indicate mana recovery', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            var effStats = block.getSkillHandler().getEffStats();
            addEdge(block, "Fast Mana Recovery", 1);
            expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('2d6/8h');
            addEdge(block, "Fast Mana Recovery", 2);
            expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('4d6/8h');
            addEdge(block, "Fast Mana Recovery", 3);
            expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('8d6/8h');
            done();
        });
    });

    it('can indicate mana recovery with high stat', function (done) {
        var block = factories.statBlockFactory({
            character: {cur_cha: 70}});
        block.afterLoad(function () {
            var effStats = block.getSkillHandler().getEffStats();
            expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('2/8h');
            addEdge(block, "Fast Mana Recovery", 1);
            expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('2+2d6/8h');
            done();
        });
    });

    it('can indicate body healing', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(block.bodyHealing(block.getSkillHandler())).toEqual('3/16d');
            addEdge(block, "Fast Healing", 3);
            expect(block.bodyHealing(block.getSkillHandler())).toEqual('3/2d');
            done();
        });
    });

    it('handles modifications of stats from child components', function (done) {
        var block = factories.statBlockFactory({
            character: {cur_ref: 60}});
        block.afterLoad(function () {
            block.handleModification("fit", 40, 41);
            var baseStats = block.getSkillHandler().getBaseStats();
            expect(baseStats.mov).toEqual(51);
            done();
        });
    });

    it('handles modifications of xp from child components', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleXPMod("total_xp", 0, 231);
            expect(block.state.char.total_xp).toEqual(231);
            done();
        });
    });

    it('contains a NoteBlock component', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            addEdge(block, "Fast Healing", 3, {notes: "Foofaafom"});

            var noteBlock = TestUtils.findRenderedComponentWithType(
                block, NoteBlock);
            expect(TestUtils.isCompositeComponent(noteBlock)).toBe(true);
            done();
        });
    });

    it('can calculate all effective stats', function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos", "mov", "dex", "imm"];
            for (var ii = 0; ii < stats.length; ii++) {
                expect(typeof(block.getSkillHandler().getEffStats().ref))
                    .toEqual("number");
            }
            expect(block.getSkillHandler().getEffStats().ref).toEqual(43);
            done();
        });
    });

    it("handles skill removal", function (done) {
        var skill = factories.characterSkillFactory({
            id: 2, skill: "Weaponsmithing", level: 1 });
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleSkillsLoaded([skill,
                factories.characterSkillFactory({
                    id: 1, skill: "Gardening",
                    level: 3
                })
            ], []);

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
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleSkillsLoaded([], []);

            var expectedSkill = {
                id: 1, skill: "Gardening",
                level: 3
            };

            rest.post.mockClear();

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
        var block = factories.statBlockFactory();
        block.afterLoad(function () {

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
            block.handleSkillsLoaded(skillList, []);

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

    // it ("can add firearms", function () {
    //     // TODO
    // });

    it ("can remove firearms", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            var skillList = [
                factories.characterSkillFactory({
                    id: 1, skill: "Handguns",
                    level: 1
                })
            ];
            block.handleSkillsLoaded(skillList, []);
            block.handleFirearmsLoaded([factories.firearmFactory({id: 3}),
            factories.firearmFactory({id: 5})]);

            var promise = Promise.resolve({});
            rest.delete.mockReturnValue(promise);

            block.handleFirearmRemoved({id: 3});

            promise.then(() => {
                expect(block.state.firearmList.length).toEqual(1);
                expect(block.state.firearmList[0].id).toEqual(5);

                expect(getAllArgumentsByPosition(rest.delete.mock.calls, 0)).toContain(
                    '/rest/sheets/1/sheetfirearms/3/');
                done();
            }).catch((err) => {fail(err)});
        });
    });

    // it ("can add weapons", function () {
    //     // TODO
    // });
    //
    // it ("can remove weapons", function () {
    //     // TODO
    // });



    // TODO: Add system tests to check integration through this up till
    // SkillRow.

    it("handles age SP additions", function (done) {
        var block = factories.statBlockFactory({
            character: factories.characterFactory({gained_sp: 4})});

        block.afterLoad(function () {

            var promise = Promise.resolve({});
            rest.patch.mockReturnValue(promise);

            var addSPControl = TestUtils.findRenderedComponentWithType(
                block, AddSPControl);
            expect(addSPControl.props.initialAgeSP).toEqual(6);

            block.handleAddGainedSP(4);

            expect(getAllArgumentsByPosition(rest.patch.mock.calls, 0)
                ).toContain('/rest/characters/2/');
            // expect(rest.patch.mock.calls[0][0]).toEqual(
            //     '/rest/characters/2/');
            for (let call of rest.patch.mock.calls) {
                if (call[0] === '/rest/characters/2/') {
                    expect(call[1]).toEqual({gained_sp: 8});
                }
            }
            promise.then(() => {
                expect(block.state.char.gained_sp).toEqual(8);
                done();
            }).catch(err => fail(err));
        });
    });
});
