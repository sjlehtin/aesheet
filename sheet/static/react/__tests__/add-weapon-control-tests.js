jest.dontMock('../AddWeaponControl');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const AddWeaponControl = require('../AddWeaponControl').default;

var rest = require('sheet-rest');

var factories = require('./factories');

describe('AddWeaponControl', function() {
    "use strict";

    var promises;

    var jsonResponse = function (json) {
        var promise = Promise.resolve(json);
        promises.push(promise);
        return promise;
    };

    beforeEach(function () {
        promises = [];
    });

    var getAddWeaponControl = function (givenProps) {
        rest.getData.mockImplementation(function (url) {
            if (url === "/rest/weapontemplates/campaign/1/") {
                return jsonResponse([]);
            } else if (url === "/rest/weaponqualities/campaign/1/") {
                return jsonResponse([]);
            } else if (url === "/rest/weapons/campaign/1/") {
                return jsonResponse([]);
            } else {
                /* Throwing errors here do not cancel the test. */
                fail("this is an unsupported url:" + url);
            }
        });
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
