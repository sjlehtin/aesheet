jest.dontMock('../AddArmorControl');
jest.dontMock('../ArmorControl');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

const ArmorControl = require('../ArmorControl').default;
const AddArmorControl = require('../AddArmorControl').default;

jest.mock('../sheet-rest');
var rest = require('../sheet-rest');

var factories = require('./factories');

describe('ArmorControl', function() {
    "use strict";

    var getArmorControl = function (givenProps) {
        rest.getData.mockReturnValue(Promise.resolve([]));

        var props = {campaign: 1};
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

    it("can remove the helmet", function () {
        var spy = jasmine.createSpy();

        var control = getArmorControl({
            armor: factories.armorFactory(),
            helm: factories.armorFactory({is_helm: true}),
            onHelmChange: spy
        });

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._editButton));

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._removeHelmetButton));

        expect(spy).toHaveBeenCalledWith(null);
    });

    it("can remove the helmet", function () {
        var spy = jasmine.createSpy();

        var control = getArmorControl({
            armor: factories.armorFactory(),
            helm: factories.armorFactory({is_helm: true}),
            onArmorChange: spy
        });

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._editButton));

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._removeArmorButton));

        expect(spy).toHaveBeenCalledWith(null);
    });

});