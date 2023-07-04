jest.dontMock('InitiativeBlock');
jest.dontMock('sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

var factories = require('./factories');

const InitiativeBlock = require('InitiativeBlock').default;

describe('InitiativeBlock', function() {
    "use strict";

    var getInitiativeBlock = function (props) {
        if (!props) {
            props = {};
        }
        var skillHandlerProps = {};
        if (props.stats) {
            skillHandlerProps = props.stats;
            delete props.stats;
        }
        props.stats  = factories.skillHandlerFactory(
            skillHandlerProps);
        var node = TestUtils.renderIntoDocument(
            <InitiativeBlock {...props} />);

        return TestUtils.findRenderedComponentWithType(node,
            InitiativeBlock);
    };

    it('allows calculating initiatives for arbitrary values', function () {
        var block = getInitiativeBlock({stats: {
            character: {
                cur_fit: 52,
                cur_ref: 52
            }}});
        var calculated  = block.initiatives(20, [30, 20, 10, 5, 2]);
        expect(calculated).toEqual([-12,-8,-4,-2,-1]);
    });

    it('allows free-form input', function () {
        var block = getInitiativeBlock({stats: {
            character: {
                cur_fit: 52,
                cur_ref: 52
            }}});
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