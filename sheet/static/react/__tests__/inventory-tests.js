jest.dontMock('../Inventory');
jest.dontMock('../InventoryRow');
jest.dontMock('../sheet-util');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('../sheet-rest');

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
        return TestUtils.findRenderedComponentWithType(node, Inventory);
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
        console.log("bar?");
        rest.getData.mockReturnValue(jsonResponse([
            inventoryEntryFactory({description: 'potion of flying', id: 1}),
            inventoryEntryFactory({
                description: 'podkin point arrows',
                unit_weight: "0.1",
                quantity: 20,
                id: 2
            })
        ]));
        var inventory = getInventory();
        expect(rest.getData.mock.calls[0][0]).toEqual('/rest/sheets/1/inventory/');
        Promise.all(promises).then(() => {
            Promise.all(promises).then(() => {
                var table = TestUtils.findRenderedDOMComponentWithTag(inventory,
                    "table");
                expect(inventory.state.inventory.length).toEqual(2);
                /* InventoryRow */
                var nodeList = table.querySelectorAll('.weight');
                expect(nodeList.length).toEqual(2);
                done();
            });
        });
    });

    it('allows items to be added', function (done) {
        rest.getData.mockReturnValue(jsonResponse([inventoryEntryFactory({id: 1})]));
        var inventory = getInventory();

        Promise.all(promises).then((data) => {

            TestUtils.Simulate.click(inventory._addButton);

            var newElem = inventoryEntryFactory();
            rest.post.mockReturnValue(jsonResponse(Object.assign(newElem,
                {id: '42'})));

            inventory.handleNew(newElem);

            Promise.all(promises).then((data) => {
                expect(rest.post.mock.calls.length).toEqual(1);
                expect(rest.post.mock.calls[0][0]).toEqual(
                    '/rest/sheets/1/inventory/');
                expect(rest.post.mock.calls[0][1]).toEqual(
                    newElem);
                expect(inventory.state.inventory.length).toEqual(2);
                done();
            }).catch((err) => {
                fail(err)
            });
        }).catch((err) => fail(err));
    });
});