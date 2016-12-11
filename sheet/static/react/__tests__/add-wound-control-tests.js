jest.dontMock('../AddWoundControl');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

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

        TestUtils.Simulate.change(addControl._effectInputField,
            {target: {value: "Fuzznozzle"}});

        addControl.handleLocationChange("H");
        addControl.handleTypeChange("R");

        TestUtils.Simulate.click(addControl._addButton);

        expect(callback).toHaveBeenCalledWith({location: "H", type: "R", damage: 5, effect: 'Fuzznozzle'});
    });

    it("clears fields after add", function (done) {
        var promise = Promise.resolve({});
        var callback = jasmine.createSpy("callback").and.returnValue(promise);
        var tree = getAddWoundControlTree({
            onAdd: callback
            });
        var addControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        // TODO: change location and damage type
        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        addControl.handleLocationChange("H");
        addControl.handleTypeChange("R");

        TestUtils.Simulate.change(addControl._effectInputField,
            {target: {value: "Fuzznozzle"}});

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

        expect(addControl.isValid()).toEqual(false);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: 5}});

        expect(addControl.isValid()).toEqual(true);

        TestUtils.Simulate.change(addControl._damageInputField,
            {target: {value: "5a"}});

        expect(addControl.isValid()).toEqual(false);
    });

    // it("fills in effect for head wounds", function () {
    // });

    // it("fills in effect for torso wounds", function () {
    // });

    // it("fills in effect for torso wounds", function () {
    // });

    // it("fills in effect for torso wounds", function () {
    // });

    // it("takes toughness into account in the effect", function () {
    // });
});