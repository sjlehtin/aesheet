import React from 'react';

import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'



const AddWoundControl = require('AddWoundControl').default;

var factories = require('./factories');

describe('AddWoundControl', function() {

    it("allows wounds to be added", async () => {
        const spy = jest.fn().mockResolvedValue({})
        const user = userEvent.setup()

        render(<AddWoundControl onAdd={spy}/>)

        expect(within(screen.getByLabelText("Location")).getByText("Torso (5-7)")).toBeInTheDocument()

        await user.click(screen.getByRole("combobox", {name: "Location"}))
        await user.click(screen.getByText("Head (8)"))

        await user.click(screen.getByRole("combobox", {name: "Type"}))
        await user.click(screen.getByText("Burn"))

        await user.clear(screen.getByRole("textbox", {name: "Damage"}))
        await user.type(screen.getByRole("textbox", {name: "Damage"}), "5")

        await user.click(screen.getByLabelText("Effect"))

        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox");
        await user.clear(effectInput)
        await user.type(effectInput, "Fuzznozzle")

        await user.click(screen.getByRole("button", {name: "Add wound"}))

        expect(spy).toHaveBeenCalledWith({location: "H", damage_type: "R", damage: "5", effect: 'Fuzznozzle'});

        spy.mockClear()

        // Verify it has changed the fields to default values after add.
        await user.click(screen.getByRole("button", {name: "Add wound"}))

        expect(spy).toHaveBeenCalledWith({location: "T", damage_type: "S", damage: 0, effect: 'Scratched'});
    });

    it("validates damage", async () => {
        const user = userEvent.setup()

        render(<AddWoundControl />)

        await user.type(screen.getByRole("textbox", {name: "Damage"}), "5a")

        expect(screen.getByRole("textbox", {name: "Damage"})).not.toHaveClass("is-valid")
        expect(screen.getByRole("button", {name: "Add wound"})).toBeDisabled()

        await user.type(screen.getByRole("textbox", {name: "Damage"}), "[Backspace]")
        expect(screen.getByRole("textbox", {name: "Damage"})).toHaveClass("is-valid")
        expect(screen.getByRole("button", {name: "Add wound"})).not.toBeDisabled()
    });

    it("fills in effect for head wounds", async () => {
        const user = userEvent.setup()

        render(<AddWoundControl />)

        await user.click(screen.getByRole("combobox", {name: "Location"}))
        await user.click(screen.getByText("Head (8)"))

        await user.click(screen.getByRole("combobox", {name: "Type"}))
        await user.click(screen.getByText("Burn"))

        await user.clear(screen.getByRole("textbox", {name: "Damage"}))
        await user.type(screen.getByRole("textbox", {name: "Damage"}), "5")

        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox");
        expect(effectInput).toHaveValue("Skin burned bad [IMM -30]")
    });

    it("takes effect from last in case of massive damage", async () => {
        const user = userEvent.setup()

        render(<AddWoundControl />)

        await user.click(screen.getByRole("combobox", {name: "Location"}))
        await user.click(screen.getByText("Head (8)"))

        await user.click(screen.getByRole("combobox", {name: "Type"}))
        await user.click(screen.getByText("Pierce"))

        await user.clear(screen.getByRole("textbox", {name: "Damage"}))
        await user.type(screen.getByRole("textbox", {name: "Damage"}), "20")

        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox");
        expect(effectInput).toHaveValue("Head blown off [DEATH]")
    });

    it("fills in effect for arm wounds", async () => {
        const user = userEvent.setup()

        render(<AddWoundControl />)

        await user.click(screen.getByRole("combobox", {name: "Location"}))
        await user.click(screen.getByText("Left arm (2)"))

        await user.click(screen.getByRole("combobox", {name: "Type"}))
        await user.click(screen.getByText("Bludgeon"))

        await user.clear(screen.getByRole("textbox", {name: "Damage"}))
        await user.type(screen.getByRole("textbox", {name: "Damage"}), "5")

        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox");
        expect(effectInput).toHaveValue("Shoulder broken")
    });

    it("fills in effect for leg wounds", async () => {
        const user = userEvent.setup()

        render(<AddWoundControl />)

        await user.click(screen.getByRole("combobox", {name: "Location"}))
        await user.click(screen.getByText("Left leg (1)"))

        await user.click(screen.getByRole("combobox", {name: "Type"}))
        await user.click(screen.getByText("Pierce"))

        await user.clear(screen.getByRole("textbox", {name: "Damage"}))
        await user.type(screen.getByRole("textbox", {name: "Damage"}), "5")

        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox");
        expect(effectInput).toHaveValue("Major vein cut [major ext]")
    });

    it("fills in effect for torso wounds", async () => {
        const user = userEvent.setup()

        render(<AddWoundControl />)

        await user.clear(screen.getByRole("textbox", {name: "Damage"}))
        await user.type(screen.getByRole("textbox", {name: "Damage"}), "5")

        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox");
        expect(effectInput).toHaveValue("Gut pierced [minor int]")
    });

    it("takes toughness into account in the effect", async () => {
        const user = userEvent.setup()

        render(<AddWoundControl toughness={3} />)

        await user.clear(screen.getByRole("textbox", {name: "Damage"}))
        await user.type(screen.getByRole("textbox", {name: "Damage"}), "8")

        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox");
        expect(effectInput).toHaveValue("Gut pierced [minor int]")
    });
});