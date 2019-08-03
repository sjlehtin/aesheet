jest.dontMock('../AddWoundControl');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

const TableWrapper = require('./testutils').TableWrapper;
const AddWoundControl = require('../AddWoundControl').default;

var factories = require('./factories');

describe('AddWoundControl', function() {
    "use strict";

    var getAddWoundControlTree = function (givenProps) {
        var props = givenProps;
        if (!props) {
            props = {};
        }
        return TestUtils.renderIntoDocument(
            <TableWrapper>
                <AddWoundControl {...props} />
            </TableWrapper>
        );
    };

    it("allows wounds to be added", function () {
        var callback = jasmine.createSpy("callback").and.returnValue(Promise.resolve({}));
        var tree = getAddWoundControlTree({
            onAdd: callback
            });
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        addControl.handleLocationChange("H");
        addControl.handleTypeChange("R");
        addControl.handleEffectChange("Fuzznozzle");

        TestUtils.Simulate.click(addControl._addButton);

        expect(callback).toHaveBeenCalledWith({location: "H", damage_type: "R", damage: 5, effect: 'Fuzznozzle'});
    });

    it("clears fields after add", function (done) {
        var promise = Promise.resolve({});
        var callback = jasmine.createSpy("callback").and.returnValue(promise);
        var tree = getAddWoundControlTree({
            onAdd: callback
            });
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        addControl.handleLocationChange("H");
        addControl.handleTypeChange("R");
        addControl.handleEffectChange("Fuzznozzle");

        TestUtils.Simulate.click(addControl._addButton);

        promise.then(() => {
            expect(addControl.state.damage).toEqual(0);
            expect(addControl.state.effect).toEqual("");
            expect(addControl.state.selectedType).toEqual("S");
            expect(addControl.state.selectedLocation).toEqual("T");
            done();
        }).catch((err) => {console.log(err)});
    });

    it("validates location", function () {
        var tree = getAddWoundControlTree({
            });
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        console.log("testing foo?");
        // Cannot easily trigger change with the Combobox.
        addControl.handleLocationChange("Foo");

        expect(addControl.isValid()).toEqual(false);

        addControl.handleLocationChange("H");

        expect(addControl.isValid()).toEqual(true);
    });

    it("validates damage", function () {
        var tree = getAddWoundControlTree({});
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        // Allows zero wounds.  The effect should be fillable afterwards.
        expect(addControl.isValid()).toEqual(true);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: "5a"}});

        expect(addControl.isValid()).toEqual(false);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        expect(addControl.isValid()).toEqual(true);
    });

    it("fills in effect for head wounds", function () {
        var tree = getAddWoundControlTree();
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        addControl.handleLocationChange("H");
        addControl.handleTypeChange("R");

        expect(addControl.state.effect).toContain("Skin burned bad");
        expect(addControl.state.effect).toContain("IMM -30");
    });

    it("takes effect from last in case of massive damage", function () {
        var tree = getAddWoundControlTree();
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 20}});

        addControl.handleLocationChange("H");
        addControl.handleTypeChange("P");

        expect(addControl.state.effect).toContain("Head blown off");
    });

    it("fills in effect for arm wounds", function () {
        var tree = getAddWoundControlTree();
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        addControl.handleLocationChange("LA");
        addControl.handleTypeChange("B");
        expect(addControl.state.effect).toContain("Shoulder broken");
    });

    it("fills in effect for leg wounds", function () {
        var tree = getAddWoundControlTree();
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        addControl.handleLocationChange("LL");
        addControl.handleTypeChange("P");
        expect(addControl.state.effect).toContain("Major vein cut");
    });

    it("fills in effect for torso wounds", function () {
        var tree = getAddWoundControlTree();
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        addControl.handleLocationChange("T");
        addControl.handleTypeChange("S");
        expect(addControl.state.effect).toContain("Gut pierced");
    });

    it("updates effect on damage change", function () {
        var tree = getAddWoundControlTree();
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        addControl.handleLocationChange("T");
        addControl.handleTypeChange("S");

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        expect(addControl.state.effect).toContain("Gut pierced");
    });

    it("takes toughness into account in the effect", function () {
        var tree = getAddWoundControlTree({toughness: 3});
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        addControl.handleLocationChange("T");
        addControl.handleTypeChange("S");

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 8}});

        expect(addControl.state.effect).toContain("Gut pierced");
    });
});