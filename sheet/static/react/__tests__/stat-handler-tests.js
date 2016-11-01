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
            factories.sheetTransientEffectFactory({effect: {dex: 10}})]});

        expect(handler.getBaseStats().dex).toEqual(50);
        expect(handler.getEffStats().dex).toEqual(60);
        expect(handler.getSoftMods().dex).toEqual(10);
    });

    it('calculates hard mods', function () {
        var handler = getStatHandler({edges: [factories.edgeFactory({dex: 10})]});

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
});