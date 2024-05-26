import React from 'react';

import AddArmorControl from 'AddArmorControl'

import factories from './factories'

import {render, waitFor, waitForElementToBeRemoved, screen, within} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

const server = setupServer(
  rest.get('http://localhost/rest/armortemplates/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([
        factories.armorTemplateFactory({name: 'Advanced Combat Armor'}),
        factories.armorTemplateFactory({name: 'Advanced Combat Helmet', is_helm: true})]))
  }),
  rest.get('http://localhost/rest/armorqualities/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([
        factories.armorQualityFactory({name: 'nanotech'}),
        factories.armorQualityFactory({name: 'normal'}),
    ]))
  }),
  rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
)

describe('stat block armor handling', function() {
    beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it("can load and edit armor", async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})

        render(<AddArmorControl tag={"Armor"} campaign={2} onChange={spy}/>)

        await waitForElementToBeRemoved(() => screen.queryAllByRole("combobox", {"busy": true}))

        const armorSelector = within(screen.getByLabelText("Select armor")).getByRole("combobox")

        expect(screen.getByRole("button", {name: "Set Armor"})).toBeDisabled()

        await user.type(armorSelector, "com")
        expect(screen.queryByText(/Advanced Combat Helmet/)).not.toBeInTheDocument()
        await user.click(screen.getByText("Advanced Combat Armor"))

        const qualitySelector = within(screen.getByLabelText("Select quality")).getByRole("combobox")
        expect(qualitySelector.value).toEqual("normal")

        await user.click(screen.getByRole("button", {name: "Set Armor"}))

        // TODO: assert full object later. Current system has the payload cleaning in StatBlock.
        expect(spy).toHaveBeenCalled()
        expect(spy.mock.lastCall[0].base.name).toEqual("Advanced Combat Armor")
        expect(spy.mock.lastCall[0].quality.name).toEqual("normal")

        // The armor should clear after pressing set.
        expect(armorSelector.value).toEqual("")
        expect(qualitySelector.value).toEqual("normal")
    })

    it("can load and edit helm", async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})

        render(<AddArmorControl tag={"Helmet"} campaign={2} onChange={spy}/>)

        await waitForElementToBeRemoved(() => screen.queryAllByRole("combobox", {"busy": true}))

        const armorSelector = within(screen.getByLabelText("Select helmet")).getByRole("combobox")

        await user.type(armorSelector, "com")
        expect(screen.queryByText(/Advanced Combat Armor/)).not.toBeInTheDocument()
        await user.click(screen.getByText("Advanced Combat Helmet"))

        await user.click(screen.getByRole("button", {name: "Set Helmet"}))

        expect(spy).toHaveBeenCalled()
        expect(spy.mock.lastCall[0].base.name).toEqual("Advanced Combat Helmet")
        expect(spy.mock.lastCall[0].quality.name).toEqual("normal")

        expect(armorSelector.value).toEqual("")

    })

    xit("can add existing helmet and armor", test.todo)
})