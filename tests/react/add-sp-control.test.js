import React from 'react';

import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import AddSPControl from 'AddSPControl';

describe('AddSPControl', function() {
    const renderAddSPControl = function(givenProps) {
        let props = {
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
        renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        await user.click(screen.getByRole("button", {name: "Add SP"}));

        await user.click(screen.getByRole("button", {name: "Add"}))

        expect(spy).toHaveBeenCalledWith(6);
    });

    it('validates input and notifies about invalid', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})

        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        await user.click(screen.getByRole("button", {name: "Add SP"}));

        expect(screen.getByRole("button", {name: "Add"})).not.toBeDisabled()

        const input = screen.getByRole("textbox", {label: "add-sp-input"})

        // fireEvent.change(input, {target: {value: "a2b"}})
        await user.clear(input)
        await user.type(input, "a2b")

        expect(screen.getByRole("button", {name: "Add"})).toBeDisabled()

        expect(spy).not.toHaveBeenCalled()
    });

    it('validates input and accepts valid', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})

        renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        await user.click(screen.getByRole("button", {name: "Add SP"}));

        expect(screen.getByRole("button", {name: "Add"})).not.toBeDisabled()

        const input = screen.getByRole("textbox")
        await user.clear(input)
        await user.type(input, "8")

        const button = screen.getByRole("button", {name: "Add"})
        expect(button).not.toBeDisabled()

        await user.click(button)
        expect(spy).toHaveBeenCalledWith(8)

        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    });

    it('validates input and accepts negative', async ()  => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        await user.click(screen.getByRole("button", {name: "Add SP"}));

        expect(control.getByRole("button", {name: "Add"})).not.toBeDisabled()

        const input = screen.getByRole("textbox")

        await user.clear(input)
        await user.type(input, "-3")

        const button = control.getByRole("button", {name: "Add"})
        expect(button).not.toBeDisabled()
        await user.click(button)

        expect(spy).toHaveBeenCalledWith(-3)

        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    });

    it('submits on Enter', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})

        renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        await user.click(screen.getByRole("button", {name: "Add SP"}));

        const input = screen.getByRole("textbox")

        await user.clear(input)
        await user.type(input, "-3")
        await user.keyboard('[Enter]')

        await waitFor(() => { expect(spy).toHaveBeenCalledWith(-3) } )

        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    });

    it('returns to normal ageSP after submit', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const control = renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        await user.click(screen.getByRole("button", {name: "Add SP"}));

        const input = screen.getByRole("textbox")

        await user.clear(input)
        await user.type(input, "-3")

        const button = screen.getByRole("button", {name: "Add"})
        expect(button).not.toBeDisabled()

        await user.click(button)
        expect(spy).toHaveBeenCalledWith(-3)

        await user.click(screen.getByRole("button", {name: "Add SP"}));

        await waitFor(() => expect(control.getByRole("textbox")).toHaveValue("6"))
    });

    it('allows the addition to be cancelled', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        renderAddSPControl({onAdd: spy, initialAgeSP: 6});

        await user.click(screen.getByRole("button", {name: "Add SP"}))
        expect(spy).not.toHaveBeenCalled()

        const input = screen.getByRole("textbox")

        await user.clear(input)
        await user.type(input, "-3")

        await user.keyboard("[Escape]")

        expect(spy).not.toHaveBeenCalled()

        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

        await user.click(screen.getByRole("button", {name: "Add SP"}))
        await expect(screen.getByRole("textbox")).toHaveValue("6")
    })

    xit("should toast the user about the added sp", test.todo)
});
