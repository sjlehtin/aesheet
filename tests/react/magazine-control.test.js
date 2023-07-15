import React from "react";
import MagazineControl from 'MagazineControl'

import {fireEvent, render, within, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const factories = require('./factories');

describe('MagazineControl', () => {

    const renderMagazineControl = (givenProps) => {

        const firearmProps= factories.firearmFactory(
            Object.assign({
                base: {magazine_weight: 0.35, magazine_size: 10},
                magazines: []
            }, givenProps?.firearm))


        const props = Object.assign({}, givenProps, {
                firearm: firearmProps
            })
        return render(<MagazineControl {...props} />)
    }

    it ("validates input", async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue()

        const control = renderMagazineControl({
            firearm: {base: {magazine_size: 11}},
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

        // Value should stay at what the user set.
        expect(input.value).toEqual("10")

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
            firearm: factories.firearmFactory({
                base: {magazine_weight: 0.75},
                ammo: {weight: 12},
                magazines: [
                    {capacity: 15, current: 3},
                    {capacity: 15, current: 15}
                ]
            })
        })
        expect(screen.queryByText("No magazines")).toBeNull()
        const mag1 = screen.getByLabelText("Magazine of size 15 with 3 bullets remaining")
        const mag2 = screen.getByLabelText("Magazine of size 15 with 15 bullets remaining")
        within(mag2).getByRole("button", {name: "Remove magazine"})
        expect(screen.getAllByRole("button", {name: "Remove magazine"}).length).toEqual(2)

        const mags = screen.getAllByLabelText("Weight")
        expect(mags.length).toEqual(2)
        expect(mags.map((el) => el.textContent)).toEqual(["0.84 kg", "1.20 kg"])
    })

    it ("can remove magazines", async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue()

        const mag = factories.magazineFactory({
            id: 2, capacity: 15, current: 3
        });
        const control = renderMagazineControl({
            firearm: {
                magazines: [
                    mag,
                ],
            },
            onRemove: spy
        })
        const button = screen.getByRole("button", {name: "Remove magazine"})
        await user.click(button)
        expect(spy).toHaveBeenCalledWith(mag)
    })
})