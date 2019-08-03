jest.dontMock('../AddSPControl');
jest.dontMock('../sheet-util');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

const AddSPControl = require('../AddSPControl').default;

describe('AddSPControl', function() {
    "use strict";

    var promises;

    var addSPControlFactory = function(givenProps) {
        var props = {
            initialAgeSP: 6
        };

        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var node = TestUtils.renderIntoDocument(<AddSPControl {...props} />);
        return TestUtils.findRenderedComponentWithType(node,
            AddSPControl);
    };

    it('notifies parent of addition', function () {
        var callback = jasmine.createSpy("callback");
        var control = addSPControlFactory({onAdd: callback, initialAgeSP: 6});

        TestUtils.Simulate.click(control._addButton);

        expect(callback).toHaveBeenCalledWith(6);
    });

    it('validates input and notifies about invalid', function () {
        var callback = jasmine.createSpy("callback");
        var control = addSPControlFactory({onAdd: callback, initialAgeSP: 6});

        TestUtils.Simulate.change(
            control._inputField, {target: {value: "a2b"}});
        expect(control.isValid()).toEqual(false);
        expect(control.validationState()).toEqual("error");
    });

    it('validates input and accepts valid', function () {
        var callback = jasmine.createSpy("callback");
        var control = addSPControlFactory({onAdd: callback, initialAgeSP: 6});

        TestUtils.Simulate.change(
            control._inputField, {target: {value: 8}});
        expect(control.isValid()).toEqual(true);
        expect(control.validationState()).toEqual("success");

        TestUtils.Simulate.click(control._addButton);

        expect(callback).toHaveBeenCalledWith(8);
    });

    it('validates input and accepts negative', function () {
        var callback = jasmine.createSpy("callback");
        var control = addSPControlFactory({onAdd: callback, initialAgeSP: 6});

        TestUtils.Simulate.change(
            control._inputField, {target: {value: "-3"}});
        expect(control.isValid()).toEqual(true);
        expect(control.validationState()).toEqual("success");

        TestUtils.Simulate.click(control._addButton);

        expect(callback).toHaveBeenCalledWith(-3);
    });

    it('submits on Enter', function () {
        var callback = jasmine.createSpy("callback");
        var control = addSPControlFactory({onAdd: callback, initialAgeSP: 6});

        TestUtils.Simulate.change(
            control._inputField, {target: {value: "-3"}});

        TestUtils.Simulate.keyDown(control._inputField,
                {key: "Enter", keyCode: 13, which: 13});

        expect(callback).toHaveBeenCalledWith(-3);
    });

    it('returns to normal ageSP after submit', function () {
        var callback = jasmine.createSpy("callback");
        var control = addSPControlFactory({onAdd: callback, initialAgeSP: 6});

        TestUtils.Simulate.change(
            control._inputField, {target: {value: 8}});
        TestUtils.Simulate.click(control._addButton);

        expect(callback).toHaveBeenCalledWith(8);

        expect(control.state.ageSP).toEqual(6);
    });

});
