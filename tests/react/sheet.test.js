import React from 'react';

import StatBlock from 'StatBlock'

import { screen, render, waitForElementToBeRemoved, within, fireEvent, prettyDOM, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'
import {testSetup} from "./testutils";

import * as factories from './factories'

const server = setupServer(
  rest.get('http://localhost/rest/sheets/1/', (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()))
  }),
  rest.get('http://localhost/rest/sheets/1/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/ammunition/firearm/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
    return res(ctx.json(factories.characterFactory()))
  }),
  rest.get('http://localhost/rest/characters/2/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([]))
  })
)


describe('StatBlock', function() {
    beforeAll(() => {
        testSetup()
        server.listen({ onUnhandledRequest: 'error' })
    })
    afterEach(() => {
        server.resetHandlers()
        factories.clearAll()
    })
    afterAll(() => server.close())

    // it('calculates mana', function (done) {
    //     var block = factories.statBlockFactory({character: {
    //         cur_wil: 53, cur_psy: 42}});
    //     block.afterLoad(function () {
    //         var baseStats = block.getSkillHandler().getBaseStats();
    //         expect(block.mana(baseStats)).toEqual(24);
    //         done();
    //     });
    // });
    //
    // it('calculates mana with bought mana', function (done) {
    //     var block = factories.statBlockFactory({character: {
    //         cur_wil: 53, cur_psy: 42, bought_mana: 5}});
    //
    //     block.afterLoad(function () {
    //         var baseStats = block.getSkillHandler().getBaseStats();
    //         expect(block.mana(baseStats)).toEqual(29);
    //         done();
    //     });
    // });
    //
    // it('handles edge addition', function (done) {
    //     var block = factories.statBlockFactory();
    //     block.afterLoad(function () {
    //
    //         var edge = factories.edgeLevelFactory({
    //             edge: {name: "Toughness"}, level: 2});
    //
    //         var promise = Promise.resolve({
    //             id: 300, edge: edge.id, character: 1});
    //         rest.post.mockReturnValue(promise);
    //
    //         // Updates character with REST.
    //         block.handleEdgeAdded(edge);
    //
    //         promise.then(() => {
    //             expect(Object.keys(block.state.edgeList).length).toBe(1);
    //             var skillHandler = getSkillHandler(block);
    //             expect(skillHandler.edgeLevel('Toughness')).toEqual(2);
    //             done();
    //         }).catch((err) => {this.fail("err occurred:", err)});
    //     });
    // });
    //
    // it('does not add body for no toughness', function () {
    //     let block = factories.statBlockFactory({character: {
    //         cur_wil: 53, cur_psy: 42, bought_mana: 5}});
    //
    //     return block.loaded.then(function () {
    //         expect(ReactDOM.findDOMNode(block).querySelector('#bodyFromToughness')).toBe(null);
    //     });
    // });

    it('adds correct body for Toughness', async () => {
        server.use(
            rest.get("http://localhost/rest/characters/2/characteredges/", (req, res, ctx) => {
            return res(ctx.json([factories.characterEdgeFactory({edge: {edge: "Toughness", toughness: 2, level: 2}})]))
        })
        )

        render(<StatBlock url="/rest/sheets/1/" />)

        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})

        expect(screen.getByLabelText("Body at full health").textContent).toEqual("11+4")
        expect(screen.getAllByLabelText("Current body")[0].textContent.trim()).toEqual("15")
    });

