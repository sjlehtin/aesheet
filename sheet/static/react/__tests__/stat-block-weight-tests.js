jest.dontMock('../StatBlock');
jest.dontMock('../StatRow');
jest.dontMock('../XPControl');
jest.dontMock('../AddSPControl');
jest.dontMock('../NoteBlock');
jest.dontMock('../InitiativeBlock');
jest.dontMock('../Loading');
jest.dontMock('../SkillTable');
jest.dontMock('../SkillRow');
jest.dontMock('../AddSkillControl');
jest.dontMock('../SkillHandler');
jest.dontMock('../StatHandler');
jest.dontMock('../WeaponRow');
jest.dontMock('../RangedWeaponRow');
jest.dontMock('../AddWeaponControl');
jest.dontMock('../AddRangedWeaponControl');
jest.dontMock('../FirearmControl');
jest.dontMock('../AddFirearmControl');
jest.dontMock('../TransientEffectRow');
jest.dontMock('../AddTransientEffectControl');
jest.dontMock('../Inventory');
jest.dontMock('../InventoryRow');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

var factories = require('./factories');

const StatBlock = require('../StatBlock').default;
const Inventory = require('../Inventory').default;

describe('stat block weight handling', function() {
    "use strict";

    it("can calculate weight", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {

            expect(block.getCarriedWeight()).toEqual(0);

            block.inventoryWeightChanged(5.5);

            expect(block.getCarriedWeight()).toEqual(5.5);

            expect(block.getStatHandler().getEffStats().ref).toBeLessThan(
                block.getStatHandler().getBaseStats().ref);
            done();
        });
    });

    it("integrates with Inventory", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {

            expect(block.getCarriedWeight()).toEqual(0);

            var inventoryControl = TestUtils.findRenderedComponentWithType(
                block, Inventory);

            inventoryControl.updateInventory([
                factories.inventoryEntryFactory({unit_weight: "5.5",
                quantity: 1})]);
            expect(block.getCarriedWeight()).toEqual(5.5);

            done();
        });
    });

    it("adds armor weight", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {

            done();
        });
    });

    it("adds helm weight", function (done) {

    });

    // it("adds close combat weapons weight", function (done) {
    //
    // });

    // it("adds ranged weapons weight", function (done) {
    //
    // });

    // it("adds firearms weight", function (done) {
    //
    // });
});