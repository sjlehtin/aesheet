import React from 'react';

import { screen, render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import XPControl from 'XPControl';
import * as factories from './factories'

import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
)

describe('XPControl', function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    var charDataFactory = function (statOverrides) {
        let overrides = {
            "cur_fit": 80,
            "cur_ref": 50,
            "cur_lrn": 47,
            "cur_int": 46,
            "cur_psy": 43,
            "cur_wil": 44,
            "cur_cha": 62,
            "cur_pos": 48,
        };

        return factories.characterFactory(Object.assign(overrides, statOverrides));
    };


    const renderXPControl = function(givenProps) {
        let props = {
            url: "/rest/characters/1/",
            initialChar: charDataFactory(),
            edgesBought: 0
        };

        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }

        return render(<XPControl {...props} />)
    };

    it('can calculate used xp', function (){
        expect(XPControl.calculateStatRaises(charDataFactory())).toEqual(76);
        expect(XPControl.calculateStatRaises(charDataFactory({bought_mana: 2}))).toEqual(78);
        expect(XPControl.calculateStatRaises(charDataFactory({bought_stamina: 2}))).toEqual(78);
    });

    it('can calculate used xp from edges', function () {
        renderXPControl();
        expect(screen.getByLabelText("XP used for edges").textContent).toEqual("0")
    });

    it('can take free edges into account', function () {
        renderXPControl({
            edgesBought: 3, initialChar:
            charDataFactory({free_edges: 2})});
        expect(screen.getByLabelText("XP used for edges").textContent).toEqual("25")
    });

    it('will not allow negative cost from free edges', function () {
        renderXPControl({
            edgesBought: 3, initialChar:
            charDataFactory({free_edges: 4})});
        expect(screen.getByLabelText("XP used for edges").textContent).toEqual("0")
    });

    it('reacts to input', async function () {
        const user = userEvent.setup()

        const callback = jest.fn().mockResolvedValue({})

        renderXPControl({
            initialChar: charDataFactory({total_xp: 60}),
            onMod: callback
        });

        await user.click(screen.getByRole("button", {name: "Add XP"}))

        const textInput = screen.getByRole("textbox");

        expect(textInput.value).toEqual("0")
        expect(textInput).toHaveFocus()

        const addButton = screen.getByRole("button", {name: "Add"})

        await user.clear(textInput)
        await user.type(textInput, "foo")
        expect(addButton).toBeDisabled()

        await user.clear(textInput)
        await user.type(textInput, "200")

        expect(addButton).not.toBeDisabled()

        let values = []
        server.use(
            rest.patch("http://localhost/rest/characters/1/", async (req, res, ctx) => {
                const payload = await req.json();
                values.push(payload)
                return res(ctx.json(payload))
            }),
        )
        await user.click(addButton)

        expect(values[0]).toEqual({total_xp: 260})
        expect(callback).toHaveBeenCalledWith("total_xp", 60 ,260)
    });

    it('allows adding to be canceled', async function () {
        const user = userEvent.setup()

        renderXPControl({
            initialChar: charDataFactory({total_xp: 60})
        });

        await user.click(screen.getByRole("button", {name: "Add XP"}))

        const textInput = screen.getByRole("textbox")

        expect(textInput.value).toEqual("0")
        expect(textInput).toHaveFocus()

        expect(screen.queryByRole("textbox")).not.toBe(null)

        await user.click(screen.getByRole("button", {name: "Close"}))

        expect(screen.queryByRole("textbox")).toBe(null)
    });

});
