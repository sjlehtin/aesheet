import React from 'react';

import StatBlock from 'StatBlock'

import * as factories from './factories'

import {render, waitFor, waitForElementToBeRemoved, screen, within} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'
import {testSetup} from "./testutils";

const normalQuality = factories.armorQualityFactory({name: 'normal'})
const nanoQuality = factories.armorQualityFactory({name: 'Nanotech'})
const theArmorTemplate = factories.armorTemplateFactory({name: "The Armor"});
const theHelmTemplate = factories.armorTemplateFactory({name: "The Helm", is_helm: true});

const server = setupServer(
  rest.get('http://localhost/rest/sheets/1/', (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()))
  }),
  rest.get('http://localhost/rest/sheets/1/sheetarmor/', (req, res, ctx) => {
      return res(ctx.json([factories.armorFactory({name: "Ze Armor", base: theArmorTemplate, quality: nanoQuality})]))
  }),
  rest.get('http://localhost/rest/sheets/1/sheethelm/', (req, res, ctx) => {
    return res(ctx.json([factories.armorFactory({name: "Ze Helm", base: theHelmTemplate, quality: nanoQuality})]))
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
  rest.get('http://localhost/rest/armortemplates/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([
        factories.armorTemplateFactory({name: 'Advanced Combat Armor'}),
        factories.armorTemplateFactory({name: 'Advanced Combat Helmet', is_helm: true}),
        theArmorTemplate,
        theHelmTemplate]))
    }),
  rest.get('http://localhost/rest/armorqualities/campaign/2/', (req, res, ctx) => {
      return res(ctx.json([
        normalQuality,
        nanoQuality,
    ]))
  }),
  rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
)

describe('stat block armor handling', function() {
    beforeAll(() => {
        testSetup()
        server.listen({ onUnhandledRequest: 'error' })
    })
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it("can load and edit armor", async function () {
        const user = userEvent.setup()

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        expect(screen.getByText(/Ze Armor/)).toBeInTheDocument()
        expect(screen.getByText(/Ze Helm/)).toBeInTheDocument()

        expect(screen.queryByRole("button", {name: "Remove helmet"})).not.toBeInTheDocument()

        await user.click(screen.getByRole("button", {name: "Edit Armor"}))

        // Change armor
        const armorSelector = within(screen.getByLabelText("Select armor")).getByRole("combobox")
        await waitFor(() => expect(armorSelector.value).toEqual("The Armor"))

        const armorQualitySelector = within(screen.getByLabelText("Select armor quality")).getByRole("combobox")
        await waitFor(() => expect(armorQualitySelector.value).toEqual("Nanotech"))

        await user.clear(armorSelector)
        await user.type(armorSelector, "com")
        await user.click(screen.getByText("Advanced Combat Armor"))

        await user.clear(armorQualitySelector)
        await user.type(armorQualitySelector, "nor")
        await user.click(screen.getByText("normal"))

        let armorValues = []
        server.use(
          rest.post('http://localhost/rest/sheets/1/sheetarmor/', async (req, res, ctx) => {
              const json = await req.json();
              armorValues.push(json)
              return res(ctx.json(Object.assign(  {id: 300, name: json.base}, json)))
          }),
        )

        await user.click(screen.getByRole("button", {name: "Set Armor"}))

        expect(armorSelector.value).toEqual("Advanced Combat Armor")
        expect(armorQualitySelector.value).toEqual("normal")

        expect(armorValues[0]).toEqual({
            base: "Advanced Combat Armor", quality: "normal"})

        // Change helmet
        const helmSelector = within(screen.getByLabelText("Select helmet")).getByRole("combobox")

        expect(helmSelector.value).toEqual("The Helm")

        await user.clear(helmSelector)
        await user.type(helmSelector, "com")
        await user.click(screen.getByText("Advanced Combat Helmet"))

        let helmValues = []
        server.use(
          rest.post('http://localhost/rest/sheets/1/sheethelm/', async (req, res, ctx) => {
              const json = await req.json();
              helmValues.push(json)
              return res(ctx.json(Object.assign(  {id: 400, name: json.base}, json)))
          }),
        )

        await user.click(screen.getByRole("button", {name: "Set Helmet"}))

        expect(helmValues[0]).toEqual({
            base: "Advanced Combat Helmet", quality: "Nanotech"})

        // Remove helmet
        await waitFor(() => expect(screen.getByLabelText("Current helmet").textContent).toEqual("Advanced Combat Helmet"))

        server.use(
          rest.delete('http://localhost/rest/sheets/1/sheethelm/400/', async (req, res, ctx) => {
              return res(ctx.status(204))
          }),
        )
        await user.click(screen.getByRole("button", {name: "Remove helmet"}))

        await waitFor(() => expect(screen.getByLabelText("Current helmet").textContent).toEqual(""))

        // Remove armor
        await waitFor(() => expect(screen.getByLabelText("Current armor").textContent).toEqual("Advanced Combat Armor"))

        server.use(
          rest.delete('http://localhost/rest/sheets/1/sheetarmor/300/', async (req, res, ctx) => {
              return res(ctx.status(204))
          }),
        )
        await user.click(screen.getByRole("button", {name: "Remove armor"}))

        await waitFor(() => expect(screen.getByLabelText("Current armor").textContent).toEqual(""))
    });

    it("can edit armor quality only", async function () {
        const user = userEvent.setup()

        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        expect(screen.getByText(/Ze Armor/)).toBeInTheDocument()
        expect(screen.getByText(/Ze Helm/)).toBeInTheDocument()

        await user.click(screen.getByRole("button", {name: "Edit Armor"}))

        // Change armor
        const armorSelector = within(screen.getByLabelText("Select armor")).getByRole("combobox")
        await waitFor(() => expect(armorSelector.value).toEqual("The Armor"))

        const armorQualitySelector = within(screen.getByLabelText("Select armor quality")).getByRole("combobox")
        expect(armorQualitySelector.value).toEqual("Nanotech")

        await user.clear(armorQualitySelector)
        await user.type(armorQualitySelector, "nor")
        await user.click(screen.getByText("normal"))

        let armorValues = []
        server.use(
            rest.post('http://localhost/rest/sheets/1/sheetarmor/', async (req, res, ctx) => {
                const json = await req.json();
                armorValues.push(json)
                return res(ctx.json(Object.assign({
                    id: 300,
                    name: json.base
                }, json)))
            }),
        )

        await user.click(screen.getByRole("button", {name: "Set Armor"}))

        expect(armorSelector.value).toEqual("The Armor")
        expect(armorQualitySelector.value).toEqual("normal")

        expect(armorValues[0]).toEqual({
        base: "The Armor", quality: "normal"})

    })
});