jest.dontMock('../SkillHandler');
jest.dontMock('../SenseTable');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

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
        let checks = Array.from(ReactDOM.findDOMNode(table._visionCheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 2k with Acute Vision.
        expect(checks.length).toEqual(10);
    });

    it('displays hearing checks', function () {
        let table = getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Poor Hearing", level: 1}]});
        let checks = Array.from(ReactDOM.findDOMNode(table._hearingCheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 50m with Poor Hearing.
        expect(checks.length).toEqual(5);
    });

    it('displays smell checks', function () {
        let table = getSenseTable({character: {cur_int: 50}});
        let checks = Array.from(ReactDOM.findDOMNode(table._smellCheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 10m by default.
        expect(checks.length).toEqual(3);
    });

    it('displays touch check', function () {
        let table = getSenseTable({character: {cur_int: 50}});
        let checks = Array.from(ReactDOM.findDOMNode(table._touchCheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Just one check (close).
        expect(checks.length).toEqual(1);
    });

    it('displays single touch check with Acute Touch', function () {
        let table = getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Acute Touch", level: 1}]});
        let checks = Array.from(ReactDOM.findDOMNode(table._touchCheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Just one check (close).
        expect(checks.length).toEqual(1);
    });

    it('displays surprise check', function () {
        let table = getSenseTable({character: {cur_psy: 50}});
        let checks = Array.from(ReactDOM.findDOMNode(table._surpriseCheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // Just one check (close).
        expect(checks.length).toEqual(1);
    });

    it('displays night vision checks for DL -2', function () {
        let table = getSenseTable({character: {cur_int: 50}});
        let checks = Array.from(ReactDOM.findDOMNode(table._nightVision2CheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(30);
        // 1k => 9, DL -2 => 7.
        expect(checks.length).toEqual(7);
    });

    it('displays night vision checks for DL -2 with Night Vision 3', function () {
        let table = getSenseTable({character: {cur_int: 50},
                    edges: [{edge: "Night Vision", level: 3}]});
        let checks = Array.from(ReactDOM.findDOMNode(table._nightVision2CheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(50);
        // 1k => 9, DL -2 => 7.
        expect(checks.length).toEqual(9);
    });

    it('displays night vision checks for DL -4 with Night Vision 2 and Acute Vision 2', function () {
        let table = getSenseTable({character: {cur_int: 50},
                    edges: [{edge: "Night Vision", level: 2}, {edge: "Acute Vision", level: 2}]});
        let checks = Array.from(ReactDOM.findDOMNode(table._nightVision4CheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(30);
        // 1k => 9, DL -2 + 1 => 8.
        expect(checks.length).toEqual(8);
    });

    it('recognizes total darkness', function () {
        let table = getSenseTable({character: {cur_int: 50},
                    edges: [{edge: "Night Vision", level: 3}]});
        let checks = Array.from(ReactDOM.findDOMNode(table._nightVision7CheckRow).querySelectorAll("td.check"));
        expect(checks.length).toEqual(0);
    });

    it('recognizes total darkness with darkvision', function () {
        let table = getSenseTable({character: {cur_int: 50},
                    edges: [{edge: "Night Vision", level: 4}]});
        let checks = Array.from(ReactDOM.findDOMNode(table._nightVision7CheckRow).querySelectorAll("td.check"));
        checks = checks.map((el) => {return parseInt(el.textContent);});
        expect(checks[checks.length - 1]).toEqual(20);
        // 1k => 9, total DL -3 => 6.
        expect(checks.length).toEqual(6);
    });

});