jest.dontMock('../MovementRates');
jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import TestUtils from 'react-addons-test-utils';

var factories = require('./factories');

const SkillHandler = require('../SkillHandler').default;
const MovementRates = require('../MovementRates').default;

describe('MovementRates', function() {
    "use strict";

    var getMovementRates = function (givenProps) {
        var skillHandler = factories.skillHandlerFactory(givenProps);

        if (!givenProps) {
            givenProps = {};
        }

        var edgeList = [];
        var effects = [];

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
        var statHandler = factories.skillHandlerFactory({
            character:
                Object.assign({cur_fit: 43, cur_ref: 43},
                    givenProps.character),
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