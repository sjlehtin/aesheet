jest.dontMock('../WoundPenaltyBox');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const WoundPenalties = require('../WoundPenaltyBox').default;

var factories = require('./factories');

describe('WoundPenaltyBox', function() {
    "use strict";

    var getWoundPenaltyBoxTree = function (givenProps) {
        var props = {handler: factories.skillHandlerFactory(givenProps)};

        return TestUtils.renderIntoDocument(
            <WoundPenalties {...props} />
        );
    };

    var getTextContent = function (givenProps) {
        var tree = getWoundPenaltyBoxTree(givenProps);
        var woundPenalties = TestUtils.findRenderedComponentWithType(tree,
            WoundPenalties);
        return ReactDOM.findDOMNode(woundPenalties).textContent;
    };

    it("indicates AA penalty", function () {
        expect(getTextContent({
            wounds: [{damage: 5, location: "H"}]})).toContain("-50 AA");
    });

});