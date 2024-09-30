import React from 'react';

import StatBlock from 'StatBlock'

import { screen, render, waitForElementToBeRemoved, within, fireEvent, prettyDOM, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

import * as factories from './factories'
import {testSetup} from './testutils'

const server = setupServer(
  rest.get('http://localhost/rest/sheets/1/', (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()))
  }),
  rest.get('http://localhost/rest/sheets/1/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/ammunition/firearm/*/', (req, res, ctx) => {
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

describe('stat block weight handling', function() {
    beforeAll(() => {
        testSetup()
        server.listen({ onUnhandledRequest: 'error' })
    })
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it("can calculate weight", async () => {

        server.use(
            rest.get('http://localhost/rest/sheets/1/inventory/', (req, res, ctx) => {
                return res(ctx.json([
                    factories.inventoryEntryFactory({
                        unit_weight: 5.50,
                        quantity: 1
                    })
                ]))
            }),
        )
        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})
        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("5.50 kg")
    });

    it("integrates with Inventory", async () => {
        server.use(
            rest.post('http://localhost/rest/sheets/1/inventory/', async (req, res, ctx) => {
                return res(ctx.json(Object.assign({}, await req.json(), {id: 42})))
            }),
        )

        const user = userEvent.setup()

        render(<StatBlock url="/rest/sheets/1/" />)

        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})

        expect(screen.getByLabelText("Weight carried").textContent).toEqual("0.00 kg")

        await user.click(screen.getByRole("button", {name: "Add entry"}))

        fireEvent.change(screen.getByRole("textbox", {name: "description"}), {target: {value: "Foofaa"}})
        fireEvent.change(screen.getByRole("textbox", {name: "weight"}), {target: {value: 0.5}})

        await user.click(screen.getByRole("button", {name: "Add entry"}))

        await waitFor(() => expect(screen.getByLabelText("Weight carried").textContent).toEqual("0.50 kg"))
    });

    it("adds armor weight", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetarmor/', async (req, res, ctx) => {
                return res(ctx.json(
                    [
                        factories.armorFactory({base: {weight: 8}})
                    ]
                ))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("8.00 kg")
    });

    it("accounts for armor quality", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetarmor/', async (req, res, ctx) => {
                return res(ctx.json(
                    [
                        factories.armorFactory({
                            base: {weight: 8},
                            quality: {mod_weight_multiplier: 0.8}
                        })
                    ]
                ))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("6.40 kg")
    });

    it("adds helm weight", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheethelm/', async (req, res, ctx) => {
                return res(ctx.json(
                    [
                        factories.armorFactory({
                            base: {is_helm: true, weight: 8},
                            quality: {mod_weight_multiplier: 0.8}
                        })
                    ]
                ))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})

        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("6.40 kg")
    });

    it("ignores armor weight if powered", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetarmor/', async (req, res, ctx) => {
                return res(ctx.json(
                    [
                        factories.armorFactory({base: {is_powered: true, weight: 8}})
                    ]
                ))
            }),
            rest.get('http://localhost/rest/sheets/1/sheethelm/', async (req, res, ctx) => {
                return res(ctx.json(
                    [
                        factories.armorFactory({
                            base: {is_helm: true, is_powered: true, weight: 8},
                            quality: {mod_weight_multiplier: 0.8}
                        })
                    ]
                ))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("0.00 kg")
    });

    it("adds close combat weapons weight", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetweapons/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.weaponFactory({
                base: {weight: 6},
                quality: {weight_multiplier: 0.5}})]
                ))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("3.00 kg")
    });

    it("adds weight of large weapons", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetweapons/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.weaponFactory({
                base: {weight: 6},
                quality: {weight_multiplier: 0.5},
                    size: 2}
                    )]
                ))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("9.00 kg")
    });

    it("adds ranged weapons weight", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetrangedweapons/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.weaponFactory({
                base: {weight: 6},
                quality: {weight_multiplier: 0.5}})]
                ))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})
        expect(screen.queryByText("Sheet data")).not.toBeInTheDocument()

        expect(screen.getByLabelText("Weight carried").textContent).toEqual("3.00 kg")
    });

    it("adds firearms weight", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetfirearms/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.firearmFactory({
                        base: {weight: 5},
                        scope: null
                    })]
                ))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})
        expect(screen.queryByText("Sheet data")).not.toBeInTheDocument()
        expect(screen.getByLabelText("Weight carried").textContent).toEqual("5.00 kg")
    });

    it("adds firearm magazine weight", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetfirearms/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.firearmFactory({
                        base: {weight: 5, magazine_weight: 0.75},
                        scope: null,
                        ammo: {weight: 12},
                        magazines: [{current: 30, capacity: 40}, {current: 30, capacity: 40}, {current: 40, capacity: 40}]
                    })]
                ))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})
        expect(screen.getByLabelText("Weight carried").textContent).toEqual("10.25 kg")
    });

    it("adds firearm magazine weight for caseless ammo", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetfirearms/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.firearmFactory({
                        base: {weight: 5, magazine_weight: 0.75},
                        scope: null,
                        ammo: {weight: 12, cartridge_weight: 12.2 },
                        magazines: [{current: 30, capacity: 40}, {current: 30, capacity: 40}, {current: 40, capacity: 40}]
                    })]
                ))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})
        expect(screen.getByLabelText("Weight carried").textContent).toEqual("8.47 kg")
    });

    it("adds scope weight", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetfirearms/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.firearmFactory({
                        base: {weight: 5},
                        scope: {weight: 0.5}
                    })]
                ))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})

        expect(screen.getByLabelText("Weight carried").textContent).toEqual("5.50 kg")
    });

    it("adds miscellaneous items weight", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetmiscellaneousitems/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.sheetMiscellaneousItemFactory({
                        item: {weight: 2}
                    })]
                ))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)

        await waitForElementToBeRemoved(() => sheet.getByText("Sheet data"), {timeout: 5000})

        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("2.00 kg")
    });

    it("handles lists of weapons", async () => {
        server.use(
            rest.get('http://localhost/rest/sheets/1/sheetweapons/', async (req, res, ctx) => {
                return res(ctx.json(
                    [factories.weaponFactory({
                base: {weight: 6},
                quality: {weight_multiplier: 0.5}}),
                    factories.weaponFactory({
                base: {weight: 4}})]
                ))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()), {timeout: 5000})

        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("7.00 kg")
    });

    it("accounts for changes in gravitation", async () => {
        const user = userEvent.setup()

        server.use(
          rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
            return res(ctx.json(factories.characterFactory({weigth: "80.0"})))
          }),
            rest.get('http://localhost/rest/sheets/1/inventory/', (req, res, ctx) => {
                return res(ctx.json([
                    factories.inventoryEntryFactory({
                        unit_weight: 5.50,
                        quantity: 1
                    })
                ]))
            }),
        )
        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})

        await user.click(screen.getByRole("button", {name: "Combat transients"}))

        const input = screen.getByRole("textbox", {name: "Gravity"})
        await user.clear(input)
        await user.type(input, "2.0")
        expect(input).toHaveClass("is-valid")
        expect(sheet.getByLabelText("Weight carried").textContent).toEqual("11.00 kg")
    });

    test.todo("power armor suspended weight")
});