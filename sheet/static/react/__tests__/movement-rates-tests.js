jest.dontMock('../MovementRates');
jest.dontMock('../StatHandler');
jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var factories = require('./factories');

const StatHandler = require('../StatHandler').default;
const SkillHandler = require('../SkillHandler').default;
const MovementRates = require('../MovementRates').default;

describe('MovementRates', function() {
    "use strict";

    var getSkillHandler = function (givenProps) {
        if (!givenProps) {
            givenProps = {};
        }

        var edgeList = [];
        var skills = [];
        var allSkills = [];
        var effects = [];

        if (givenProps.skills) {
            for (let sk of givenProps.skills) {
                var skill = factories.characterSkillFactory(sk);
                skills.push(skill);
                allSkills.push(factories.skillFactory({name: skill.skill}));
            }
        }
        if (givenProps.edges) {
            for (let edge of givenProps.edges) {
                var createdEdge = factories.edgeLevelFactory(edge);
                edgeList.push(createdEdge);
            }
        }
        if (givenProps.effects) {
            for (let eff of givenProps.effects) {
                var createdEff = factories.transientEffectFactory(eff);
                effects.push(createdEff);
            }
        }

        var statHandler = new StatHandler({
            character: factories.characterFactory(
                Object.assign({cur_fit: 43, cur_ref: 43},
                    givenProps.character)),
            edges: edgeList,
            effects: effects
            });

        return new SkillHandler({
                    stats: statHandler, edges: edgeList,
                    characterSkills: skills, allSkills: allSkills});
    };

    var getMovementRates = function (givenProps) {
        var skillHandler = getSkillHandler(givenProps);

        if (!givenProps) {
            givenProps = {};
        }

        var edgeList = [];
        var skills = [];
        var allSkills = [];
        var effects = [];

        if (givenProps.skills) {
            for (let sk of givenProps.skills) {
                var skill = factories.characterSkillFactory(sk);
                skills.push(skill);
                allSkills.push(factories.skillFactory({name: skill.skill}));
            }
        }
        if (givenProps.edges) {
            for (let edge of givenProps.edges) {
                var createdEdge = factories.edgeLevelFactory(edge);
                edgeList.push(createdEdge);
            }
        }
        if (givenProps.effects) {
            for (let eff of givenProps.effects) {
                var createdEff = factories.transientEffectFactory(eff);
                effects.push(createdEff);
            }
        }
        var statHandler = new StatHandler({
            character: factories.characterFactory(
                Object.assign({cur_fit: 43, cur_ref: 43},
                    givenProps.character)),
            edges: edgeList,
            effects: effects
            });

        var doc = TestUtils.renderIntoDocument(
            <MovementRates
                skillHandler={skillHandler}
                statHandler={statHandler}
            />);
        return TestUtils.findRenderedComponentWithType(doc, MovementRates);
    };

    it('can render', function () {
        // No effect from edges, effects to sneaking.
        var handler = getMovementRates({effects: [
            {name: "Boots of speed", run_multiplier: 2}]});

        expect(handler).not.toBe(undefined);
    });

});