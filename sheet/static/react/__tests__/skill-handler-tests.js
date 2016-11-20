jest.dontMock('../SkillHandler');
jest.dontMock('../StatHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var factories = require('./factories');
var util = require('../sheet-util');

const StatHandler = require('../StatHandler').default;
const SkillHandler = require('../SkillHandler').default;

describe('SkillHandler', function() {
    "use strict";

    var getSkillHandler = factories.skillHandlerFactory;

    it('calculates skill level', function () {
        var handler = getSkillHandler({skills: [
            {skill: "Pistol", level: 1}]});

        expect(handler.skillLevel("Pistol")).toEqual(1);
    });

    it('calculates skill check', function () {
        var handler = getSkillHandler({skills: [
            {skill: "Pistol", level: 1}]});
        expect(handler.skillCheck("Pistol")).toEqual(48);
    });

    it('calculates unskilled check', function () {
        var handler = getSkillHandler({
            skills: [{skill: {name: "Basic Firearms", skill_cost_1: null}, level: 0}],
            allSkills: [{
                name: "Pistol", required_skills: ["Basic Firearms"]}]
        });
        expect(handler.skillCheck("Pistol")).toEqual(util.roundup(43/2));
    });

    it('calculates extremely unskilled check', function () {
        var handler = getSkillHandler({
            allSkills: [{
                name: "Pistol",
                required_skills: ["Basic Firearms"]},
                {name: "Basic Firearms"}]
        });
        expect(handler.skillCheck("Pistol")).toEqual(util.roundup(43/4));
    });

});