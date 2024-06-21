import React from 'react';

import StatBlock from 'StatBlock'

import {
    render,
    waitForElementToBeRemoved,
    within,
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
    return res(ctx.json(factories.characterFactory({cur_fit: 50, cur_ref: 50})))
  }),
  rest.get('http://localhost/rest/characters/2/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
    rest.get('http://localhost/rest/skills/campaign/2/', (req, res, ctx) => {
      return res(ctx.json([factories.skillFactory({name: "Low-G maneuver"}), factories.skillFactory({name: "High-G maneuver"}),]))
    }),
    rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
        return res(ctx.json([]))
    }),
)

describe('StatBlock -- gravity', () => {
    beforeAll(() => {
        testSetup()
        server.listen({onUnhandledRequest: 'error'})
    })
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('allows changing gravity', async () => {
        const user = userEvent.setup()

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetrangedweapons/", (req, res, ctx) => {
                return res(ctx.json([factories.rangedWeaponFactory({base: {range_s: 30, range_m: 50, range_l: 100}})]))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/"/>)

        await waitForElementToBeRemoved(document.querySelector("#loading"))

        expect(screen.getByLabelText("Short range").textContent).toEqual("30")

        expect(screen.getByLabelText("Current REF").textContent).toEqual("49")
        expect(screen.getByLabelText("Current FIT").textContent).toEqual("49")

        expect(screen.getByLabelText("Weight carried").textContent).toEqual("1.00 kg")

        await user.click(screen.getByRole("button", {name: "Combat transients"}))

        const input = await screen.findByLabelText("Gravity")

        await user.clear(input)
        await user.type(input, "2")

        expect(screen.getByLabelText("Weight carried").textContent).toEqual("2.00 kg")

        expect(screen.getByLabelText("Short range").textContent).toEqual("15")

        expect(screen.getByLabelText("Current REF").textContent).toEqual("49")
        expect(screen.getByLabelText("Current FIT").textContent).toEqual("49")

        // Low gravity only increases extreme range, max 4x

        await user.clear(input)
        await user.type(input, "0.1")

        expect(screen.getByLabelText("Short range").textContent).toEqual("30")
    });
})