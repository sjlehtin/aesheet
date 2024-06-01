import React from 'react';

import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import WoundRow from 'WoundRow'

import * as factories from './factories'

describe('WoundRow', function() {

    it("allows wounds to be removed", async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue({})
        render(<table><tbody><WoundRow wound={factories.woundFactory({id: 2})} onRemove={spy} /></tbody></table>)

        await user.click(screen.getByRole("button", {name: "Heal"}))

        expect(spy).toHaveBeenCalledWith({id: 2})
    });

    it("allows wounds to be healed", async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue({})
        render(<table>
            <tbody><WoundRow wound={factories.woundFactory(
                {
                    damage: 5,
                    location: "H",
                    healed: 0,
                    id: 2,
                    effect: "Throat punctured."
                })} onMod={spy}/></tbody>
        </table>)

        await user.click(screen.getByRole("button", {name: "Decrease damage"}))

        expect(spy).toHaveBeenCalledWith({id: 2, healed: 1})
    });

    it("allows wounds to be worsened", async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue({})
        render(<table>
            <tbody><WoundRow wound={factories.woundFactory(
                {
                    damage: 5,
                    location: "H",
                    healed: 0,
                    id: 2,
                    effect: "Throat punctured."
                })} onMod={spy}/></tbody>
        </table>)

        await user.click(screen.getByRole("button", {name: "Increase damage"}))

        expect(spy).toHaveBeenCalledWith({id: 2, damage: 6})
    });

    it("does not show heal button if fully healed", function () {
        render(<table>
            <tbody><WoundRow wound={factories.woundFactory(
                {
                    damage: 5,
                    location: "H",
                    healed: 5,
                    id: 2,
                    effect: "Throat punctured."
                })} /></tbody>
        </table>)
        expect(screen.queryByRole("button", {name: "Decrease damage"})).not.toBeInTheDocument()
    });

    it("allows wound effects to be changed", async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue({})
        render(<table>
            <tbody><WoundRow wound={factories.woundFactory(
                {
                    damage: 5,
                    location: "H",
                    healed: 0,
                    id: 2,
                    effect: "Throat punctured."
                })} onMod={spy}/></tbody>
        </table>)

        await user.click(screen.getByLabelText("Wound effect"))

        const input = screen.getByRole("textbox", {name: "Wound effect"});
        await user.click(input)
        await user.clear(input)
        await user.type(input,"FuzzBazz[Enter]")

        expect(spy).toHaveBeenCalledWith({id: 2, effect: "FuzzBazz"})
    });

    it("allows wound effect changing to be canceled", async ()=> {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue({})
        render(<table>
            <tbody><WoundRow wound={factories.woundFactory(
                {
                    damage: 5,
                    location: "H",
                    healed: 0,
                    id: 2,
                    effect: "Throat punctured."
                })} onMod={spy}/></tbody>
        </table>)

        await user.click(screen.getByLabelText("Wound effect"))

        const input = screen.getByRole("textbox", {name: "Wound effect"});
        await user.click(input)
        await user.clear(input)
        await user.type(input,"FuzzBazz[Escape]")

        expect(spy).not.toHaveBeenCalled()
        expect(screen.queryByRole("textbox", {name: "Wound effect"})).not.toBeInTheDocument()
        expect(screen.queryByDisplayValue("FuzzBazz")).not.toBeInTheDocument()
        expect(screen.getByText(/Throat punctured/)).toBeInTheDocument()
    });
});
