import React from 'react';

import StatBlock from 'StatBlock'

import { render, waitForElementToBeRemoved, within, fireEvent } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

const factories = require('./factories');

const server = setupServer(
  rest.get('http://localhost/rest/sheets/1/', (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()))
  }),
  rest.get('http://localhost/rest/sheets/1/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
    return res(ctx.json(factories.characterFactory()))
  }),
  rest.get('http://localhost/rest/characters/2/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([]))
  })
)

describe('StatBlock -- FirearmControl', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('allows changing a firearm', async () => {
        const user = userEvent.setup()
        const firearm = factories.firearmFactory({'base': {name: "The Cannon"}});

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.get("http://localhost/rest/ammunition/firearm/The%20Cannon/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.ammunitionFactory({id: 97, calibre: {name: "12FR"}}),
                    factories.ammunitionFactory({id: 42, calibre: {name: "FooAmmo"}, num_dice: 3, dice: 4, extra_damage: 3, leth: 4, plus_leth: 2}),
                ]))
            }),
            rest.patch("http://localhost/rest/sheets/1/sheetfirearms/1/", (req, res, ctx) => {
                return res(ctx.json(
                    Object.assign({}, firearm, req)
                ))
            }),

            rest.get("http://localhost/rest/scopes/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.scopeFactory({id: 42, name: "Baff baff", notes: "Awesome scope"}),
                ]))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        await sheet.findByText("The Cannon")

        const input = await sheet.findByRole("combobox", {name: "Select ammunition"})
        await user.click(input)

        await user.click(await within(input).findByText(/FooAmmo/))

        await within(await sheet.findByLabelText(/Firearm/)).findByText("3d4+3/4 (+2)")

        const scopeInput = await sheet.findByRole("combobox", {name: "Scope selection"})
        await user.click(scopeInput)

        await user.click(await within(scopeInput).findByText(/Baff baff/))

        await within(await sheet.findByLabelText(/Firearm/)).findByText("Awesome scope")
    });

    it('allows changing range to shoot to', async () => {
        const user = userEvent.setup()

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                ]))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)

        await waitForElementToBeRemoved(document.querySelector("#loading"))

        const input = await sheet.findByLabelText("Target at range")

        fireEvent.change(input, {target: {value: "50"}})

        const dlInput = await sheet.findByRole("combobox", {name: "Darkness DL"})
        await user.click(dlInput)

        await user.click(await within(dlInput).findByText(/Artificial light/))

        expect((await sheet.findByLabelText("Vision check")).textContent).toEqual("43")
        expect((await sheet.findByLabelText("Vision check detail")).textContent).toEqual("Ranged penalty: 32")
    });


    it('allows removing a scope from a firearm', async () => {
        const user = userEvent.setup()
        const firearm = factories.firearmFactory({
            id: 1,
            'base': {name: "The Cannon"},
            scope: factories.scopeFactory({name: "Awesome scope", id: 42})
        });

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.get("http://localhost/rest/ammunition/firearm/The%20Cannon/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.ammunitionFactory({id: 97, calibre: {name: "12FR"}}),
                    factories.ammunitionFactory({id: 42, calibre: {name: "FooAmmo"}, num_dice: 3, dice: 4, extra_damage: 3, leth: 4, plus_leth: 2}),
                ]))
            }),
            rest.patch("http://localhost/rest/sheets/1/sheetfirearms/1/", (req, res, ctx) => {
                return res(ctx.json(
                    Object.assign({}, firearm, req)
                ))
            }),

            rest.get("http://localhost/rest/scopes/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.scopeFactory({id: 42, name: "Baff baff", notes: "Awesome scope"}),
                ]))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"))


        const firearmBlock = await sheet.findByLabelText(/Firearm/);
        await within(firearmBlock).findByText("Awesome scope")
        await user.click(await within(firearmBlock).findByRole("button", {name: "Remove scope"}))
        expect(await within(await sheet.findByLabelText(/Firearm/)).queryByText("Awesome scope")).toBeNull()
    });
});
