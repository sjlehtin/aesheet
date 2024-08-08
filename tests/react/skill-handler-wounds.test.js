import * as factories from './factories'

const SkillHandler = require('SkillHandler').default;

describe('SkillHandler wounds', function() {

    it('returns healthy status without damage', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_int: 50}
        });

        expect(handler.getStatus()).toEqual(SkillHandler.STATUS_OK);
    });

    it('returns disabled status when stamina is negative', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_wil: 50},
            staminaDamage: 25
        });
        expect(handler.getACPenalty().value).toBeLessThanOrEqual(-20)
        expect(handler.getStatus()).toEqual(SkillHandler.STATUS_CRITICAL);
    });

    it('integrates eff stats with wound AA penalties', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_int: 50},
            wounds: [{damage: 2, location: "T"}]
        });

        expect(handler.getEffStats().dex.value()).toEqual(40);
    });

    it('calculates wound penalties with multiple torso wounds', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 2, location: "T"},
                {damage: 3, location: "T"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-25);
        expect(handler.getStatus()).toEqual(SkillHandler.STATUS_CRITICAL)
    });

    it('calculates penalties with partially healed torso wounds', function () {
        var handler = factories.skillHandlerFactory({
            wounds: [{damage: 5, healed: 2, location: "T"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-15);
        expect(handler.getStatus()).toEqual(SkillHandler.STATUS_WOUNDED)
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
            character: { cur_fit: 81},
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
            character: {cur_fit: 81},
            wounds: [{damage: 2, location: "RA"}, {damage: 2, location: "RA"},
                {damage: 1, location: "RA"}, {damage: 1, location: "RA"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-10);
    });

    it('calculates penalties taking toughness into account', function () {
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", toughness: 4, level: 4}],
            wounds: [{damage: 5, location: "H"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-10);
    });

    it('calculates AA penalty from multiple wounds taking toughness into' +
        ' account', function () {
        // The Atlas example of the rules.
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", toughness: 3, level: 3}],
            wounds: [{damage: 2, location: "RL"}, {damage: 2, location: "RL"},
                {damage: 1, location: "RL"}, {damage: 1, location: "RL"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-5);
    });

    it('does not overdo toughness', function () {
        // The Atlas example of the rules.
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", toughness: 3, level: 3}],
            wounds: [{damage: 2, location: "RL"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-0);
    });

    it('calculates MOV penalties from multiple wounds taking toughness into' +
        ' account', function () {
        // The Atlas example of the rules.
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", toughness: 3, level: 3}],
            wounds: [{damage: 2, location: "RL"}, {damage: 2, location: "RL"},
                {damage: 1, location: "RL"}, {damage: 1, location: "RL"}]
        });

        expect(handler.getWoundPenalties().mov).toEqual(-30);
    });

    it('should not incur MOV penalty from torso or arms', function () {
        // The Atlas example of the rules.
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", toughness: 3, level: 3}],
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

        expect(handler.getEffStats().mov.value()).toEqual(30);
    });

    it('combines AA and MOV penalties', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_fit: 50},
            wounds: [{damage: 2, location: "RL"}, {damage: 2, location: "T"}]
        });

        expect(handler.getEffStats().mov.value()).toEqual(20);
    });

    it('calculates penalties to wounds to left arm', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_fit: 81},
            wounds: [{damage: 5, location: "LA"}]
        });

        expect(handler.getWoundPenalties().la_fit_ref).toEqual(-50);
    });

    it('calculates penalties to wounds to right arm with toughness', function () {
        var handler = factories.skillHandlerFactory({
            edges: [{edge: "Toughness", toughness: 3, level: 3}],
            wounds: [{damage: 5, location: "RA"}]
        });

        expect(handler.getWoundPenalties().ra_fit_ref).toEqual(-20);
    });

    it('recognizes maximum penalties to arm', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 81},
            wounds: [{damage: 20, location: "RA"}]
        });

        expect(handler.getWoundPenalties().aa).toEqual(-10);
        //expect(handler.getWoundPenalties().ra_fit_ref).toEqual(-Infinity);
    });

    it('recognizes maximum penalties to leg', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 81},
            wounds: [{damage: 20, location: "LL"}]
        });

        expect(handler.getWoundPenalties().mov).toEqual(-75);
        expect(handler.getWoundPenalties().aa).toEqual(-10);
    });

    it('recognizes maximum penalties to torso', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 105},
            wounds: [{damage: 25, location: "T"}]
        });

        expect(handler.getWoundPenalties().mov).toEqual(-0);
        expect(handler.getWoundPenalties().aa).toEqual(-100);
    });

    it('recognizes maximum penalties to torso', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 130},
            wounds: [{damage: 25, location: "H"}]
        });

        expect(handler.getWoundPenalties().mov).toEqual(-0);
        expect(handler.getWoundPenalties().aa).toEqual(-120);
    });

    it('calculates stamina damage', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 51},
            staminaDamage: 5
        });

        expect(handler.getStaminaDamage()).toEqual(5)
    });

    it('calculates damage including from massive wounds', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 51},
            staminaDamage: 5,
            wounds: [{damage: 10, location: "RA"}]
        });

        expect(handler.getCurrentBody()).toEqual(9)
        // Damage is capped at 4 pts due to 4 pt threshold in arm.
        expect(handler.getStaminaDamage()).toEqual(9)
    });

    it('calculates damage including from multiple massive wounds', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 80},

            wounds: [{damage: 11, location: "RA"},
                {damage: 11, location: "LA"}],
            staminaDamage: 5
        });

        expect(handler.getStaminaDamage()).toEqual(15)
        expect(handler.getCurrentBody()).toEqual(8)
        expect(handler.getWoundPenalties().aa).toEqual(-20)
    });

    it('takes pain resistance edge in account', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 80},
            edges: [{edge: "Pain Resistance", level: 1, pain_resistance: 1}],

            wounds: [{damage: 11, location: "RA"},
                {damage: 11, location: "LA"}],
            staminaDamage: 30
        });

        expect(handler.getStaminaDamage()).toEqual(40)
        expect(handler.getCurrentBody()).toEqual(8)
        expect(handler.getWoundPenalties().aa).toEqual(-0)
        expect(handler.getStatus()).toEqual(SkillHandler.STATUS_WOUNDED)
    });

});