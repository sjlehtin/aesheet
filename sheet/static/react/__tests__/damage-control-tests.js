jest.dontMock('../DamageControl');
jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const DamageControl = require('../DamageControl').default;

var factories = require('./factories');

describe('DamageControl', function() {
    "use strict";

    var getDamageControl = function(givenProps) {
        var props = givenProps;
        if (!props) {
            props = {};
        }
        props.handler = factories.skillHandlerFactory({character: props.character});
        props.character = props.handler.props.character;

        var control = TestUtils.renderIntoDocument(
            <DamageControl {...props} />
        );
        return TestUtils.findRenderedComponentWithType(control,
            DamageControl);
    };

    it("can validate the input field", function () {
        var control = getDamageControl();
        var node = ReactDOM.findDOMNode(control._inputField);

        TestUtils.Simulate.change(
            control._inputField, {target: {value: "a2b"}});
        expect(control.isValid()).toEqual(false);
        expect(control.validationState()).toEqual("error");

    });

    it('validates input and accepts valid', function () {
        var callback = jasmine.createSpy("callback").and.returnValue(
            Promise.resolve({}));
        var control = getDamageControl({onMod: callback, character:
        {cur_ref:40, cur_wil: 40}});

        TestUtils.Simulate.change(
            control._inputField, {target: {value: 8}});
        expect(control.isValid()).toEqual(true);
        expect(control.validationState()).toEqual("success");

        TestUtils.Simulate.click(control._changeButton);

        // 20 - 8 = 12
        expect(callback).toHaveBeenCalledWith('stamina_damage', 0, 12);
    });

    it('can be busy during REST update', function (done) {
        var promise = Promise.resolve({});
        var callback = jasmine.createSpy("callback").and.returnValue(promise);
        var control = getDamageControl({onMod: callback, character:
        {cur_ref:40, cur_wil: 40}});

        TestUtils.Simulate.change(
            control._inputField, {target: {value: 8}});
        expect(control.isValid()).toEqual(true);
        expect(control.validationState()).toEqual("success");

        TestUtils.Simulate.click(control._changeButton);

        expect(control.state.isBusy).toEqual(true);
        promise.then(() => {
            expect(control.state.isBusy).toEqual(false);
            done();
        });
    });

    it("allows clearing stamina damage", function () {
        var promise = Promise.resolve({});
        var callback = jasmine.createSpy("callback").and.returnValue(promise);

        var control = getDamageControl({onMod: callback, character:
        {cur_ref:40, cur_wil: 40, stamina_damage: 12}});

        TestUtils.Simulate.click(control._clearButton);

        expect(callback).toHaveBeenCalledWith('stamina_damage', 12, 0);
    });

    // TODO: test for componentWillReceiveProps
});
