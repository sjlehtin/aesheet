jest.dontMock('../AddArmorControl');
jest.dontMock('../ArmorControl');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const ArmorControl = require('../ArmorControl').default;
const AddArmorControl = require('../AddArmorControl').default;

var rest = require('sheet-rest');

var factories = require('./factories');

describe('ArmorControl', function() {
    "use strict";

    var getArmorControl = function (givenProps) {
        var props = {};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <ArmorControl {...props}/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            ArmorControl);
    };

    it("can render the add controls", function () {
        var control = getArmorControl({armor: {}, helm: {}});

        var addControls = TestUtils.scryRenderedComponentsWithType(control,
            AddArmorControl);
        expect(addControls.length).toEqual(0);

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._editButton));

        addControls = TestUtils.scryRenderedComponentsWithType(control,
            AddArmorControl);
        expect(addControls.length).toEqual(2);
    });

});