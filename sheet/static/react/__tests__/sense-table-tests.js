jest.dontMock('../SkillHandler');
jest.dontMock('../SenseTable');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const SenseTable = require('../SenseTable').default;

const factories = require('./factories');

describe('SenseTable', function() {
    "use strict";

    let getSenseTableTree = function (givenProps) {
        var props = givenProps;
        if (!props) {
            props = {};
        }
        props.handler = factories.skillHandlerFactory(givenProps);

        return TestUtils.renderIntoDocument(
            <SenseTable {...props} />
        );
    };

    let getSenseTable = function (givenProps) {
        return TestUtils.findRenderedComponentWithType(
            getSenseTableTree(givenProps), SenseTable);
    };

    it('displays vision checks', function () {
        let table = getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Acute Vision", level: 1}]});
        let checks = Array.from(ReactDOM.findDOMNode(table._visionCheckRow).querySelectorAll("td"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 2k with Acute Vision.
        expect(checks.length).toEqual(10);
    });

    it('displays hearing checks', function () {
        let table = getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Poor Hearing", level: 1}]});
        let checks = Array.from(ReactDOM.findDOMNode(table._hearingCheckRow).querySelectorAll("td"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 50m with Poor Hearing.
        expect(checks.length).toEqual(5);
    });

    it('displays smell checks', function () {
        let table = getSenseTable({character: {cur_int: 50}});
        let checks = Array.from(ReactDOM.findDOMNode(table._smellCheckRow).querySelectorAll("td"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 10m by default.
        expect(checks.length).toEqual(3);
    });

});