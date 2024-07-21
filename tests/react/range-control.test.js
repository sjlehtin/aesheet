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
        expect(spy).toHaveBeenCalledWith(19);
    });

    it('calls the onChange when input is changed with valid float value', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        renderRangeControl({onChange: spy});

        await user.type(screen.getByRole("textbox", {name: "Range"}), "0.4")
        expect(spy).toHaveBeenCalledWith(0.4);
    });

    it('calls the onChange when input is cleared', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        renderRangeControl({onChange: spy});

        await user.type(screen.getByRole("textbox", {name: "Range"}), "0.4")
        expect(spy).toHaveBeenCalledWith(0.4);
        await user.clear(screen.getByRole("textbox", {name: "Range"}))
        expect(spy).toHaveBeenCalledWith("");
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
        renderRangeControl({onChange: spy, initialValue: "60"});

        const input = screen.getByRole("textbox", {name: "Range"});
        expect(input.getAttribute('value')).toEqual("60")

        await user.clear(input)
        await user.type(input, "30")

        expect(spy).toHaveBeenCalledWith(30);
    });

});