jest.dontMock('../WoundPenaltyBox');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

const WoundPenaltyBox = require('../WoundPenaltyBox').default;

var factories = require('./factories');

describe('WoundPenaltyBox', function() {
    "use strict";

    var getWoundPenaltyBoxTree = function (givenProps) {
        var props = {handler: factories.skillHandlerFactory(givenProps)};

        return TestUtils.renderIntoDocument(
            <WoundPenaltyBox {...props} />
        );
    };

    var getTextContent = function (givenProps) {
        var tree = getWoundPenaltyBoxTree(givenProps);
        var woundPenalties = TestUtils.findRenderedComponentWithType(tree,
            WoundPenaltyBox);
        return ReactDOM.findDOMNode(woundPenalties).textContent;
    };

    it("renders nicely without wounds", function () {
        expect(getTextContent()).toEqual("");
    });

    it("indicates AA penalty", function () {
        expect(getTextContent({wounds: [{damage: 5, location: "H"}]})).toContain("-50 AA");
    });

    it("indicates heart stopped effect", function () {
        expect(getTextContent({
            character: {cur_fit: 30, cur_ref: 50, cur_lrn: 50, cur_int: 50,
                cur_psy: 50, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})).toContain(
                "Heart stopped");
    });

    it("indicates a paralyzed effect due to ref", function () {
        expect(getTextContent({
            character: {cur_fit: 50, cur_ref: 30, cur_lrn: 50, cur_int: 50,
                cur_psy: 50, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})).toContain(
                "Paralyzed");
    });

    it("indicates a paralyzed effect due to wil", function () {
        expect(getTextContent({
            character: {cur_fit: 50, cur_ref: 50, cur_lrn: 50, cur_int: 50,
                cur_psy: 50, cur_wil: 30, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})).toContain(
                "Paralyzed");
    });

    it("indicates a shocked effect due to int", function () {
        expect(getTextContent({
            character: {cur_fit: 50, cur_ref: 50, cur_lrn: 50, cur_int: 30,
                cur_psy: 50, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})).toContain(
                "Shocked");
    });

    it("indicates a shocked effect due to lrn", function () {
        expect(getTextContent({
            character: {cur_fit: 50, cur_ref: 50, cur_lrn: 30, cur_int: 50,
                cur_psy: 50, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})).toContain(
                "Shocked");
    });

    it("indicates a shocked effect due to psy", function () {
        expect(getTextContent({
            character: {cur_fit: 50, cur_ref: 50, cur_lrn: 50, cur_int: 50,
                cur_psy: 30, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})).toContain(
                "Shocked");
    });

});