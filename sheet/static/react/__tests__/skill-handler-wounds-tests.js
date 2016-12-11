jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

var factories = require('./factories');

const SkillHandler = require('../SkillHandler').default;

describe('SkillHandler wounds', function() {
    "use strict";

    it('integrates eff stats with wound AA penalties', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_int: 50},
            wounds: [{damage: 2, location: "T"}]
        });

        expect(handler.getEffStats().dex).toEqual(40);
    });

    it('calculates wound penalties with multiple torso wounds', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 2, location: "T"},
                {damage: 3, location: "T"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-25);
    });

    it('calculates penalties with partially healed torso wounds', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 5, healed: 2, location: "T"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-15);
    });

    it('calculates penalties with head wound', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 3, location: "H"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-30);
    });

    it('should recognize small limb wound', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 2, location: "LA"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-0);
    });

    it('should recognize threshold limb wound', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 3, location: "LA"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-5);
    });

    it('should recognize slightly above threshold limb wound', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 4, location: "LA"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-5);
    });

    it('should recognize major limb wound', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 7, location: "LA"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-10);
    });

    it('combines penalties from limb and head wounds', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 3, location: "H"}, {damage: 3, location: "RA"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-35);
    });

    it('calculates penalties from multiple wounds in a location', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 2, location: "RA"}, {damage: 2, location: "RA"},
                {damage: 1, location: "RA"}, {damage: 1, location: "RA"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-10);
    });

    it('calculates penalties taking toughness into account', function () {
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", level: 4}],
            wounds: [{damage: 5, location: "H"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-10);
    });

    it('calculates MOV penalties from multiple wounds taking toughness into' +
        ' account', function () {
        // The Atlas example of the rules.
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", level: 3}],
            wounds: [{damage: 2, location: "RL"}, {damage: 2, location: "RL"},
                {damage: 1, location: "RL"}, {damage: 1, location: "RL"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-5);
    });

    it('does not overdo toughness', function () {
        // The Atlas example of the rules.
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", level: 3}],
            wounds: [{damage: 2, location: "RL"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-0);
    });

    it('calculates MOV penalties from multiple wounds taking toughness into' +
        ' account', function () {
        // The Atlas example of the rules.
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", level: 3}],
            wounds: [{damage: 2, location: "RL"}, {damage: 2, location: "RL"},
                {damage: 1, location: "RL"}, {damage: 1, location: "RL"}]
        });

        expect(handler.getWoundPenalties().mov).toEqual(-30);
    });

    it('should not incur MOV penalty from torso or arms', function () {
        // The Atlas example of the rules.
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", level: 3}],
            wounds: [{damage: 2, location: "RA"}, {damage: 2, location: "LA"},
                {damage: 1, location: "T"}, {damage: 1, location: "H"}]
        });

        expect(handler.getWoundPenalties().mov).toEqual(-0);
    });

    it('integrates eff stats with wound MOV penalties', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_fit: 50},
            wounds: [{damage: 2, location: "RL"}]
        });

        expect(handler.getEffStats().mov).toEqual(30);
    });

    it('combines AA and MOV penalties', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_fit: 50},
            wounds: [{damage: 2, location: "RL"}, {damage: 2, location: "T"}]
        });

        expect(handler.getEffStats().mov).toEqual(20);
    });

});