import React from 'react';

import StatBlock from 'StatBlock'

import {
    render,
    waitFor,
    waitForElementToBeRemoved,
    screen
} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

import * as factories from './factories'
import {testSetup} from "./testutils";

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
    }),
)

describe('StatBlock -- RangedWeaponControl', () => {
    beforeAll(() => {
        testSetup()
        server.listen({ onUnhandledRequest: 'error' })
    })
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it ("allows adding a weapon", async () => {
        const user = userEvent.setup()
        const weaponTemplate = factories.rangedWeaponTemplateFactory({name: "Puncher"});
        const weaponQuality = factories.weaponQualityFactory({name: "Stingy"});

        server.use(
            rest.get("http://localhost/rest/rangedweapontemplates/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    weaponTemplate
                ]))
            }),
            rest.get("http://localhost/rest/weaponqualities/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    weaponQuality
                ]))
            }),
            rest.post("http://localhost/rest/sheets/1/sheetrangedweapons/", async (req, res, ctx) => {
                const json = await req.json()
                expect(json.base).toEqual(weaponTemplate.id)
                expect(json.quality).toEqual(weaponQuality.name)
                return res(ctx.json(
                    Object.assign({id: 300, name: "Stingy Puncher"}, json)
                ))
            })
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        const firearmInput = await screen.findByRole("combobox", {name: "Ranged Weapon"})
        await user.click(firearmInput)

        await user.click(screen.getByText(/Puncher/))

        const input = await screen.findByRole("combobox", {name: "Ranged Weapon Quality"})
        await user.click(input)

        await user.click(screen.getByText(/Stingy/))

        await user.click(screen.getByRole("button", {name: "Add Ranged Weapon"}))

        expect(await screen.findByText(/Stingy Puncher/)).toBeInTheDocument()
    })

    it ("allows removing a weapon", async () => {
        const user = userEvent.setup()

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetrangedweapons/", async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.rangedWeaponFactory({id: 300, name: "Stingy Puncher"})]
                ))
            }),
            rest.delete("http://localhost/rest/sheets/1/sheetrangedweapons/300/", async (req, res, ctx) => {
                return res(ctx.status(204))
            })
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        expect(screen.getByText(/Stingy Puncher/)).toBeInTheDocument()

        await user.click(screen.getByRole("button", {name: "Remove"}))

        await waitFor(() => expect(screen.queryByText(/Stingy Puncher/)).not.toBeInTheDocument())
    })

});
