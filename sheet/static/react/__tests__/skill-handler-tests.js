jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var factories = require('./factories');

const SkillHandler = require('../SkillHandler').default;

describe('SkillHandler', function() {
    "use strict";

    var getSkillHandler = function (givenProps) {
        var props = {
            characterSkills: [factories.characterSkillFactory({
                skill: "Pistol",
                level: 1
            }),
            factories.characterSkillFactory({
                skill: "Basic Firearms",
                level: 0
            })],
            allSkills: [
                factories.skillFactory({
                    name: "Pistol", stat: "DEX",
                    required_skills: ["Basic Firearms"]
                }),
                factories.skillFactory({name: "Basic Firearms", stat: "INT"})
            ],
            stats: factories.statsFactory({dex: 50})
        };
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }

        return new SkillHandler(props);
    };

    it('calculates skill level', function () {
        var handler = getSkillHandler();

        expect(handler.skillLevel("Pistol")).toEqual(1);
    });

    it('calculates skill check', function () {
        var handler = getSkillHandler();
        expect(handler.skillCheck("Pistol")).toEqual(55);
    });

    it('calculates unskilled check', function () {
        var handler = getSkillHandler({characterSkills: [
            factories.characterSkillFactory({
                skill: "Basic Firearms",
                level: 0
            })]});
        expect(handler.skillCheck("Pistol")).toEqual(25);
    });

    it('calculates extremely unskilled check', function () {
        var handler = getSkillHandler({characterSkills: []});
        expect(handler.skillCheck("Pistol")).toEqual(13);
    });

});