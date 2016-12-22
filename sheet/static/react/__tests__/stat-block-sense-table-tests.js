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
jest.dontMock('../AddWoundControl');
jest.dontMock('../WoundPenaltyBox');
jest.dontMock('../SenseTable');
jest.dontMock('../sheet-util');
jest.dontMock('./testutils');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const factories = require('./factories');

const SenseTable = require('../SenseTable').default;

describe('stat block -- sense table', function() {
    "use strict";

    it('contains a SenseTable component', function (done) {
        let block = factories.statBlockFactory();
        block.afterLoad(function () {
            const senseTable = TestUtils.findRenderedComponentWithType(
                block, SenseTable);
            expect(TestUtils.isCompositeComponent(senseTable)).toBe(true);
            done();
        });
    });

});
