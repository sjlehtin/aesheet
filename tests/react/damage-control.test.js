import React from 'react';

import DamageControl from 'DamageControl';

import * as factories from './factories'

import {
    fireEvent,
    render,
    screen,
    waitFor,
    waitForElementToBeRemoved,
    within
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {defer} from './testutils'


describe('DamageControl', function() {

    const renderDamageControl = (givenProps) => {
        var props = givenProps
        if (!props) {
            props = {}
        }
        props.handler = factories.skillHandlerFactory({character: props.character})
        props.sheet = factories.sheetFactory(props.sheet)
        if (props.wounds) {
            props.wounds = props.wounds.map(
                (props) => { return factories.woundFactory(props); })
        }
        return render(<DamageControl {...props} />)
    }


    it("can validate the input field", async () => {
        renderDamageControl()

        const el = await screen.findByLabelText("Stamina damage")

        fireEvent.change(el, {target: {value: "a2"}})

        expect(el).not.toHaveClass("is-valid")

        fireEvent.change(el, {target: {value: "2"}})

        expect(el).toHaveClass("is-valid")
    });

    it('validates input and accepts valid', async ()=> {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue()

        renderDamageControl({
            onMod: spy,
            character: {cur_ref: 40, cur_wil: 40}
        })

        const el = await screen.findByRole("textbox", {name: "Stamina damage"})

        expect(screen.getByRole("button", {name: "Add"})).toBeDisabled()

        await user.clear(el)
        await user.type(el, "8")

        expect(el).toHaveClass("is-valid")

        const addButton = screen.getByRole("button", {name: "Add"});
        expect(addButton).not.toBeDisabled()

        await user.click(addButton)

        expect(spy).toHaveBeenCalledWith('stamina_damage', 0, 8);
    });

    it('stamina damage can be submitted with Enter', async ()=> {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue()

        renderDamageControl({
            onMod: spy,
            character: {cur_ref: 40, cur_wil: 40}
        })

        const el = await screen.findByRole("textbox", {name: "Stamina damage"})

        await user.clear(el)
        await user.type(el, "8[Enter]")

        expect(spy).toHaveBeenCalledWith('stamina_damage', 0, 8);
    })

    it('can be busy during REST update', async function () {
        const user = userEvent.setup()

        let deferred = defer();

        const spy = jest.fn().mockImplementation(async (res, req) => {
            await deferred
        })
        renderDamageControl({
            onMod: spy,
            character: {cur_ref:40, cur_wil: 40},
            sheet: factories.sheetFactory({stamina_damage: 12})
        })

        await user.click(screen.getByRole("button", {name: "Heal"}))
        expect(screen.queryAllByLabelText('Loading')).not.toBeNull()

        deferred.resolve()

        await waitFor(() => {expect(screen.queryByLabelText('Loading')).toBeNull()})

        expect(spy).toHaveBeenCalledWith('stamina_damage', 12, 0);
    });

    it("allows clearing stamina damage", async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        renderDamageControl({
            onMod: spy,
            character: {cur_ref:40, cur_wil: 40},
            sheet: factories.sheetFactory({stamina_damage: 12})
        })

        const el = await screen.findByRole("textbox", {name: "Stamina damage"})
        expect(el.value).toEqual("")

        await user.click(screen.getByRole("button", {name: "Heal"}))
        expect(spy).toHaveBeenCalledWith('stamina_damage', 12, 0);

        // Stamina damage input should be empty after clear
        expect(el.value).toEqual("")
    });

    it("allows healing stamina damage", async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        renderDamageControl({
            onMod: spy,
            character: {cur_ref:40, cur_wil: 40},
            sheet: factories.sheetFactory({stamina_damage: 12})
        })

        const el = await screen.findByRole("textbox", {name: "Stamina damage"})
        expect(el.value).toEqual("")

        await user.type(el, "6")
        await user.click(screen.getByRole("button", {name: "Heal"}))
        expect(spy).toHaveBeenCalledWith('stamina_damage', 12, 6);

        // Stamina damage input should be empty after clear
        expect(el.value).toEqual("")
    });


    it("allows wounds to be passed", async () => {
        renderDamageControl({
            wounds: [{damage: 5, location: "H",
                      id: 2, effect: "Throat punctured."}]
            })

        await screen.findByText("Throat punctured.")
    });

    it("renders multiple wounds", async () => {
        renderDamageControl({
            wounds: [{damage: 5, location: "H",
                      id: 2, effect: "Throat punctured."},
                        {damage: 3, location: "T",
                      id: 2, effect: "Heart racing."}]
            })

        await screen.findByText("Throat punctured.")
        await screen.findByText("Heart racing.")
    });

    it("allows wounds to be added", async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        renderDamageControl({
            onWoundAdd: spy
            })

        const damageInput = screen.getByRole("textbox", {name: "Damage"})
        await user.clear(damageInput)
        await user.type(damageInput, "5")
        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox")
        await user.clear(effectInput)
        await user.type(effectInput, "Fuzznozzle")

        await user.click(screen.getByRole("button", {name: "Add wound"}))

        expect(spy).toHaveBeenCalledWith({location: "T", damage_type: "S", damage: "5", effect: "Fuzznozzle"});
    });

    it("allows wounds to be removed", async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        renderDamageControl({
            wounds: [{damage: 5, location: "H", healed: 0,
                      id: 2, effect: "Throat punctured."}],
            onWoundRemove: spy
            })
        await user.click(screen.getAllByRole("button", {name: "Heal"})[1])
        expect(spy).toHaveBeenCalledWith({id:2});
    });

    it("allows wounds to be modified", async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        renderDamageControl({
            wounds: [{damage: 5, location: "H", healed: 0,
                      id: 2, effect: "Throat punctured."}],
            onWoundMod: spy
            })
        await user.click(screen.getByRole("button", {name: "Decrease damage"}))
        expect(spy).toHaveBeenCalledWith({id:2, healed: 1});
    });
});
