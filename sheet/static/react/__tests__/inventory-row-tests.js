jest.dontMock('../InventoryRow');
jest.dontMock('../sheet-util');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const InventoryRow = require('../InventoryRow').default;

var inventoryEntryFactory = function (overrides) {
    var _entryData = {
        quantity: 1,
        unit_weight: "0.5",
        description: "Item",
        order: 0,
        location: ""
    };

    return Object.assign(_entryData, overrides);
};

var inventoryRowFactory = function(givenProps) {
    // TODO: React TestUtils suck a bit of a balls.
    var Wrapper = React.createClass({
        render: function () {
            return <table>
                <tbody>{this.props.children}</tbody>
            </table>;
        }
    });

    var props = {initialEntry: inventoryEntryFactory()};
    var rowElement = React.createElement(InventoryRow,
        Object.assign(props, givenProps));
    var table = TestUtils.renderIntoDocument(
        <Wrapper>
            {rowElement}
        </Wrapper>
    );

    return TestUtils.findRenderedComponentWithType(table,
        InventoryRow);
};

describe('InventoryRow', function() {
    "use strict";

    var promises = [];

    it('renders also as empty', function () {
        var row = inventoryRowFactory();
        var table = TestUtils.findRenderedDOMComponentWithTag(row,
            "tr");
        expect(row.descriptionValidationState()).toEqual("success");
        expect(row.unitWeightValidationState()).toEqual("success");
    });

    it('validates description field', function () {
        var row = inventoryRowFactory();

        TestUtils.Simulate.click(row._descriptionField);

        TestUtils.Simulate.change(row._descriptionInputField,
            {target: {value: ""}});

        expect(row.descriptionValidationState()).toEqual("error");
        expect(row.isValid()).toBe(false);

        TestUtils.Simulate.change(row._descriptionInputField,
            {target: {value: "Tsup"}});
        expect(row.descriptionValidationState()).toEqual("success");
        expect(row.isValid()).toBe(true);
    });

    it('allows canceling edit', function (done) {
        var row = inventoryRowFactory();

        Promise.all(promises).then(function () {
            TestUtils.Simulate.click(row._descriptionField);

            expect(row.state.description).toEqual("Item");

            TestUtils.Simulate.change(row._descriptionInputField,
                {target: {value: "Foofaafom"}});

            expect(row.state.description).toEqual("Foofaafom");

            TestUtils.Simulate.keyDown(row._descriptionInputField,
                {key: "Esc", keyCode: 27, which: 27});

            expect(row.state.description).toEqual("Item");
            done();
        }).catch((err) => fail(err));

    });

    it('validates unit weight field', function () {
        var row = inventoryRowFactory();

            TestUtils.Simulate.click(row._unitWeightField);

            TestUtils.Simulate.change(row._unitWeightInputField,
                {target: {value: "a2.1"}});

            expect(row.unitWeightValidationState()).toEqual("error");
            expect(row.isValid()).toBe(false);

            TestUtils.Simulate.change(row._unitWeightInputField,
                {target: {value: "2.1"}});

            expect(row.unitWeightValidationState()).toEqual("success");
            expect(row.isValid()).toBe(true);
    });

    it('validates quantity field', function () {
        var row = inventoryRowFactory();

        TestUtils.Simulate.click(row._quantityField);

        TestUtils.Simulate.change(row._quantityInputField,
            {target: {value: "a2"}});

        expect(row.quantityValidationState()).toEqual("error");
        expect(row.isValid()).toBe(false);

        TestUtils.Simulate.change(row._quantityInputField,
            {target: {value: "2"}});

        expect(row.quantityValidationState()).toEqual("success");
        expect(row.isValid()).toBe(true);
    });

    it('allows edit of location field', function () {
        var row = inventoryRowFactory();

        TestUtils.Simulate.click(row._locationField);

        TestUtils.Simulate.change(row._locationInputField,
            {target: {value: "a2"}});

        expect(row.isValid()).toBe(true);

        TestUtils.Simulate.change(row._locationInputField,
            {target: {value: ""}});

        expect(row.isValid()).toBe(true);
    });

    it('calls onDelete on clicking remove', function () {
        var spy = jasmine.createSpy("remove");
        var row = inventoryRowFactory({onDelete: spy});

        TestUtils.Simulate.click(row._descriptionField);

        var button = TestUtils.findRenderedDOMComponentWithTag(row, "button");
        expect(typeof(button)).not.toEqual("undefined");

        TestUtils.Simulate.click(row._removeButton);

        expect(spy).toHaveBeenCalledWith();
    });

    it('handles submit', function () {
        var spy = jasmine.createSpy("changed");
        var row = inventoryRowFactory({onMod: spy});

        TestUtils.Simulate.click(row._unitWeightField);

        TestUtils.Simulate.change(row._unitWeightInputField,
            {target: {value: "2.1"}});

        TestUtils.Simulate.keyDown(
            row._unitWeightInputField,
            {key: "Enter", keyCode: 13, which: 13});
        expect(spy).toHaveBeenCalledWith(Object.assign(
            inventoryEntryFactory(), {unit_weight: "2.1"}));

        expect(row.state.show.unitWeight).toBe(false);
    });


    it('disables submit on invalid input', function () {
        var spy = jasmine.createSpy("changed");
        var row = inventoryRowFactory({onMod: spy});

        TestUtils.Simulate.click(row._unitWeightField);

        TestUtils.Simulate.change(row._unitWeightInputField,
            {target: {value: "a2.1"}});

        TestUtils.Simulate.keyDown(
            row._unitWeightInputField,
            {key: "Enter", keyCode: 13, which: 13});
         expect(spy).not.toHaveBeenCalled();
    });

    it ('enables all fields when creating new entry', function (){
        var row = inventoryRowFactory({createNew: true});
        expect(row.state.show.description).toBe(true);
        expect(row.state.show.location).toBe(true);
        expect(row.state.show.quantity).toBe(true);
        expect(row.state.show.unitWeight).toBe(true);
    });

    it ('allows submit on creating new entry', function () {
        var spy = jasmine.createSpy("changed");
        var row = inventoryRowFactory({
            initialEntry: undefined,
            createNew: true,
            onMod: spy
        });

        var buttons = TestUtils.scryRenderedDOMComponentsWithTag(row, "button");
        expect(buttons.length).toEqual(0);

        TestUtils.Simulate.change(row._descriptionInputField,
            {target: {value: "Foobar"}});

        TestUtils.Simulate.keyDown(
            row._descriptionInputField,
            {key: "Enter", keyCode: 13, which: 13});

         expect(spy).toHaveBeenCalledWith({description: "Foobar",
             quantity: "1",
             unit_weight: "1.0",
             location: ""
         });
    });
});