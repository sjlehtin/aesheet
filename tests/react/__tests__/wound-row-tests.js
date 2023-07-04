jest.dontMock('WoundRow');
jest.dontMock('sheet-util');
jest.dontMock('./testutils');
jest.dontMock('./factories');

import React from 'react';
import TestUtils from 'react-dom/test-utils';

const TableWrapper = require('./testutils').TableWrapper;
const WoundRow = require('WoundRow').default;

var factories = require('./factories');

describe('WoundRow', function() {
    "use strict";

    var getWoundRowTree = function (givenProps) {
        var props = givenProps;
        if (!props) {
            props = {};
        }
        props.wound = factories.woundFactory(props.wound);
        return TestUtils.renderIntoDocument(
            <TableWrapper>
                <WoundRow {...props} />
            </TableWrapper>
        );
    };

    it("allows wounds to be removed", function () {
        var callback = jasmine.createSpy("callback").and.returnValue(Promise.resolve({}));
        var tree = getWoundRowTree({
            wound: {id: 2},
            onRemove: callback
            });
        var woundRow = TestUtils.findRenderedComponentWithType(tree,
            WoundRow);

        TestUtils.Simulate.click(woundRow._removeButton);

        expect(callback).toHaveBeenCalledWith({id:2});
    });

    it("allows wounds to be healed", function () {
        var callback = jasmine.createSpy("callback").and.returnValue(Promise.resolve({}));
        var tree = getWoundRowTree({
            wound: {damage: 5, location: "H", healed: 0,
                    id: 2, effect: "Throat punctured."},
            onMod: callback
            });
        var woundRow = TestUtils.findRenderedComponentWithType(tree,
            WoundRow);

        TestUtils.Simulate.click(woundRow._healButton);

        expect(callback).toHaveBeenCalledWith({id:2, healed: 1});
    });

    it("allows wounds to be worsened", function () {
        var callback = jasmine.createSpy("callback").and.returnValue(Promise.resolve({}));
        var tree = getWoundRowTree({
            wound: {damage: 5, location: "H", healed: 0,
                    id: 2, effect: "Throat punctured."},
            onMod: callback
            });
        var woundRow = TestUtils.findRenderedComponentWithType(tree,
            WoundRow);

        TestUtils.Simulate.click(woundRow._worsenButton);

        expect(callback).toHaveBeenCalledWith({id:2, damage: 6});
    });

    it("does not show heal button if fully healed", function () {
        var callback = jasmine.createSpy("callback").and.returnValue(Promise.resolve({}));
        var tree = getWoundRowTree({
            wound: {damage: 5, location: "H", healed: 5,
                    id: 2, effect: "Throat punctured."},
            onMod: callback
            });
        var woundRow = TestUtils.findRenderedComponentWithType(tree,
            WoundRow);

        expect(woundRow._healButton).not.toBeDefined();
    });

    it("allows wound effects to be changed", function (done) {
        var resolve = Promise.resolve({});
        var callback = jasmine.createSpy("callback").and.returnValue(resolve);
        var tree = getWoundRowTree({
            wound: {damage: 5, location: "H", healed: 0,
                    id: 2, effect: "Throat punctured."},
            onMod: callback
            });
        var woundRow = TestUtils.findRenderedComponentWithType(tree,
            WoundRow);

        TestUtils.Simulate.click(woundRow._effectField);

        TestUtils.Simulate.change(woundRow._effectInputField,
            {target: {value: "Fuzzbazz"}});

        TestUtils.Simulate.keyDown(woundRow._effectInputField,
                {key: "Enter", keyCode: 13, which: 13});

        expect(callback).toHaveBeenCalledWith({
            id: 2,
            effect: "Fuzzbazz"
        });
        resolve.then(function () {
            expect(woundRow.state.editingEffect).toEqual(false);
            done();
        }).catch((err) => {console.log(err)});
    });

    it("allows wound effect changing to be canceled", function () {
        var resolve = Promise.resolve({});
        var callback = jasmine.createSpy("callback").and.returnValue(resolve);
        var tree = getWoundRowTree({
            wound: {
                damage: 5, location: "H", healed: 0,
                id: 2, effect: "Throat punctured."
            },
            onMod: callback
        });
        var woundRow = TestUtils.findRenderedComponentWithType(tree,
            WoundRow);

        TestUtils.Simulate.click(woundRow._effectField);

        TestUtils.Simulate.change(woundRow._effectInputField,
            {target: {value: "Fuzzbazz"}});

        TestUtils.Simulate.keyDown(woundRow._effectInputField,
            {key: "Esc", keyCode: 27, which: 27});

        expect(woundRow.state.editingEffect).toEqual(false);
        expect(woundRow.state.effect).toEqual("Throat punctured.");
    });
});
