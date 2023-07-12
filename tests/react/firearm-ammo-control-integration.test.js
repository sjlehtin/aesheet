import React from "react";

import { render } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

import FirearmControl from "FirearmControl";

const factories = require('./factories');

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

        const control = render(<FirearmControl {...props}/>)

        const elem_arr = await control.findAllByRole('combobox', {busy: false})
        await user.click(elem_arr[0].querySelector('.rw-picker-caret'));

        await control.findByText(/Roblox/)
        await control.findByText(/FMJ-CHROME/)
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

        const control = render(<FirearmControl {...props}/>)

        expect(spy).not.toHaveBeenCalled()

        const elem_arr = await control.findAllByRole('combobox', {busy: false})
        await user.click(elem_arr[0].querySelector('.rw-picker-caret'));

        let options = await control.findAllByRole('option', {});

        expect(options.length).toEqual(2)

        await user.click(options[1])

        // Check that the control passes the correct value up.
        expect(spy).toHaveBeenCalledWith({id: 52, ammo: newAmmo})
    });
});
