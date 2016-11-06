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
            expect(block.state.armor).toBe(undefined);
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
        block.afterLoad(function () {
            expect(block.state.armor).toBe(undefined);
            block.handleArmorChanged(factories.armorFactory({base: {weight: 8}}));
            expect(block.state.armor.base.weight).toEqual(8);
            // TODO: change armor with REST.
            done();
        });
    });

    it("can load helm", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(block.state.helm).toBe(undefined);
            block.handleHelmLoaded(factories.armorFactory(
                {base: {is_helm: true, weight: 8}}));
            expect(block.state.helm.base.weight).toEqual(8);
            done();
        });
    });

    it("can change the helm", function (done) {
        var block = factories.statBlockFactory();
        block.afterLoad(function () {
            expect(block.state.helm).toBe(undefined);
            block.handleHelmChanged(factories.armorFactory({base: {is_helm: true, weight: 8}}));
            expect(block.state.helm.base.weight).toEqual(8);
            // TODO: change armor with REST.
            done();
        });
    });
});