jest.dontMock('../SkillTable');
jest.dontMock('../SkillRow');
jest.dontMock('../sheet-util');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const SkillTable = require('../SkillTable').default;

describe('SkillTable', function() {
    "use strict";

    var getSkillTable = function (givenProps) {
        var props = {skills: []};
        if (typeof(givenProps) !== "undefined") {
            props = Object.assing(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <SkillTable {...props}/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            SkillTable);
    };

    it('renders as empty', function () {
        var table = getSkillTable();
        expect(typeof(table)).not.toEqual("undefined");
    });
})