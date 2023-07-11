import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import AddSPControl from 'AddSPControl';

describe('AddSPControl', function() {
    const renderAddSPControl = function(givenProps) {
        var props = {
            initialAgeSP: 6
        };

        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        return render(<AddSPControl {...props} />);
    };

    it('notifies parent of addition', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        const el = await control.findByRole("button")
        await user.click(el);

        expect(spy).toHaveBeenCalledWith(6);
    });

    it('validates input and notifies about invalid', async () => {
        const spy = jest.fn().mockResolvedValue({})
        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        expect(control.getByRole("button")).not.toBeDisabled()
        const input = control.getByRole("textbox")

        fireEvent.change(input, {target: {value: "a2b"}})

        await waitFor(() => { expect(control.getByRole("button")).toBeDisabled() } )

        expect(spy).not.toHaveBeenCalled()
    });

    it('validates input and accepts valid', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        expect(control.getByRole("button")).not.toBeDisabled()

        const input = control.getByRole("textbox")
        fireEvent.change(input, {target: {value: 8}})

        const button = control.getByRole("button")
        expect(button).not.toBeDisabled()

        await user.click(button)
        expect(spy).toHaveBeenCalledWith(8)
    });

    it('validates input and accepts negative', async ()  => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        expect(control.getByRole("button")).not.toBeDisabled()

        const input = control.getByRole("textbox")
        fireEvent.change(input, {target: {value: "-3"}})

        const button = control.getByRole("button")
        expect(button).not.toBeDisabled()

        await user.click(button)
        expect(spy).toHaveBeenCalledWith(-3)
    });

    it('submits on Enter', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        const input = control.getByRole("textbox")
        fireEvent.change(input, {target: {value: "-3"}})

        await user.click(input)
        await user.keyboard('[Enter]')

        await waitFor(() => { expect(spy).toHaveBeenCalledWith(-3) } )
    });

    it('returns to normal ageSP after submit', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        const input = control.getByRole("textbox")
        fireEvent.change(input, {target: {value: "-3"}})

        const button = control.getByRole("button")
        expect(button).not.toBeDisabled()

        await user.click(button)
        expect(spy).toHaveBeenCalledWith(-3)

        await waitFor(() => expect(control.getByRole("textbox")).toHaveValue("6"))
    });

    xit("should toast the user about the added sp", test.todo)
});
