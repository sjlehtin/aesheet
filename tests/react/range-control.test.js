import React from 'react';

import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import RangeControl from 'RangeControl';

import * as factories from './factories'

describe('RangeControl', () => {

    const renderRangeControl = (props) => {
        if (!props) {
            props = {};
        }
        if (!props.skillHandler) {
            props.skillHandler = factories.skillHandlerFactory();
        }
        return render(<RangeControl {...props}/>);
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

    // TODO: detection level tests with scopes and weapon mods.
});