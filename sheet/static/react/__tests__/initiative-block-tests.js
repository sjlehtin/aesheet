jest.dontMock('../InitiativeBlock');
jest.dontMock('../sheet-util');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const InitiativeBlock = require('../InitiativeBlock').default;

describe('InitiativeBlock', function() {
    "use strict";

    var getInitiativeBlock = function (givenProps) {
        var props;
        if (typeof(givenProps) === "object") {
            props = givenProps;
        } else {
            props = {};
        }

        var node = TestUtils.renderIntoDocument(
            <InitiativeBlock {...props} />);

        return TestUtils.findRenderedComponentWithType(node,
            InitiativeBlock);
    };

    it('allows calculating initiatives for arbitrary values', function () {
        var block = getInitiativeBlock({effMOV: 52});
        var calculated  = block.initiatives(20, [30, 20, 10, 5, 2]);
        expect(calculated).toEqual([-12,-8,-4,-2,-1]);
    });

    it('allows free-form input', function () {
        var block = getInitiativeBlock({effMOV: 52});
        TestUtils.Simulate.change(ReactDOM.findDOMNode(block._inputNode),
            {target: {value: "25"}})
        var rows = ReactDOM.findDOMNode(block).querySelectorAll('tbody tr');
        var calculated = [];
        for (var row of rows) {
            calculated.push(parseInt(
                row.querySelectorAll('td')[1].textContent));
        }
        expect(calculated).toEqual([-10, -15, -29]);
    });
});