import React from "react";
import MagazineControl from 'MagazineControl'

import {fireEvent, render, within, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const factories = require('./factories');

describe('MagazineControl', () => {

    const renderMagazineControl = (givenProps) => {
        const props = Object.assign({magazineSize: 10, magazines: []}, givenProps)
        return render(
            <MagazineControl {...props} />)
    }

    it ("validates input", async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue()

        const control = renderMagazineControl({
            magazineSize: 11,
            onAdd: spy})
        const input = control.getByRole("textbox", {name: "Magazine size"})

        fireEvent.change(input, {target: {value: "a2"}})

        expect(input).not.toHaveClass("is-valid")

        expect(control.getByRole("button", {
            name: "Add magazine"
        })).toBeDisabled()

        fireEvent.change(input, {target: {value: "10"}})

        expect(input).toHaveClass("is-valid")

        await user.click(control.getByRole("button", {
                    name: "Add magazine"
                }))

        expect(spy).toHaveBeenCalledWith({capacity: 10})

        // Value should return to gun default after add.
        expect(input.value).toEqual("11")

        expect(control.getByRole("button", {
            name: "Add magazine"
        })).not.toBeDisabled()
    })

    it ("renders without current magazines", async () => {
        const control = renderMagazineControl()
        expect(await control.queryByText("No magazines")).not.toBeNull()
    })

    it ("renders magazines", async () => {
        const control = renderMagazineControl({
            magazineSize: 11,
            magazines: [
                factories.magazineFactory({capacity: 15, current: 3}),
                factories.magazineFactory({capacity: 15, current: 15})
            ]
        })
        expect(control.queryByText("No magazines")).toBeNull()
        const mag1 = control.getByLabelText("Magazine of size 15 with 3 bullets remaining")
        const mag2 = control.getByLabelText("Magazine of size 15 with 15 bullets remaining")
        within(mag2).getByRole("button", {name: "Remove magazine"})
        expect(control.getAllByRole("button", {name: "Remove magazine"}).length).toEqual(2)
    })

    it ("can remove magazines", async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue()

        const mag = factories.magazineFactory({
            id: 2, capacity: 15, current: 3
        });
        const control = renderMagazineControl({
            magazineSize: 11,
            magazines: [
                mag,
            ],
            onRemove: spy
        })
        const button = control.getByRole("button", {name: "Remove magazine"})
        await user.click(button)
        expect(spy).toHaveBeenCalledWith(mag)
    })
})