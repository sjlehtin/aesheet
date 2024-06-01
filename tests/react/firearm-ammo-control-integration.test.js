import React from "react";

import {render, screen, waitFor, within} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

import FirearmControl from "FirearmControl";

import * as factories from './factories'

const server = setupServer(
    rest.get('http://localhost/rest/ammunition/firearm/*/', (req, res, ctx) => {
        return res(ctx.json([]))
    }),
    rest.get('http://localhost/rest/scopes/campaign/*/', (req, res, ctx) => {
        return res(ctx.json([]))
    }),
)

describe('FirearmControl -- AmmoControl', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('renders AmmoControl', async () => {
        const props = factories.firearmControlPropsFactory({weapon:
            {ammo: {calibre: {name: "Test Ammo"}}}});

        const control = render(<FirearmControl {...props}/>)

        await control.findByText(/Test Ammo/)
        const elem_arr = await control.queryAllByDisplayValue(/undefined/)
        expect(elem_arr.length).toBe(0)
    });

    it('integrates AmmoControl for listing URL', async () => {
        const user = userEvent.setup()

        server.use(
            rest.get('http://localhost/rest/ammunition/firearm/Nabu%20tussari/', (req, res, ctx) => {
                return res(ctx.json([factories.ammunitionFactory({calibre: {name: "Roblox"}, bullet_type: "FMJ-CHROME"})]))
            }),
        )
        const props = factories.firearmControlPropsFactory({weapon:
            {base: {name: "Nabu tussari"},
             ammo: {calibre: {name: "Test Ammo"}}}});

        render(<FirearmControl {...props}/>)

        await waitFor(() => expect(screen.queryByRole("combobox", {name: "Select ammunition", busy: false})).toBeInTheDocument())
        await user.click(screen.getByRole("combobox", {name: "Select ammunition", busy: false}))

        await screen.findByText(/Roblox/)
        await screen.findByText(/FMJ-CHROME/)
    });

    it('integrates AmmoControl for changing ammmo', async () => {
        const user = userEvent.setup()

        const newAmmo = factories.ammunitionFactory({calibre: {name: "Skudaa"}, bullet_type: "AR-SON"})

        server.use(
            rest.get('http://localhost/rest/ammunition/firearm/Nabu%20tussari/', (req, res, ctx) => {
                return res(ctx.json([factories.ammunitionFactory({calibre: {name: "Roblox"}, bullet_type: "FMJ-CHROME"}),
                    newAmmo
                ]))
            }),
        )

        let spy = jest.fn().mockResolvedValue({});

        const props = factories.firearmControlPropsFactory({
            weapon:
                {
                    id: 52,
                    base: {name: "Nabu tussari"},
                    ammo: {calibre: {name: "Test Ammo"}}
                },
            onChange: spy
        });

        render(<FirearmControl {...props}/>)

        expect(spy).not.toHaveBeenCalled()

        await waitFor(() => expect(screen.queryByRole("combobox", {name: "Select ammunition", busy: false})).toBeInTheDocument())

        const ammoDropdown = screen.getByRole("combobox", {name: "Select ammunition", busy: false});
        await user.click(ammoDropdown)

        await user.click(screen.getByText(/Skudaa/))

        // Check that the control passes the correct value up.
        expect(spy).toHaveBeenCalledWith({id: 52, ammo: newAmmo})
    });
});
