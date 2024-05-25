import React from 'react';
import TestUtils from 'react-dom/test-utils';
import RangeControl from 'RangeControl';

const factories = require('./factories');

describe('RangeControl', () => {

    const getRangeControl = (props) => {
        if (!props) {
            props = {};
        }
        if (!props.skillHandler) {
            props.skillHandler = factories.skillHandlerFactory();
        }
        return TestUtils.renderIntoDocument(<RangeControl {...props}/>);
    };

    it('calls the onChange when input is changed with valid value', () => {
        let spy = jest.fn();
        const control = getRangeControl({onChange: spy});
        TestUtils.Simulate.change(control._inputField, {target: {value: 19}});
        expect(spy).toHaveBeenCalledWith({range: 19,
            darknessDetectionLevel: 0});
    });

    it('calls the onChange when input is changed with valid float value', () => {
        let spy = jest.fn();
        const control = getRangeControl({onChange: spy});
        TestUtils.Simulate.change(control._inputField, {target: {value: "0.4"}});
        expect(spy).toHaveBeenCalledWith({range: 0.4,
            darknessDetectionLevel: 0});
    });

    it('calls the onChange when input is cleared', () => {
        let spy = jest.fn();
        const control = getRangeControl({onChange: spy});
        TestUtils.Simulate.change(control._inputField, {target: {value: "0.4"}});
        jest.clearAllMocks();
        TestUtils.Simulate.change(control._inputField, {target: {value: ""}});
        expect(spy).toHaveBeenCalledWith({range: "",
            darknessDetectionLevel: 0});
    });

    it('does not call the onChange when input is invalid', () => {
        let spy = jest.fn();
        const control = getRangeControl({onChange: spy});
        TestUtils.Simulate.change(control._inputField, {target: {value: "foo19"}});
        expect(spy).not.toHaveBeenCalled();
    });

    // TODO: detection level tests.
});