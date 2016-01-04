jest.dontMock('../Inventory');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

const Inventory = require('../Inventory').default;

describe('Inventory', function() {
    "use strict";

    var promises = [];

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

    var jsonResponse = function (json) {
        var promise = Promise.resolve(json);
        promises.push(promise);
        return promise;
    };

    beforeEach(function () {
        rest.getData = jest.genMockFunction();
        rest.patch = jest.genMockFunction();
        rest.post = jest.genMockFunction();
        promises = [];
    });

    var getInventory = function () {
        var inventory = <Inventory url="/rest/sheets/1/inventory/" />;
        var node = TestUtils.renderIntoDocument(inventory);
        return TestUtils.findRenderedComponentWithType(node,
            Inventory);
    };

    it('renders also as empty', function () {
        rest.getData.mockReturnValue(jsonResponse([]));
        var inventory = getInventory();
        var table = TestUtils.findRenderedDOMComponentWithTag(inventory,
            "tbody");
    });

    it('loads inventory with a REST API', function (done) {
        rest.getData.mockReturnValue(jsonResponse([]));
        var inventory = getInventory();
        expect(rest.getData.mock.calls[0][0]).toEqual('/rest/sheets/1/inventory/');
        Promise.all(promises).then(() => {
            done();
        });
    });

    it('renders inventory', function (done) {
        rest.getData.mockReturnValue(jsonResponse([
            inventoryEntryFactory({description: 'potion of flying'}),
            inventoryEntryFactory({
                description: 'podkin point arrows',
                unit_weight: "0.1",
                quantity: 20
            })
        ]));
        var inventory = getInventory();
        expect(rest.getData.mock.calls[0][0]).toEqual('/rest/sheets/1/inventory/');
        Promise.all(promises).then(() => {
            var table = TestUtils.findRenderedDOMComponentWithTag(inventory,
                "table");
            var nodeList = table.querySelectorAll('.weight');
            expect(nodeList.length).toEqual(2);
            done();
        });
    });

    pit('allows items to be added', function () {
        rest.getData.mockReturnValue(jsonResponse([inventoryEntryFactory()]));
        var inventory = getInventory();
        return Promise.all(promises).then(() => {
            expect(inventory._addButton).not.toBe(undefined);

            TestUtils.Simulate.click(inventory._addButton);

            expect(inventory.state.addEnabled).toBe(true);

            expect(inventory.state.newQuantity).toEqual(1);
            expect(inventory.state.newUnitWeight).toEqual(1.0);
            expect(inventory.state.newLocation).toEqual("");
            expect(inventory.state.newDescription).toEqual("");

            TestUtils.Simulate.change(
                inventory._descriptionInputField,
                {target: { value: "foobar"}});

            TestUtils.Simulate.change(
                inventory._locationInputField,
                {target: { value: "qux"}});

            expect(inventory.state.newLocation).toEqual("qux");

            TestUtils.Simulate.change(
                inventory._unitWeightInputField,
                {target: { value: "2.5"}});

            expect(inventory.state.newUnitWeight).toEqual("2.5");

            rest.post.mockReturnValue(jsonResponse({}));

            TestUtils.Simulate.keyDown(
                inventory._unitWeightInputField,
                {key: "Enter", keyCode: 13, which: 13});

            expect(rest.post.mock.calls[0][0]).toEqual(
                '/rest/sheets/1/inventory/');

            var data = rest.post.mock.calls[0][1];
            expect(data.location).toEqual("qux");
            expect(data.description).toEqual("foobar");
            expect(data.unit_weight).toEqual("2.5");
            expect(data.quantity).toEqual(1);
            expect(data.order).toEqual(2);
        });

    })
});