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
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

var factories = require('./factories');
var testutils = require('./testutils');

const StatBlock = require('../StatBlock').default;

describe('stat block armor handling', function(done) {
    "use strict";

    it("can load armor", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(block.state.armor.base).toBe(undefined);
            block.handleArmorLoaded(factories.armorFactory(
                {base: {weight: 8}}));
            expect(block.state.armor.base.weight).toEqual(8);
            done();
        });
    });

    it("loads armor", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(testutils.getAllArgumentsByPosition(rest.getData.mock.calls, 0)
                ).toContain('/rest/sheets/1/sheetarmor/');
            done();
        });
    });

    it("loads helm", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(testutils.getAllArgumentsByPosition(rest.getData.mock.calls, 0)
                ).toContain('/rest/sheets/1/sheethelm/');
            done();
        });
    });

    it("can change armor", function (done) {
        var block = factories.statBlockFactory();
        var armor = factories.armorFactory(
                {base: {is_helm: true, weight: 8}});
        var promise = Promise.resolve(
            Object.assign({}, armor, {id: 1, name: "foo armor"}));
        rest.post.mockReturnValue(promise);
        block.afterLoad(function () {
            expect(block.state.armor.base).toBe(undefined);
            block.handleArmorChanged(factories.armorFactory({base: {weight: 8}}));
            promise.then(() => {
                expect(block.state.armor.base.weight).toEqual(8);
                // TODO: change armor with REST.
                done();
            });
        });
    });

    it("can load helm", function (done) {
        var armor = factories.armorFactory(
                {base: {is_helm: true, weight: 8}});
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(block.state.helm.base).toBe(undefined);
            block.handleHelmLoaded(armor);
            expect(block.state.helm.base.weight).toEqual(8);
            done();
        });
    });

    it("can change the helm", function (done) {
        var block = factories.statBlockFactory();
        var armor = factories.armorFactory({base: {is_helm: true, weight: 8}});
        var promise = Promise.resolve(
            Object.assign({}, armor, {id: 1, name: "foo armor"}));
        rest.post.mockReturnValue(promise);
        block.afterLoad(function () {
            expect(block.state.helm.base).toBe(undefined);
            block.handleHelmChanged(armor);
            promise.then(() => {
                expect(block.state.helm.base.weight).toEqual(8);
                done();
            });
        });
    });

    it("can remove the helm", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleHelmLoaded(factories.armorFactory({base: {is_helm: true, weight: 8}}));
            expect(block.state.helm.base.weight).toEqual(8);

            var promise = Promise.resolve({});
            rest.delete.mockReturnValue(promise);

            block.handleHelmChanged(null);

            promise.then(() => {
                expect(block.state.helm).toEqual({});
                done();
            });
        });
    });

    it("can remove the armor", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleArmorLoaded(factories.armorFactory({base: {weight: 8}}));
            expect(block.state.armor.base.weight).toEqual(8);

            var promise = Promise.resolve({});
            rest.delete.mockReturnValue(promise);

            block.handleArmorChanged(null);

            promise.then(() => {
                expect(block.state.armor).toEqual({});
                done();
            });
        });
    });

    it("does not have a problem with removing armor twice", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            block.handleArmorLoaded(factories.armorFactory({base: {weight: 8}}));
            expect(block.state.armor.base.weight).toEqual(8);

            var promise = Promise.resolve({});
            rest.delete.mockReturnValue(promise);

            block.handleArmorChanged(null);

            promise.then(() => {
                expect(block.state.armor).toEqual({});
                block.handleArmorChanged(null);
                promise.then(() => {
                    done();
                });
            });
        });
    });

});