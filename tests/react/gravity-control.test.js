import React from 'react';

import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import GravityControl from 'GravityControl';

describe('GravityControl', () => {

    it('calls the onChange when input is changed with valid value', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        render(<GravityControl initialValue={""} onChange={spy} />)

        const input = screen.getByRole("textbox", {name: "Gravity"});

        expect(input.getAttribute('value')).toEqual("")

        expect(input).toHaveClass("is-valid")

        await user.type(input, "foo")

        expect(input).not.toHaveClass("is-valid")

        expect(spy).not.toHaveBeenCalled()

        await user.clear(input)

        await user.type(input, "2.3")

        expect(input).toHaveClass("is-valid")

        expect(spy).toHaveBeenCalledWith(2.3)
        spy.mockClear()

        await user.clear(input)
        expect(spy).toHaveBeenCalledWith(1.0)

    });

    it('accepts initial value', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        render(<GravityControl onChange={spy} initialValue={"2.3"}/>)

        const input = screen.getByRole("textbox", {name: "Gravity"});

        expect(input).toHaveClass("is-valid")
        expect(input.getAttribute('value')).toEqual("2.3")

        await user.clear(input)
        expect(spy).toHaveBeenCalledWith(1.0)
    })

    it('renders initial value as float', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        render(<GravityControl onChange={spy} initialValue={"1.0"} />)

        const input = screen.getByRole("textbox", {name: "Gravity"});

        expect(input).toHaveClass("is-valid")
        expect(input.getAttribute('value')).toEqual("1.0")
    })
})