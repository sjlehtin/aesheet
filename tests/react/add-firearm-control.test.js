import React from 'react';

import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AddFirearmControl from 'AddFirearmControl';
import {rest} from "msw";
import {setupServer} from 'msw/node'

import * as factories from './factories'

const server = setupServer(
    rest.get('http://localhost/rest/firearms/campaign/2/', (req, res, ctx) => {
        return res(ctx.json([factories.baseFirearmFactory({name: "Luger"})]))
    }),
    rest.get('http://localhost/rest/ammunition/firearm/Luger/', (req, res, ctx) => {
        return res(ctx.json([factories.ammunitionFactory({id: 300, calibre: {name: "9Pb"}}), factories.ammunitionFactory({id: 301, calibre: {name: "9Pb+"}})]))
    }),
)

describe('AddFireArmControl',  function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('can add firearms', async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({});

        render(<AddFirearmControl campaign={2} onFirearmAdd={spy}/>)

        const firearmInput = screen.getByRole("combobox", {name: "Firearm"})

        expect(firearmInput.getAttribute('aria-busy')).toEqual("true")
        await waitFor(() => expect(screen.queryByRole("combobox", {busy: true})).toBeNull())

        await user.type(firearmInput, "lug")

        await user.click(await screen.findByText(/Luger/))

        await user.type(screen.getByRole("combobox", {name: "Ammo"}), "9Pb")
        await user.click(await screen.findByText(/9Pb\+/))

        await user.click(screen.getByRole("button", {name: "Add Firearm"}))

        expect(spy).toHaveBeenCalled()
        expect(spy.mock.lastCall[0].ammo.id).toEqual(301)
        expect(spy.mock.lastCall[0].base.name).toEqual("Luger")
        expect(spy.mock.lastCall[0].use_type).toEqual("FULL")
    });
})