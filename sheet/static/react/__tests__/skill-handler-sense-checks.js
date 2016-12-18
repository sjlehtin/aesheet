jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';

const factories = require('./factories');
const SkillHandler = require('../SkillHandler').default;

describe('SkillHandler edge skill bonuses', function() {
    "use strict";

    it('handles plain day vision check', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50}});

        expect(handler.dayVisionCheck()).toEqual({check: 50, detectionLevel: 0});
    });

    it('handles plain surprise check', function () {
        const handler = factories.skillHandlerFactory({character: {cur_psy: 50}});

        expect(handler.surpriseCheck()).toEqual(50);
    });

    it('recognizes Acute Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 1}]});

        expect(handler.dayVisionCheck()).toEqual({check: 50, detectionLevel: 1});
    });

    it('handles Color Blind', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Color Blind", level: 1}]});

        expect(handler.dayVisionCheck()).toEqual({check: 45, detectionLevel: 0});
    });

    it('recognizes Poor Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Vision", level: 1}]});

        expect(handler.dayVisionCheck()).toEqual({check: 50, detectionLevel: -1});
    });

    it('handles edge vision modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Peripheral Vision", level: 1, vision: 5}]});

        expect(handler.dayVisionCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('handles armor vision modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_vision: -5}}});
        expect(handler.dayVisionCheck()).toEqual({check: 45, detectionLevel: 0});
    });

    it('handles edge surprise modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_psy: 50},
        edges: [{edge: "Peripheral Vision", level: 1, surprise: 5}]});

        expect(handler.surpriseCheck()).toEqual(55);
    });

    it('handles armor surprise modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_psy: 50},
                            armor: {base: {mod_surprise: -5}}});
        expect(handler.surpriseCheck()).toEqual(45);
    });

    it('handles edge smell modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Excellent Cook", level: 1, smell: 5}]});

        expect(handler.smellCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('handles armor smell modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_smell: -5}}});
        expect(handler.smellCheck()).toEqual({check: 45, detectionLevel: 0});
    });

    it('recognizes Acute Smell and Taste for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Smell and Taste", level: 1}]});

        expect(handler.smellCheck()).toEqual({check: 50, detectionLevel: 1});
    });

    it('recognizes Poor Smell and Taste for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Smell and Taste", level: 1}]});

        expect(handler.smellCheck()).toEqual({check: 50, detectionLevel: -1});
    });

    it('handles edge hearing modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Apt Hunter", level: 1, hear: 5}]});

        expect(handler.hearingCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('handles armor hearing modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_hear: -5}}});
        expect(handler.hearingCheck()).toEqual({check: 45, detectionLevel: 0});
    });

    it('recognizes Acute Hearing for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Hearing", level: 1}]});

        expect(handler.hearingCheck()).toEqual({check: 50, detectionLevel: 1});
    });

    it('recognizes Poor Hearing for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Hearing", level: 1}]});

        expect(handler.hearingCheck()).toEqual({check: 50, detectionLevel: -1});
    });

});