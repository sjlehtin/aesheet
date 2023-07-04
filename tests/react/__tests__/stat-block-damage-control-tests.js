import React from 'react';
import TestUtils from 'react-dom/test-utils';

jest.mock('sheet-rest');
var rest = require('sheet-rest');

var factories = require('./factories');

const StatBlock = require('StatBlock').default;
const WoundRow = require('WoundRow').default;
const AddWoundControl = require('AddWoundControl').default;

describe('stat block wounds handling', function() {
    "use strict";

    it("can load wounds", function (done) {
        var tree = factories.statBlockTreeFactory({wounds: [
            {effect: "Throat punctured"}]});
        tree.afterLoad(function () {
            var woundRow = TestUtils.findRenderedComponentWithType(tree, WoundRow);
            expect(woundRow.props.wound.effect).toEqual("Throat punctured");
            done();
        });
    });

    it("integrates wounds into skill checks", function (done) {
        var block = factories.statBlockFactory({wounds: [
            {damage: 2, effect: "Throat punctured", location: "T"}]});
        block.afterLoad(function () {
            expect(block.getSkillHandler().getWoundPenalties().aa).toEqual(-10);
            done();
        });
    });

    it("allows wounds to be modified", function (done) {
        var tree = factories.statBlockTreeFactory({wounds: [
            {id: 2, damage: 5, healed: 0}]});
        rest.patch.mockClear();
        var patchPromise = Promise.resolve({});
        rest.patch.mockReturnValue(patchPromise);
        tree.afterLoad(function () {
            var woundRow = TestUtils.findRenderedComponentWithType(tree, WoundRow);
            TestUtils.Simulate.click(woundRow._healButton);

            expect(rest.patch.mock.calls[0]).toEqual(['/rest/characters/2/wounds/2/', {id: 2, healed: 1}]);

            patchPromise.then(() => {
                var statBlock = TestUtils.findRenderedComponentWithType(tree, StatBlock);
                expect(statBlock.state.woundList).toEqual([
                    factories.woundFactory({id: 2, damage:5, healed: 1})]);
                done();
            });
        });
    });

    it("allows wounds to be removed", function (done) {
        var tree = factories.statBlockTreeFactory({wounds: [
            {id: 2, damage: 5, healed: 0},
            {id: 5, damage: 3, healed: 2}]});
        rest.del.mockClear();
        var patchPromise = Promise.resolve({});
        rest.del.mockReturnValue(patchPromise);
        tree.afterLoad(function () {
            var woundRows = TestUtils.scryRenderedComponentsWithType(tree, WoundRow);
            TestUtils.Simulate.click(woundRows[0]._removeButton);

            expect(rest.del.mock.calls[0]).toEqual(['/rest/characters/2/wounds/2/']);

            patchPromise.then(() => {
                var statBlock = TestUtils.findRenderedComponentWithType(tree, StatBlock);
                expect(statBlock.state.woundList).toEqual([
                    factories.woundFactory({id: 5, damage: 3, healed: 2})
                ]);
                done();
            });
        });
    });

    it("allows wounds to be added", function (done) {
        var tree = factories.statBlockTreeFactory();
        rest.post.mockClear();
        tree.afterLoad(function () {
            var addControl = TestUtils.findRenderedComponentWithType(tree, AddWoundControl);

            TestUtils.Simulate.change(addControl._damageInputField,
                {target: {value: 5}});
            addControl.handleEffectChange("Fuzznozzle");

            var newWound = factories.woundFactory({id: 42, damage: 5,
                effect: "Fuzznozzle", character: 2});

            var expectedWound = Object.assign({}, newWound);
            delete expectedWound.id;
            delete expectedWound.character;
            delete expectedWound.healed;

            var postPromise = Promise.resolve(newWound);
            rest.post.mockReturnValue(postPromise);

            TestUtils.Simulate.click(addControl._addButton);

            expect(rest.post.mock.calls[0]).toEqual(['/rest/characters/2/wounds/',
                expectedWound]);

            postPromise.then(() => {
                var statBlock = TestUtils.findRenderedComponentWithType(tree, StatBlock);
                expect(statBlock.state.woundList).toEqual([newWound]);
                done();
            });
        });
    });

    it("integrates toughness into AddWoundControl", function (done) {
        var tree = factories.statBlockTreeFactory({edges: [{edge: {edge: "Toughness", level: 3}}]});
        tree.afterLoad(function () {
            var addControl = TestUtils.findRenderedComponentWithType(tree, AddWoundControl);
            expect(addControl.props.toughness).toEqual(3);
            done();
        });
    });
});