jest.dontMock('../AddWeaponControl');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const AddWeaponControl = require('../AddWeaponControl').default;

var rest = require('sheet-rest');

var factories = require('./factories');

describe('AddSkillControl', function() {
    "use strict";

    var getAddWeaponControl = function (givenProps) {
        var props = {campaign: 1};
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <AddWeaponControl {...props}/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            AddWeaponControl);
    };

    it("can render", function () {
        var control = getAddWeaponControl();
    });

});