//     it('collects a list of edges while updating with REST', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             expect(block.state.edgeList.length).toBe(0);
//             var edge = factories.edgeLevelFactory({
//                 edge: {name: "Fast Healing"},
//                 level: 3});
//             var promise = Promise.resolve({
//                 id: 300, edge: edge.id, character: 1});
//             rest.post.mockReturnValue(promise);
//             block.handleEdgeAdded(edge);
//
//             promise.then(() => {
//                 expect(block.state.edgeList.length).toBe(1);
//                 var edge = factories.edgeLevelFactory({edge:
//                         {name: "Fast Mana recovery"},
//                     level: 3});
//                 var promise = Promise.resolve({
//                     id: 300, edge: edge.id, character: 1});
//                 rest.post.mockReturnValue(promise);
//
//                 block.handleEdgeAdded(edge);
//
//                 promise.then(() => {
//                     expect(block.state.edgeList.length).toBe(2);
//                     done();
//                 }).catch((err) => {this.fail("err occurred:", err)});
//             }).catch((err) => {this.fail("err occurred:", err)});
//
//         });
//     });
//
//     it('handles edge point calculation', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             var control = TestUtils.findRenderedComponentWithType(block,
//                 XPControl);
//             expect(control.props.edgesBought).toEqual(0);
//
//             addEdge(block, "Toughness", 2, {cost: 4});
//             addEdge(block, "Acute Touch", 1, {cost: 1});
//
//             expect(control.props.edgesBought).toEqual(5);
//             done();
//         });
//     });
//
//     it('handles edge point calculation with some costs ignored', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             var control = TestUtils.findRenderedComponentWithType(block,
//                 XPControl);
//             expect(control.props.edgesBought).toEqual(0);
//
//             addEdge(block, "Toughness", 2, {cost: 4});
//             addEdge(block, "Acute Touch", 1, {cost: 1}, true);
//
//             expect(control.props.edgesBought).toEqual(5);
//             done();
//         });
//     });
//
//     xit('handles edge removal', test.todo);
//
//     var getSkillHandler = function (block) {
//         // TODO: skills need to be loaded because edges are handled by
//         // skillhandler, which requires the skills.  edges should be contained
//         // by the stat handler.
//
//         return block.getSkillHandler();
//     };
//
//     const addEdge = function (block, edgeName, edgeLevel, props, ignoreCost) {
//         if (!props){
//             props = {};
//         }
//         props = Object.assign({ edge: {name: edgeName},
//                                 level: edgeLevel }, props);
//         let edgeList = [factories.characterEdgeFactory({
//                 edge: props, ignoreCost: !!ignoreCost})];
//         if (block.state.characterEdges.length > 0) {
//             edgeList = block.state.characterEdges.concat(edgeList);
//         }
//         block.handleEdgesLoaded(edgeList);
//     };
//
//     it('can indicate stamina recovery', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             var effStats = block.getSkillHandler().getEffStats();
//
//             addEdge(block, "Fast Healing", 1);
//             expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('1d6/8h');
//             addEdge(block, "Fast Healing", 2);
//             expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('2d6/8h');
//             addEdge(block, "Fast Healing", 3);
//             expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('4d6/8h');
//             done();
//         });
//     });
//
//     it('can indicate stamina recovery with high stat', function (done) {
//         var block = factories.statBlockFactory({
//             character: {cur_fit: 70, cur_psy: 51}});
//         block.afterLoad(function () {
//             var effStats = block.getSkillHandler().getEffStats();
//             expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('1/8h');
//             addEdge(block, "Fast Healing", 1);
//             expect(block.staminaRecovery(effStats, getSkillHandler(block))).toEqual('1+1d6/8h');
//             done();
//         });
//     });
//
//     it('can indicate mana recovery', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             var effStats = block.getSkillHandler().getEffStats();
//             addEdge(block, "Fast Mana Recovery", 1);
//             expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('2d6/8h');
//             addEdge(block, "Fast Mana Recovery", 2);
//             expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('4d6/8h');
//             addEdge(block, "Fast Mana Recovery", 3);
//             expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('8d6/8h');
//             done();
//         });
//     });
//
//     it('can indicate mana recovery with high stat', function (done) {
//         var block = factories.statBlockFactory({
//             character: {cur_cha: 70}});
//         block.afterLoad(function () {
//             var effStats = block.getSkillHandler().getEffStats();
//             expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('2/8h');
//             addEdge(block, "Fast Mana Recovery", 1);
//             expect(block.manaRecovery(effStats, getSkillHandler(block))).toEqual('2+2d6/8h');
//             done();
//         });
//     });
//
//     it('can indicate body healing', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             expect(block.bodyHealing(block.getSkillHandler())).toEqual('3/16d');
//             addEdge(block, "Fast Healing", 3);
//             expect(block.bodyHealing(block.getSkillHandler())).toEqual('3/2d');
//             done();
//         });
//     });
//
//     it('handles modifications of stats from child components', function (done) {
//         var block = factories.statBlockFactory({
//             character: {cur_ref: 60}});
//         block.afterLoad(function () {
//             block.handleModification("fit", 40, 41);
//             var baseStats = block.getSkillHandler().getBaseStats();
//             expect(baseStats.mov).toEqual(51);
//             done();
//         });
//     });
//
//     it('handles modifications of xp from child components', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             block.handleXPMod("total_xp", 0, 231);
//             expect(block.state.char.total_xp).toEqual(231);
//             done();
//         });
//     });
//
//     it('contains a NoteBlock component', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             addEdge(block, "Fast Healing", 3, {notes: "Foofaafom"});
//
//             var noteBlock = TestUtils.findRenderedComponentWithType(
//                 block, NoteBlock);
//             expect(TestUtils.isCompositeComponent(noteBlock)).toBe(true);
//             done();
//         });
//     });
//
//     it('can calculate all effective stats', function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
//                 "pos", "mov", "dex", "imm"];
//             for (var ii = 0; ii < stats.length; ii++) {
//                 expect(typeof(block.getSkillHandler().getEffStats().ref))
//                     .toEqual("number");
//             }
//             expect(block.getSkillHandler().getEffStats().ref).toEqual(43);
//             done();
//         });
//     });
//
//     it("handles skill removal", function (done) {
//         var skill = factories.characterSkillFactory({
//             id: 2, skill: "Weaponsmithing", level: 1 });
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             block.handleSkillsLoaded([skill,
//                 factories.characterSkillFactory({
//                     id: 1, skill: "Gardening",
//                     level: 3
//                 })
//             ], []);
//
//             var promise = Promise.resolve({});
//             rest.del.mockReturnValue(promise);
//
//             block.handleCharacterSkillRemove({id: 1});
//
//             expect(rest.del.mock.calls[0][0]).toEqual(
//                 '/rest/characters/2/characterskills/1/');
//
//             promise.then(() => {
//                 expect(block.state.characterSkills).toEqual([skill]);
//                 done();
//             }).catch((err) => fail(err));
//         });
//     });
//
//     it("handles skill addition", function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             block.handleSkillsLoaded([], []);
//
//             var expectedSkill = {
//                 id: 1, skill: "Gardening",
//                 level: 3
//             };
//
//             rest.post.mockClear();
//
//             var promise = Promise.resolve(expectedSkill);
//             rest.post.mockReturnValue(promise);
//
//             var skill = {
//                 skill: "Gardening",
//                 level: 3
//             };
//
//             block.handleCharacterSkillAdd(skill);
//
//             expect(rest.post.mock.calls[0][0]).toEqual(
//                 '/rest/characters/2/characterskills/');
//             expect(rest.post.mock.calls[0][1]).toEqual({
//                 skill: "Gardening",
//                 level: 3
//             });
//
//             promise.then(() => {
//                 expect(block.state.characterSkills).toEqual([expectedSkill]);
//                 done();
//             }).catch((err) => fail(err));
//         });
//     });
//
//     it("handles skill level changes", function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//
//             var skillList = [
//                 factories.characterSkillFactory({
//                     id: 2, skill: "Weaponsmithing",
//                     level: 1
//                 }),
//                 factories.characterSkillFactory({
//                     id: 1, skill: "Gardening",
//                     level: 3
//                 })
//             ];
//             block.handleSkillsLoaded(skillList, []);
//
//             var promise = Promise.resolve({
//                 id: 1, skill: "Gardening",
//                 level: 2
//             });
//             rest.patch.mockReturnValue(promise);
//             block.handleCharacterSkillModify({
//                 id: 1, skill: "Gardening",
//                 level: 2
//             });
//             expect(rest.patch.mock.calls[0][0]).toEqual(
//                 '/rest/characters/2/characterskills/1/');
//             expect(rest.patch.mock.calls[0][1]).toEqual({
//                 id: 1, skill: "Gardening",
//                 level: 2
//             });
//
//             promise.then(() => {
//                 var listCopy = skillList.map((elem) => {
//                     return Object.assign({}, elem)
//                 });
//                 listCopy[1].level = 2;
//                 expect(block.state.characterSkills).toEqual(listCopy);
//                 done();
//             }).catch((err) => {
//                 fail(err)
//             });
//         });
//     });
//
//     // it ("can add firearms", function () {
//     //     // TODO
//     // });
//
//     it ("can remove firearms", function (done) {
//         var block = factories.statBlockFactory();
//         block.afterLoad(function () {
//             var skillList = [
//                 factories.characterSkillFactory({
//                     id: 1, skill: "Handguns",
//                     level: 1
//                 })
//             ];
//             block.handleSkillsLoaded(skillList, []);
//             block.handleFirearmsLoaded([factories.firearmFactory({id: 3}),
//             factories.firearmFactory({id: 5})]);
//
//             var promise = Promise.resolve({});
//             rest.del.mockReturnValue(promise);
//
//             block.handleFirearmRemoved({id: 3});
//
//             promise.then(() => {
//                 expect(block.state.firearmList.length).toEqual(1);
//                 expect(block.state.firearmList[0].id).toEqual(5);
//
//                 expect(getAllArgumentsByPosition(rest.del.mock.calls, 0)).toContain(
//                     '/rest/sheets/1/sheetfirearms/3/');
//                 done();
//             }).catch((err) => {fail(err)});
//         });
//     });
//
//     // it ("can add weapons", function () {
//     //     // TODO
//     // });
//     //
//     // it ("can remove weapons", function () {
//     //     // TODO
//     // });
//
//     // TODO: Add system tests to check integration through this up till
//     // SkillRow.
//
//     it("handles age SP additions", function (done) {
//         var block = factories.statBlockFactory({
//             character: factories.characterFactory({gained_sp: 4})});
//
//         block.afterLoad(function () {
//
//             var promise = Promise.resolve({});
//             rest.patch.mockReturnValue(promise);
//
//             var addSPControl = TestUtils.findRenderedComponentWithType(
//                 block, AddSPControl);
//             expect(addSPControl.props.initialAgeSP).toEqual(6);
//
//             block.handleAddGainedSP(4);
//
//             expect(getAllArgumentsByPosition(rest.patch.mock.calls, 0)
//                 ).toContain('/rest/characters/2/');
//             // expect(rest.patch.mock.calls[0][0]).toEqual(
//             //     '/rest/characters/2/');
//             for (let call of rest.patch.mock.calls) {
//                 if (call[0] === '/rest/characters/2/') {
//                     expect(call[1]).toEqual({gained_sp: 8});
//                 }
//             }
//             promise.then(() => {
//                 expect(block.state.char.gained_sp).toEqual(8);
//                 done();
//             }).catch(err => fail(err));
//         });
//     });
//
});
