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
jest.dontMock('../DamageControl');
jest.dontMock('../WoundRow');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

var factories = require('./factories');
var testutils = require('./testutils');

const StatBlock = require('../StatBlock').default;
const WoundRow = require('../WoundRow').default;

describe('stat block wounds handling', function(done) {
    "use strict";

    it("can load wounds", function (done) {
        var tree = factories.statBlockTreeFactory({wounds: [
            {effect: "Throat punctured"}]});
        tree.afterLoad(function () {
            var woundRow = TestUtils.findRenderedComponentWithType(tree, WoundRow);
            expect(woundRow.props.wound.effect).toEqual("Throat punctured");
            done();
        });
    });

    it("allows wounds to be modified", function (done) {
        var tree = factories.statBlockTreeFactory({wounds: [
            {id: 2, damage: 5, healed: 0}]});
        rest.patch.mockClear();
        var patchPromise = Promise.resolve({});
        rest.patch.mockReturnValue(patchPromise);
        tree.afterLoad(function () {
            var woundRow = TestUtils.findRenderedComponentWithType(tree, WoundRow);
            TestUtils.Simulate.click(woundRow._healButton);

            expect(rest.patch.mock.calls[0]).toEqual(['/rest/characters/2/wounds/2/', {id: 2, healed: 1}]);

            patchPromise.then(() => {
                var statBlock = TestUtils.findRenderedComponentWithType(tree, StatBlock);
                expect(statBlock.state.woundList).toEqual([
                    factories.woundFactory({id: 2, damage:5, healed: 1})]);
                done();
            });
        });
    });

});