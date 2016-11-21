jest.dontMock('../StatHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var factories = require('./factories');

const StatHandler = require('../StatHandler').default;

describe('StatHandler', function() {
    "use strict";

    var getStatHandler = function (givenProps) {
        var props = {
            character: factories.characterFactory({cur_ref: 50,
            cur_int: 50}),
            effects: [],
            edges: []
        };
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }

        return new StatHandler(props);
    };

    it('calculates eff stats', function () {
        var handler = getStatHandler();

        expect(handler.getEffStats().dex).toEqual(50);
    });

    it('calculates eff stats', function () {
        var handler = getStatHandler();

        expect(handler.getBaseStats().dex).toEqual(50);
    });

    it('calculates soft mods', function () {
        var handler = getStatHandler({effects: [
            factories.transientEffectFactory({dex: 10})]});

        expect(handler.getBaseStats().dex).toEqual(50);
        expect(handler.getEffStats().dex).toEqual(60);
        expect(handler.getSoftMods().dex).toEqual(10);
    });

    it('calculates hard mods', function () {
        var handler = getStatHandler({edges: [factories.edgeLevelFactory({dex: 10})]});

        expect(handler.getBaseStats().dex).toEqual(60);
        expect(handler.getEffStats().dex).toEqual(60);
        expect(handler.getHardMods().dex).toEqual(10);
    });

    it('accounts for base mods', function () {
        var handler = getStatHandler({character: factories.characterFactory({
            cur_fit: 50, base_mod_fit: -2})});

        expect(handler.getBaseStats().fit).toEqual(48);
        expect(handler.getHardMods().fit).toEqual(0);
    });

    it('calculates weight penalties', function () {
        var handler = getStatHandler({character: factories.characterFactory({
            cur_fit: 50, cur_int: 50, cur_ref: 50, cur_wil: 50}),
            weightCarried: 26});

        expect(handler.getBaseStats().fit).toEqual(50);
        expect(handler.getEffStats().fit).toEqual(44);
        expect(handler.getEffStats().int).toEqual(50);
        expect(handler.getEffStats().dex).toEqual(47);
        expect(handler.getEffStats().ref).toEqual(44);
        expect(handler.getEffStats().mov).toEqual(44);
    });

    it('takes transient effects into account in encumbrance', function () {
        // Transient effect should affect; +10 fit should decrease
        // penalties.
        var handler = getStatHandler({character: factories.characterFactory({
            cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50}),
                effects: [
            factories.transientEffectFactory({fit: 10})],
            weightCarried: 26
        });
        expect(handler.getBaseStats().fit).toEqual(40);
        expect(handler.getEffStats().fit).toEqual(44);
        expect(handler.getEffStats().mov).toEqual(44);
    });

    it('can calculate modifiers from edges', function (){
        var handler = getStatHandler({character: factories.characterFactory({
            cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50}),
                edges: [
            factories.edgeLevelFactory({edge: {name: "Natural climber"}, climb_multiplier: 2}),
            factories.edgeLevelFactory({edge: {name: "Woodsman"}, climb_multiplier: 1.5})
                ],
        });
        expect(handler.getEdgeModifier('climb_multiplier')).toEqual(3.5);
    });

    it('returns a value with unrelated edges', function () {
        var handler = getStatHandler({character: factories.characterFactory({
            cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50}),
                edges: [
            factories.edgeLevelFactory({edge: {name: "Natural climber"}, climb_multiplier: "2.0"}),
            factories.edgeLevelFactory({edge: {name: "Woodsman"}, climb_multiplier: "1.5"})
                ],
        });
        expect(handler.getEdgeModifier('swim_multiplier')).toEqual(0);

    });

    it('returns a value without edges', function () {
        var handler = getStatHandler({character: factories.characterFactory({
            cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50})
        });
        expect(handler.getEdgeModifier('swim_multiplier')).toEqual(0);
    });

    it('can calculate modifiers from effects', function (){
        var handler = getStatHandler({character: factories.characterFactory({
            cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50}),
                effects: [
            factories.transientEffectFactory({swim_multiplier: "2.0"})],
        });
        expect(handler.getEffectModifier('swim_multiplier')).toEqual(2);
    });

    it('takes armor into account with penalties', function () {
        var handler = getStatHandler({
            character: factories.characterFactory({
                cur_fit: 40, cur_int: 50, cur_ref: 45, cur_psy: 50
            }),
            armor: factories.armorFactory({
                base: {
                    mod_fit: -2,
                    mod_ref: -3,
                    mod_psy: -5
                }
            }),
        });
        expect(handler.getEffStats().fit).toEqual(38);
        expect(handler.getEffStats().ref).toEqual(42);
        expect(handler.getEffStats().psy).toEqual(45);
    });

    it('takes armor quality into account with penalties', function () {
        var handler = getStatHandler({
            character: factories.characterFactory({
                cur_fit: 40, cur_int: 50, cur_ref: 45, cur_psy: 50
            }),
            armor: factories.armorFactory({
                base: {
                    mod_fit: -2,
                    mod_ref: -3,
                    mod_psy: -5
                },
                quality: {
                    mod_fit: 1,
                    mod_ref: 2,
                    mod_psy: 3
                }
            }),
        });
        expect(handler.getEffStats().fit).toEqual(39);
        expect(handler.getEffStats().ref).toEqual(44);
        expect(handler.getEffStats().psy).toEqual(48);
    });

});