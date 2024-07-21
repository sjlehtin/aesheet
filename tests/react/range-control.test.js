import React from 'react';

import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import DetectionLevelControl from 'DetectionLevelControl';

import * as factories from './factories'

describe('RangeControl', () => {

    const renderRangeControl = (props) => {
        if (!props) {
            props = {};
        }
        if (!props.skillHandler) {
            props.skillHandler = factories.skillHandlerFactory();
        }
        return render(<DetectionLevelControl {...props}/>);
    };

    it('calls the onChange when input is changed with valid value', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        renderRangeControl({onChange: spy});

        await user.type(screen.getByRole("textbox", {name: "Range"}), "19")
        expect(spy).toHaveBeenCalledWith({range: 19,
            darknessDetectionLevel: 0});
    });

    it('calls the onChange when input is changed with valid float value', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        renderRangeControl({onChange: spy});

        await user.type(screen.getByRole("textbox", {name: "Range"}), "0.4")
        expect(spy).toHaveBeenCalledWith({range: 0.4,
            darknessDetectionLevel: 0});
    });

    it('calls the onChange when input is cleared', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        renderRangeControl({onChange: spy});

        await user.type(screen.getByRole("textbox", {name: "Range"}), "0.4")
        expect(spy).toHaveBeenCalledWith({range: 0.4, darknessDetectionLevel: 0});
        await user.clear(screen.getByRole("textbox", {name: "Range"}))
        expect(spy).toHaveBeenCalledWith({range: "", darknessDetectionLevel: 0});
    });

    it('does not call the onChange when input is invalid', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        renderRangeControl({onChange: spy});

        await user.type(screen.getByRole("textbox", {name: "Range"}), "foo19")
        expect(spy).not.toHaveBeenCalled();
    });

    it('uses initial value for range', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        renderRangeControl({onChange: spy, initialRange: "60"});


        const input = screen.getByRole("textbox", {name: "Range"});
        expect(input.getAttribute('value')).toEqual("60")

        await user.clear(input)
        await user.type(input, "30")

        expect(spy).toHaveBeenCalledWith({range: 3, darknessDetectionLevel: 0});
    });

    it('uses initial value for detection level', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        renderRangeControl({onChange: spy, initialDetectionLevel: -3});

        const input = screen.getByRole("combobox", {name: "Darkness DL"});
        await user.click(input)
        expect(screen.getByText(/Moonlight/, {selector: "[role=option]"})).toHaveAttribute('aria-selected', "true")
        await user.click(screen.getByText(/Artificial/))

        expect(spy).toHaveBeenCalledWith({range: null, darknessDetectionLevel: -2})
    });

});