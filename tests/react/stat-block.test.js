import React from 'react';

import StatBlock from 'StatBlock'
import {
    render,
    screen,
    waitFor,
    waitForElementToBeRemoved,
    within
} from '@testing-library/react'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import userEvent from '@testing-library/user-event'
import {testSetup} from "./testutils";

import * as factories from './factories'

let objectId = 900

const server = setupServer(
  rest.get('http://localhost/rest/sheets/1/', (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()))
  }),
  rest.get('http://localhost/rest/sheets/1/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
    return res(ctx.json(factories.characterFactory({name: "Grok the Barbarian", free_edges: 1,
        cur_wil: 53, cur_psy: 42, bought_mana: 5})))
  }),
  rest.get('http://localhost/rest/edgelevels/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([factories.edgeLevelFactory({edge: "Toughness", level: 1, cost: 2.0})]))
  }),

  rest.get("http://localhost/rest/skills/campaign/2/", (req, res, ctx) => {
      return res(ctx.json([factories.skillFactory({name: "Gardening", skill_cost_0: 1,
        skill_cost_1: 1, skill_cost_2: 2, skill_cost_3: 3})]))
  }),

  rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/characters/2/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.post('http://localhost/rest/characters/2/characteredges/', async (req, res, ctx) => {
    let json = await req.json();
    if (!json.id) {
        json.id = objectId
        objectId++
    }
    return res(ctx.json(json))
  }),
  rest.patch('http://localhost/rest/characters/2/characteredges/*/', async (req, res, ctx) => {
    return res(ctx.json(await req.json()))
  }),
)

