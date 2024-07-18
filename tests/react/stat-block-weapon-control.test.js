import React from 'react';

import StatBlock from 'StatBlock'

import {
    render,
    waitForElementToBeRemoved,
    within,
    fireEvent,
    prettyDOM,
    waitFor,
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

describe('StatBlock -- WeaponControl', () => {
    beforeAll(() => {
        testSetup()
        server.listen({ onUnhandledRequest: 'error' })
    })
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it ("allows adding a weapon", async () => {
        const user = userEvent.setup()
        const weaponTemplate = factories.weaponTemplateFactory({name: "Slicer"});
        const weaponQuality = factories.weaponQualityFactory({name: "Superb"});

        server.use(
            rest.get("http://localhost/rest/weapontemplates/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    weaponTemplate
                ]))
            }),
            rest.get("http://localhost/rest/weaponqualities/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    weaponQuality
                ]))
            }),
            rest.post("http://localhost/rest/sheets/1/sheetweapons/", async (req, res, ctx) => {
                const json = await req.json()
                expect(json.base).toEqual(weaponTemplate.id)
                expect(json.quality).toEqual(weaponQuality.name)
                return res(ctx.json(
                    Object.assign({id: 300, name: "Superb Slicer"}, json)
                ))
            })
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        const firearmInput = await screen.findByRole("combobox", {name: "CC Weapon"})
        await user.click(firearmInput)

        await user.click(screen.getByText(/Slicer/))

        const input = await screen.findByRole("combobox", {name: "CC Weapon Quality"})
        await user.click(input)

        await user.click(screen.getByText(/Superb/))

        await user.click(screen.getByRole("button", {name: "Add CC Weapon"}))

        expect(await screen.findByText(/Superb Slicer/)).toBeInTheDocument()
    })
});
