import React from 'react';

import {
    render,
    screen,
    waitFor,
    waitForElementToBeRemoved, within
} from '@testing-library/react'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import userEvent from '@testing-library/user-event'

const factories = require('./factories');

import StatBlock from 'StatBlock'


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


describe('stat block wounds handling', function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it("can load wounds", async () => {
        server.use(
            rest.get("http://localhost/rest/characters/2/wounds/", (req, res, ctx) => {
                return res(ctx.json([factories.woundFactory({
                    damage: 2,
                    effect: "Throat punctured"
                })]))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}))

        await waitFor(() => expect(screen.getByLabelText("Wound effect").textContent).toEqual("Throat punctured"))
        expect(screen.getByLabelText("AA penalty").textContent).toEqual("-10 AA")
    });

    it("allows wounds to be modified", async () => {
        const user = userEvent.setup()
        const wound = factories.woundFactory({
            id: 2,
            damage: 5,
            healed: 0
        });
        server.use(
            rest.get("http://localhost/rest/characters/2/wounds/", (req, res, ctx) => {
                return res(ctx.json([wound]))
            }),
            rest.patch("http://localhost/rest/characters/2/wounds/2/", async (req, res, ctx) => {
                return res(ctx.json(Object.assign({}, wound, await req.json())))
            })

        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}))
        await user.click(screen.getByRole("button", {name: "Decrease damage"}))

        await waitFor(() => expect(screen.getByLabelText("Current wound damage").textContent).toEqual("4"))
    });

    it("allows wounds to be removed", async () => {
        const user = userEvent.setup()
        const wound = factories.woundFactory({
            id: 2,
            damage: 5,
            healed: 0
        });
        server.use(
            rest.get("http://localhost/rest/characters/2/wounds/", (req, res, ctx) => {
                return res(ctx.json([wound]))
            }),
            rest.delete("http://localhost/rest/characters/2/wounds/2/", (req, res, ctx) => {
                return res(ctx.status(204))
            })

        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}))
        await user.click(screen.getByRole("button", {name: "Heal"}))

        await waitFor(() => expect(screen.queryByLabelText("Current wound damage")).not.toBeInTheDocument())
    });

    it("allows wounds to be added", async () => {
        const user = userEvent.setup()

        render(<StatBlock url="/rest/sheets/1/" />)

        async function normalizeWound(req) {
            let newObject = Object.assign(await req.json(), {id: 42});
            newObject.damage = parseInt(newObject.damage) ?? 0
            newObject.healed = parseInt(newObject.healed) ?? 0
            return newObject
        }

        server.use(
            rest.post("http://localhost/rest/characters/2/wounds/", async (req, res, ctx) => {
                return res(ctx.json(await normalizeWound(req)))
            })

        )

        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}))

        const damageInput = screen.getByRole("textbox", {name: "Damage"})
        await user.clear(damageInput)
        await user.type(damageInput, "5")
        const effectInput = within(screen.getByLabelText("Effect")).getByRole("combobox")
        await user.clear(effectInput)
        await user.type(effectInput, "Fuzznozzle")

        await user.click(screen.getByRole("button", {name: "Add wound"}))

        await waitFor(() => expect(screen.getByLabelText("Current wound damage").textContent).toEqual("5"))
        expect(screen.getByText("Fuzznozzle")).toBeInTheDocument()
    });
});