describe('StatBlock', function() {
    beforeAll(() => {
        testSetup()
        server.listen({ onUnhandledRequest: 'error' })
    })
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('can load the sheet and perform edits', async function () {
        const user = userEvent.setup()

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        expect(await screen.findByText(/Grok the Barbarian/i)).toBeInTheDocument()

        // Verify Edge can be added correctly
        expect(screen.queryByLabelText("Body from Toughness")).toBe(null)
        expect(screen.queryByLabelText("XP used for edges").textContent).toEqual("0")

        const edgeLevelChooser = within(screen.getByLabelText("Add edge level")).getByRole("combobox")
        await user.clear(edgeLevelChooser)
        await user.type(edgeLevelChooser, "toug")
        await user.click(screen.getByText("Toughness 1"))
        await user.click(screen.getByRole("button", {name: "Add EdgeLevel"}))

        expect(screen.queryByLabelText("Body from Toughness").textContent).toEqual("2")
        expect(screen.queryByLabelText("XP used for edges").textContent).toEqual("25")

        // Can toggle free edge for toughness on and off
        await user.click(screen.getByRole("checkbox", {name: "Ignore cost"}))
        await waitFor(() => {expect(screen.queryByLabelText("XP used for edges").textContent).toEqual("0")})

        await user.click(screen.getByRole("checkbox", {name: "Ignore cost"}))
        await waitFor(() => {expect(screen.queryByLabelText("XP used for edges").textContent).toEqual("25")})

        // Calculate mana and take bought mana into account
        expect(screen.queryByLabelText("Maximum mana").textContent).toEqual("29")
    });

    // xit('handles edge removal', test.todo);
    //


    // TODO: unit test recovery functions, only verify here that integration ok
    it('can indicate stamina recovery with Fast Healing', async function () {
        server.use(
            rest.get("http://localhost/rest/characters/2/characteredges/", (req, res, ctx) => {
                return res(ctx.json([factories.characterEdgeFactory({edge: {edge: "Fast Healing", level: 2}})]))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        expect(screen.queryByLabelText("Stamina recovery").textContent).toEqual("2d6/8h")

    });

    it('can indicate stamina recovery with high stat', async function () {
        server.use(
              rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
                return res(ctx.json(factories.characterFactory({name: "Grok the Barbarian", free_edges: 1,
                    cur_fit: 70, cur_psy: 51, bought_mana: 5})))
              }),
        )

        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        expect(screen.queryByLabelText("Stamina recovery").textContent).toEqual("1/8h")

        expect(screen.queryByLabelText("Body healing").textContent).toEqual("3/16d")
    });

    it('can indicate stamina recovery with high stat and edge', async function () {
        server.use(
              rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
                return res(ctx.json(factories.characterFactory({name: "Grok the Barbarian", free_edges: 1,
                    cur_fit: 70, cur_psy: 51, bought_mana: 5})))
              }),
            rest.get("http://localhost/rest/characters/2/characteredges/", (req, res, ctx) => {
                return res(ctx.json([factories.characterEdgeFactory(
                    {edge: {edge: "Fast Healing", level: 3, cost: 5, notes: "Heal very very fast"}})]))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        expect(screen.queryByLabelText("Stamina recovery").textContent).toEqual("1+4d6/8h")

        expect(screen.queryByLabelText("Body healing").textContent).toEqual("3/2d")

        expect(screen.getByText(/Heal very very fast/)).toBeInTheDocument()
    });

    it('can indicate mana recovery with high stat and edge', async function () {
        server.use(
              rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
                return res(ctx.json(factories.characterFactory({name: "Grok the Barbarian", free_edges: 1,
                    cur_cha: 70, cur_psy: 51, bought_mana: 5})))
              }),
            rest.get("http://localhost/rest/characters/2/characteredges/", (req, res, ctx) => {
                return res(ctx.json([factories.characterEdgeFactory(
                    {edge: {edge: "Fast Mana Recovery", level: 1}})]))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        expect(screen.queryByLabelText("Mana recovery").textContent).toEqual("2+2d6/8h")
    });

    it('can load the sheet and perform skill edits', async function () {
        const user = userEvent.setup()

        server.use(
            rest.get("http://localhost/rest/characters/2/characterskills/", (req, res, ctx) => {
                const skill = factories.characterSkillFactory({skill: "Gardening", level: 2, id: 300});
                console.log("loading character skills", skill)
                return res(ctx.json([skill]))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        let values = []
        server.use(
            rest.delete("http://localhost/rest/characters/2/characterskills/300/", (req, res, ctx) => {
                values.push(true)
                return res(ctx.json({}))
            }),
        )

        const row = screen.getByText("Gardening").closest('tr')
        const removeButton = within(row).getByLabelText("Remove skill")
        await user.click(removeButton)

        // The delete endpoint should have triggered.
        expect(values[0]).toBe(true)

        await waitFor(() => (expect(screen.queryByText("Gardening")).toBe(null)))

        const skillInput = within(screen.getByLabelText("Add skill name")).getByRole("combobox")
        await user.clear(skillInput)
        await user.type(skillInput, "gard")
        await user.click(screen.getByText("Gardening"))

        server.use(
            rest.post("http://localhost/rest/characters/2/characterskills/", async (req, res, ctx) => {
                return res(ctx.json(Object.assign(await req.json(), {id: 422})))
            }),
            rest.patch("http://localhost/rest/characters/2/characterskills/422", async (req, res, ctx) => {
                return res(ctx.json(await req.json()))
            }),
            rest.delete("http://localhost/rest/characters/2/characterskills/422/", (req, res, ctx) => {
                return res(ctx.json({}))
            }),
        )

        await user.click(screen.getByRole("button", {name: "Add skill"}))

        const newRow = (await within(screen.getByRole("table", {name: "Skills"})).findByText("Gardening")).closest('tr')
        expect(newRow).toBeInTheDocument()

        await user.click(within(newRow).getByRole("button", {name: "Increase skill level"}))

        await waitFor(() => expect(within(newRow).getByLabelText("Skill level").textContent).toEqual("1"))

        await user.click(within(newRow).getByRole("button", {name: "Decrease skill level"}))
        await waitFor(() => expect(within(newRow).getByLabelText("Skill level").textContent).toEqual("0"))

        expect(within(screen.getByRole("table", {name: "Skills"})).queryByText("Gardening")).not.toBe(null)

        await user.click(within(newRow).getByRole("button", {name: "Remove skill"}))

        await waitFor(() => expect(within(screen.getByRole("table", {name: "Skills"})).queryByText("Gardening")).toBe(null))
    })

    it('can modify XP', async function () {
        const user = userEvent.setup()

        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        expect(screen.queryByTitle("Total XP").textContent).toEqual("0")

        await user.click(screen.getByRole("button", {name: "Add XP"}))

        await user.type(screen.getByLabelText("Add XP", {selector: "input"}), "20")

        server.use(
            rest.patch("http://localhost/rest/characters/2/", async (req, res, ctx) => {
                return res(ctx.json(await req.json()))
            }),
        )

        await user.click(screen.getByRole("button", {name: "Add"}))

        await waitFor(() => expect(screen.queryByTitle("Total XP").textContent).toEqual("20"))
    });

    it('can add and remove firearms', async function () {
        const user = userEvent.setup()

        server.use(
            rest.get('http://localhost/rest/firearms/campaign/2/', (req, res, ctx) => {
                return res(ctx.json([factories.baseFirearmFactory({name: "Luger"})]))
            }),
            rest.get('http://localhost/rest/ammunition/firearm/Luger/', (req, res, ctx) => {
                return res(ctx.json([factories.ammunitionFactory({calibre: {name: "9Pb"}}), factories.ammunitionFactory({calibre: {name: "9Pb+"}})]))
            }),

          rest.post('http://localhost/rest/sheets/1/sheetfirearms/', async (req, res, ctx) => {
            return res(ctx.json(Object.assign(await req.json(), {id: 420})))
          }),
        )
        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})
        await waitFor(() => expect(screen.queryByRole("combobox", {busy: true})).toBeNull())

        await user.type(screen.getByRole("combobox", {name: "Firearm"}), "Lug")

        await user.click(await screen.findByText(/Luger/))

        await user.type(screen.getByRole("combobox", {name: "Ammo"}), "9Pb")
        await user.click(await screen.findByText(/9Pb\+/))

        await user.click(screen.getByRole("button", {name: "Add Firearm"}))

        let values = []
        server.use(
          rest.delete('http://localhost/rest/sheets/1/sheetfirearms/420/', async (req, res, ctx) => {
              values.push(true)
              return res(ctx.json({}))
          }),
        )
        await user.click(within(await screen.findByLabelText("Firearm Luger")).getByRole("button", {name: "Remove firearm"}))

        await waitFor(() => expect(screen.queryByLabelText("Firearm Luger")).toBeNull())
        expect(values[0]).toBe(true)
    });

    // // it ("can add weapons", function () {
    // //     // TODO
    // // });
    // //
    // // it ("can remove weapons", function () {
    // //     // TODO
    // // });
    //

    it('can add SP', async function () {
        const user = userEvent.setup()

        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        expect(screen.getByLabelText("Total gained SP").textContent).toEqual("29")

        server.use(
            rest.patch("http://localhost/rest/characters/2/", async (req, res, ctx) => {
                return res(ctx.json(await req.json()))
            }),
        )

        await user.click(screen.getByRole("button", {name: "Add SP"}))

        await waitFor(() => expect(screen.getByLabelText("Total gained SP").textContent).toEqual("35"))
    });

    // // it("handles stamina changes", function (done) {
    // //     var block = factories.statBlockFactory({
    // //         character: factories.characterFactory({cur_wil: 40, cur_ref: 40})
    // //     });
    // //
    // //     block.afterLoad(function () {
    // //
    // //         rest.patch.mockClear();
    // //
    // //         var control = TestUtils.findRenderedComponentWithType(
    // //             block, DamageControl);
    // //
    // //         TestUtils.Simulate.change(control._inputField,
    // //             {target: {value: 8}});
    // //         TestUtils.Simulate.click(control._changeButton);
    // //
    // //         expect(rest.patch.mock.calls[0][1]).toEqual({stamina_damage: 12});
    // //
    // //         done();
    // //     });
    // });
});
