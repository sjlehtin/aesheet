jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

var factories = require('./factories');
var util = require('../sheet-util');

const SkillHandler = require('../SkillHandler').default;

describe('SkillHandler', function() {
    "use strict";

    it('calculates skill level', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Pistol", level: 1}]});

        expect(handler.skillLevel("Pistol")).toEqual(1);
    });

    it('calculates skill check', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Pistol", level: 1}]});
        expect(handler.skillCheck("Pistol")).toEqual(48);
    });

    it('calculates skill check for zero cost skill', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_fit: 48},
            allSkills: [
            {name: "Endurance/run", level: 0, skill_cost_0: 0, stat: "FIT"}]});
        expect(handler.skillCheck("Endurance/run")).toEqual(48);
    });

    it('calculates unskilled check', function () {
        var handler = factories.skillHandlerFactory({
            skills: [{skill: {name: "Basic Firearms", skill_cost_1: null}, level: 0}],
            allSkills: [{
                name: "Pistol", required_skills: ["Basic Firearms"]}]
        });
        expect(handler.skillCheck("Pistol")).toEqual(util.roundup(43/2));
    });

    it('calculates extremely unskilled check', function () {
        var handler = factories.skillHandlerFactory({
            allSkills: [{
                name: "Pistol",
                required_skills: ["Basic Firearms"]}
                ]
        });
        expect(handler.skillCheck("Pistol")).toEqual(util.roundup(43/4));
    });
    
    it("mangles skill list to respect requirements order", function () {
        var handler = factories.skillHandlerFactory({
            skills: [
                {skill: "Naval Gunnery", level: 1},
                {skill: "Basic Artillery", level: 0},
                {skill: "Agriculture", level: 3}],
            allSkills: [
                {name: "Agriculture"},
                {name: "Basic Artillery"},
                {name: "Naval Gunnery",
                    required_skills: ["Basic Artillery"]}
        ]});

        var newList = handler.getSkillList();
        expect(newList[0].skill).toEqual("Agriculture");
    });

    it("finds missing skills while mangling from all requires", function () {
        var handler = factories.skillHandlerFactory({
            skills: [
                {skill: "Naval Gunnery", level: 1},
                {skill: "Basic Artillery", level: 0},
                {skill: "Agriculture", level: 3}],
            allSkills: [
                {name: "Agriculture"},
                {name: "Basic Artillery"},
                {name: "Naval Gunnery",
                    required_skills: ["Basic Artillery", "Gardening"]}
        ]});

        var newList = handler.getSkillList();
        expect(newList[2].skill).toEqual("Naval Gunnery");
        expect(newList[2]._missingRequired).toEqual(["Gardening"]);
    });

    it("does not choke on multiple required skills", function () {
        var handler = factories.skillHandlerFactory({
            skills: [
                {skill: "Florism", level: 1},
                {skill: "Aesthetism", level: 0},
                {skill: "Gardening", level: 0},
                {skill: "Agriculture", level: 3}],
            allSkills: [
                {name: "Agriculture"},
                {name: "Gardening",
                required_skills: ["Agriculture"]},
                {name: "Florism",
                required_skills: ["Gardening", "Aesthetism"]},
                {name: "Aesthetism"}
        ]});

        var newList = handler.getSkillList();

        expect(newList[0].skill).toEqual("Aesthetism");
        expect(newList[0].indent).toEqual(0);
        expect(newList[1].skill).toEqual("Agriculture");
        expect(newList[1].indent).toEqual(0);
        expect(newList[2].indent).toEqual(1);
        expect(newList[3].skill).toEqual("Florism");
        expect(newList[3].indent).toEqual(2);
    });


    it("calculates indent for nested required skills while mangling", function () {
        var skillList = [
            factories.characterSkillFactory(
                {skill: "Florism", level: 1}),
            factories.characterSkillFactory(
                {skill: "Gardening", level: 0}),
            factories.characterSkillFactory(
                {skill: "Agriculture", level: 3})
        ];
        var allSkills = [factories.skillFactory({name: "Agriculture"}),
            factories.skillFactory({name: "Gardening",
                required_skills: ["Agriculture"]}),
            factories.skillFactory({name: "Florism",
                required_skills: ["Gardening"]})
        ];
        var handler = factories.skillHandlerFactory({
            skills: [
                {skill: "Florism", level: 1},
                {skill: "Gardening", level: 0},
                {skill: "Agriculture", level: 3}],
            allSkills: [
                {name: "Agriculture"},
                {name: "Gardening",
                required_skills: ["Agriculture"]},
                {name: "Florism",
                required_skills: ["Gardening"]}
        ]});

         var newList = handler.getSkillList();
        expect(newList[0].skill).toEqual("Agriculture");
        expect(newList[0].indent).toEqual(0);
        expect(newList[1].indent).toEqual(1);
        expect(newList[2].skill).toEqual("Florism");
        expect(newList[2].indent).toEqual(2);
    });

});