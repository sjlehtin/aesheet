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

        var doc = TestUtils.renderIntoDocument(
            <MovementRates
                skillHandler={skillHandler}
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