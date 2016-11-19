jest.dontMock('../StatHandler');
jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';

var factories = require('./factories');

const StatHandler = require('../StatHandler').default;
const SkillHandler = require('../SkillHandler').default;

describe('SkillHandler movement rates', function() {
    "use strict";

    it('calculates unskilled climbing speed', function () {
        var handler = factories.skillHandlerFactory();

        expect(handler.climbingSpeed()).toBeCloseTo(43/60);
    });

    it('calculates level 0 climbing speed', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Climbing", level: 0}]});

        expect(handler.climbingSpeed()).toBeCloseTo(43/30);
    });

    it('calculates level 3 climbing speed', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Climbing", level: 3}]});

        expect(handler.climbingSpeed()).toBeCloseTo(43/30 + 3);
    });

    it('accounts for Natural Climber edge', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Climbing", level: 3}],
            edges: [{edge: {name: "Natural Climber"}, level: 1, climb_multiplier: 2}]});

        expect(handler.climbingSpeed()).toBeCloseTo((43/30 + 3)*2);
    });

    it('accounts for Natural Climber edge and effect', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Climbing", level: 3}],
            edges: [{edge: {name: "Natural Climber"}, level: 1, climb_multiplier: 2}],
            effects: [{name: "Boots of climbing", climb_multiplier: 2}]
        });

        expect(handler.climbingSpeed()).toBeCloseTo((43/30 + 3)*2*2);
    });

     it('calculates unskilled swimming speed', function () {
        var handler = factories.skillHandlerFactory();

        expect(handler.swimmingSpeed()).toBeCloseTo(43/10);
    });

    it('calculates level 0 swimming speed', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Swimming", level: 0}]});

        expect(handler.swimmingSpeed()).toBeCloseTo(43/5);
    });

    it('calculates level 3 swimming speed', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Swimming", level: 3}]});

        expect(handler.swimmingSpeed()).toBeCloseTo(43/5 + 3*5);
    });

    it('accounts for Natural Swimmer edge', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Swimming", level: 3}],
            edges: [{edge: {name: "Natural Swimmer"}, level: 1, swim_multiplier: 2}]});

        expect(handler.swimmingSpeed()).toBeCloseTo((43/5 + 3*5)*2);
    });

    it('accounts for Natural Swimmer edge and effect', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Swimming", level: 3}],
            edges: [{edge: {name: "Natural Swimmer"}, level: 1, swim_multiplier: 2}],
            effects: [{name: "Boots of swimming", swim_multiplier: 2}]
        });

        expect(handler.swimmingSpeed()).toBeCloseTo((43/5 + 3*5)*2*2);
    });
   
    it('defaults to not flying', function () {
        var handler = factories.skillHandlerFactory();

        expect(handler.flyingSpeed()).toBeCloseTo(0);
    });

    it('allows flying effects', function () {
        var handler = factories.skillHandlerFactory({
            effects: [{name: "Wings of flying", fly_multiplier: 6}]
        });

        expect(handler.flyingSpeed()).toBeCloseTo(6*43);
    });

    it('calculates unskilled jumping distance', function () {
        var handler = factories.skillHandlerFactory();

        expect(handler.jumpingDistance()).toBeCloseTo(43/24);
    });

    it('calculates level 0 jumping distance', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 0}]});

        expect(handler.jumpingDistance()).toBeCloseTo(43/12);
    });

    it('calculates level 3 jumping distance', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 3}]});

        expect(handler.jumpingDistance()).toBeCloseTo(43/12 + 3*0.75);
    });

    it('accounts for Natural Jumper edge', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 3}],
            edges: [{edge: {name: "Natural Jumper"}, level: 1, run_multiplier: 2}]});

        expect(handler.jumpingDistance()).toBeCloseTo((43/12 + 3*0.75)*2);
    });

    it('accounts for Natural Jumper edge and effect', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 3}],
            edges: [{edge: {name: "Natural Jumper"}, level: 1, run_multiplier: 2}],
            effects: [{name: "Boots of jumping", run_multiplier: 2}]
        });

        expect(handler.jumpingDistance()).toBeCloseTo((43/12 + 3*0.75)*2*2);
    });

    it('calculates jumping height', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 3}]});

        expect(handler.jumpingHeight()).toBeCloseTo((43/12 + 3*0.75)/3);
    });

    it('calculates running speed', function () {
        var handler = factories.skillHandlerFactory({effects: [
            {name: "Boots of speed", run_multiplier: 2}]});

        expect(handler.runningSpeed()).toBeCloseTo(43 * 2);
    });

    it('calculates sprinting speed', function () {
        var handler = factories.skillHandlerFactory({effects: [
            {name: "Boots of speed", run_multiplier: 2}]});

        expect(handler.sprintingSpeed()).toBeCloseTo(43 * 2 * 1.5);
    });

    it('calculates sneaking speed', function () {
        // No effect from edges, effects to sneaking.
        var handler = factories.skillHandlerFactory({effects: [
            {name: "Boots of speed", run_multiplier: 2}]});

        expect(handler.sneakingSpeed()).toBeCloseTo(43/5);
    });

});