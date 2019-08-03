import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const inventoryEntryFactory = require('./factories').inventoryEntryFactory;

jest.mock('../sheet-rest');
var rest = require('../sheet-rest');

const Inventory = require('../Inventory').default;

describe('Inventory', function() {
    "use strict";

    var promises = [];

    var jsonResponse = function (json) {
        var promise = Promise.resolve(json);
        promises.push(promise);
        return promise;
    };

    beforeEach(function () {
        promises = [];
    });

    var getInventory = function (givenProps) {
        var props = {url: "/rest/sheets/1/inventory/"};
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var inventory = <Inventory {...props} />;
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

    it('allows items to be added with button click', function (done) {
        rest.getData.mockReturnValue(jsonResponse([inventoryEntryFactory({id: 1})]));
        var inventory = getInventory();

        Promise.all(promises).then((data) => {
            TestUtils.Simulate.click(inventory._addButton);

            var node = ReactDOM.findDOMNode(inventory._inputRow)
                .querySelector('td input');
            expect(ReactDOM.findDOMNode(inventory._addButton)
                .hasAttribute("disabled")).toEqual(true);

            expect(inventory._inputRow.isValid()).toEqual(false);
            node.value = "Foofaafom";
            TestUtils.Simulate.change(node);
            expect(inventory._inputRow.isValid()).toEqual(true);

            expect(ReactDOM.findDOMNode(inventory._addButton)
                .hasAttribute("disabled")).toEqual(false);
            spyOn(inventory, 'handleNew');

            TestUtils.Simulate.click(
                ReactDOM.findDOMNode(inventory._addButton));

            expect(inventory.handleNew).toHaveBeenCalled();
            done();
        }).catch((err) => fail(err));
    });

    it('allows items to be removed', function (done) {
        var initialElem = inventoryEntryFactory({id: 1});
        rest.getData.mockReturnValue(jsonResponse([initialElem]));
        var inventory = getInventory();

        Promise.all(promises).then((data) => {

            expect(inventory.state.inventory.length).toEqual(1);
            expect(inventory.state.inventory[0].id).toEqual(1);

            //TestUtils.Simulate.click(inventory._addButton);
            //
            rest.del.mockReturnValue(jsonResponse());

            inventory.handleRemove(0);

            Promise.all(promises).then((data) => {
                expect(rest.del.mock.calls.length).toEqual(1);
                expect(rest.del.mock.calls[0][0]).toEqual(
                    '/rest/sheets/1/inventory/1/');
                expect(rest.del.mock.calls[0][1]).toEqual(
                    initialElem);
                expect(inventory.state.inventory.length).toEqual(0);
                done();
            }).catch((err) => {
                fail(err)
            });
        }).catch((err) => fail(err));
    });

    it('allows items to be edited', function (done) {
        var initialElem = inventoryEntryFactory({id: 1});
        rest.getData.mockReturnValue(jsonResponse([initialElem]));
        var inventory = getInventory();

        Promise.all(promises).then((data) => {

            expect(inventory.state.inventory.length).toEqual(1);
            expect(inventory.state.inventory[0].id).toEqual(1);

            var newElem = Object.assign({}, initialElem,
                {description: "New description"});

            //TestUtils.Simulate.click(inventory._addButton);
            //
            rest.put.mockReturnValue(jsonResponse(newElem));

            inventory.handleEdit(0, newElem);

            Promise.all(promises).then((data) => {
                expect(rest.put.mock.calls.length).toEqual(1);
                expect(rest.put.mock.calls[0][0]).toEqual(
                    '/rest/sheets/1/inventory/1/');
                expect(rest.put.mock.calls[0][1]).toEqual(
                    newElem);
                expect(inventory.state.inventory.length).toEqual(1);
                expect(inventory.state.inventory[0]).not.toEqual(initialElem);
                expect(inventory.state.inventory[0]).toEqual(newElem);
                done();
            }).catch((err) => {
                fail(err)
            });
        }).catch((err) => fail(err));
    });

    it('reports total weight', function (done) {
        var callback = jasmine.createSpy("callback");

        rest.getData.mockReturnValue(jsonResponse([
            inventoryEntryFactory({id: 2, quantity: 5, unit_weight: 2.3}),
            inventoryEntryFactory({id: 3, quantity: 1, unit_weight: 2.7})
        ]));

        var inventory = getInventory({onWeightChange: callback});

        Promise.all(promises).then((data) => {
            expect(callback).toHaveBeenCalledWith(5 * 2.3 + 2.7);
            done();
        }).catch((err) => fail(err));
    });

    it('reports total weight after removal', function (done) {
        var callback = jasmine.createSpy("callback");

        rest.getData.mockReturnValue(jsonResponse([
            inventoryEntryFactory({id: 2, quantity: 5, unit_weight: 2.3}),
            inventoryEntryFactory({id: 3, quantity: 1, unit_weight: 2.7})
        ]));

        var inventory = getInventory({onWeightChange: callback});

        Promise.all(promises).then((data) => {
            rest.del.mockReturnValue(jsonResponse());

            inventory.handleRemove(0);

            Promise.all(promises).then((data) => {
                expect(callback).toHaveBeenCalledWith(2.7);
                done();
            }).catch((err) => fail(err));

        }).catch((err) => fail(err));
    });


    it('reports total weight after edit', function (done) {
        var callback = jasmine.createSpy("callback");

        var initialElem = {id: 1, quantity: 1, unit_weight: 2.7};
        rest.getData.mockReturnValue(jsonResponse([
            inventoryEntryFactory(initialElem)]));
        var inventory = getInventory({onWeightChange: callback});

        Promise.all(promises).then((data) => {

            var newElem = Object.assign({}, initialElem);
            newElem.quantity = 5;
            rest.put.mockReturnValue(jsonResponse(newElem));

            inventory.handleEdit(0, newElem);

            Promise.all(promises).then((data) => {
                expect(callback).toHaveBeenCalledWith(5 * 2.7);
                done();
            }).catch((err) => fail(err));
        }).catch((err) => fail(err));
    });
});