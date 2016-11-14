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
jest.dontMock('../ArmorControl');
jest.dontMock('../AddArmorControl');
jest.dontMock('../MiscellaneousItemRow');
jest.dontMock('../AddMiscellaneousItemControl');
jest.dontMock('../EdgeRow');
jest.dontMock('../AddCharacterEdgeControl');
jest.dontMock('../CharacterNotes');
jest.dontMock('../MovementRates');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
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
            var armor = factories.armorFactory({base: {weight: 8}});
            var promise = Promise.resolve(
            Object.assign({}, armor, {id: 1, name: "foo armor"}));
            rest.post.mockReturnValue(promise);

            block.handleArmorChanged(armor);
            promise.then(() => {
                expect(block.getCarriedWeight()).toEqual(8);
                done();
            });
        });
    });

    it("accounts for armor quality", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            var armor = factories.armorFactory({
                base: {weight: 8},
                quality: {mod_weight_multiplier: 0.8}});
            var promise = Promise.resolve(
            Object.assign({}, armor, {id: 1, name: "foo armor"}));
            rest.post.mockReturnValue(promise);

            block.handleArmorChanged(armor);

            promise.then(() => {
                expect(block.getCarriedWeight()).toEqual(6.4);
                done();
            });
        });
    });

    it("adds helm weight", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(block.getCarriedWeight()).toEqual(0);
            var armor = factories.armorFactory({
                base: {is_helm:true, weight: 8},
                quality: {mod_weight_multiplier: 0.8}});
            var promise = Promise.resolve(
            Object.assign({}, armor, {id: 1, name: "foo armor"}));
            rest.post.mockReturnValue(promise);

            block.handleHelmChanged(armor);

            promise.then(() => {
                expect(block.getCarriedWeight()).toEqual(6.4);
                done();
            });
        });
    });

    it("adds close combat weapons weight", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleWeaponsLoaded([factories.weaponFactory({
                base: {weight: 6},
                quality: {weight_multiplier: 0.5}})]);
            expect(block.getCarriedWeight()).toEqual(3.0);
            done();
        });
    });

    it("adds ranged weapons weight", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleRangedWeaponsLoaded([factories.rangedWeaponFactory({
                base: {weight: 6},
                quality: {weight_multiplier: 0.5}})]);
            expect(block.getCarriedWeight()).toEqual(3.0);
            done();
        });
    });

    it("adds firearms weight", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleFirearmsLoaded([factories.firearmFactory({
                base: {weight: 6}})]);
            expect(block.getCarriedWeight()).toEqual(6.0);
            done();
        });
    });

    it("adds miscellaneous items weight", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleMiscellaneousItemsLoaded([factories.sheetMiscellaneousItemFactory({
                item: {weight: 2}})]);
            expect(block.getCarriedWeight()).toEqual(2);
            done();
        });
    });

    it("handles lists of weapons", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleWeaponsLoaded([factories.weaponFactory({
                base: {weight: 3}}),
            factories.weaponFactory({base: {weight: 4}})]);
            expect(block.getCarriedWeight()).toEqual(7.0);
            done();
        });
    });
});