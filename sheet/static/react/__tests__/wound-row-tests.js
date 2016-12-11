jest.dontMock('../WoundRow');
jest.dontMock('../sheet-util');
jest.dontMock('./testutils');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const TableWrapper = require('./testutils').TableWrapper;
const WoundRow = require('../WoundRow').default;

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
});
