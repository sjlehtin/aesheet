import React from "react";

import FirearmControl from 'FirearmControl'
import {render, screen, waitFor, within} from "@testing-library/react";

import {rest} from 'msw'
import {setupServer} from 'msw/node'

import * as factories from './factories'
import {testSetup} from "./testutils";

const server = setupServer(
  rest.get('http://localhost/rest/ammunition/firearm/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/scopes/campaign/3/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
)

describe('FirearmControl -- firearms in CC', () => {
    beforeAll(() => {
        server.listen({onUnhandledRequest: 'error'})
        testSetup()
    })
    afterEach(() => {
        server.resetHandlers()
    });
    beforeEach(() => {
        factories.clearAll()
        factories.skillFactory({
            name: "Instinctive fire",
            stat: "DEX",
        })
    })
    afterAll(() => server.close());

    const renderFirearm = (givenProps) => {
        factories.skillFactory({name: "Instinctive fire", stat: "DEX", required_skill: ["Missile weapons"]})
        return render(<FirearmControl inCloseCombat={true} {...factories.firearmControlPropsFactory({
            handlerProps: {character: {cur_ref: 50, cur_fit: 50, cur_int: 60}, skills: givenProps?.skills ?? []},
            weapon: {base: {name: "Assault rifle", stock: 1.5, weapon_class_modifier: 6, duration: 0.3, autofire_rpm: 600, autofire_class: "A", restricted_burst_rounds: 4},
            ammo: {num_dice: 2, dice: 4, extra_damage: 2, leth: 5, plus_leth: 1}}
        })} />)
    }

    function getBurstChecks(burst) {
        const elems = screen.getAllByLabelText(new RegExp(`Burst ${burst} To-Hit`))
        const values = elems.map((el) => {
            return el.textContent
        })
        return values;
    }

    it('renders the control', async () => {
        renderFirearm();
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(screen.getByText(/Sweep fire not available in close combat/)).toBeInTheDocument()
        expect(screen.getByLabelText("ROF").textContent).toEqual("2.11")
        expect(screen.getByLabelText("Damage").textContent).toEqual("2d4+4/7 (+1)")
        expect(screen.getByLabelText("Base check").textContent).toEqual("50")
        expect(screen.getByLabelText("Skill level").textContent).toEqual("0")

        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Contact")
        expect(within(rangeEffect).getByLabelText("Bumping allowed").textContent).toEqual("no")

        expect(getBurstChecks(1)).toEqual(["50", "50", "50", "50", ""]);
        expect(getBurstChecks(2)).toEqual(["42", "42", "42", "42", ""]);
    });

    it('takes Instinctive fire into account', async () => {
        renderFirearm({skills: [{skill: "Instinctive fire", level: 2}]});

        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(screen.getByText(/Sweep fire not available in close combat/)).toBeInTheDocument()
        expect(screen.getByLabelText("ROF").textContent).toEqual("2.50")
        expect(screen.getByLabelText("Damage").textContent).toEqual("2d4+4/7 (+1)")
        expect(screen.getByLabelText("Skill level").textContent).toEqual("2")
        expect(screen.getByLabelText("Base check").textContent).toEqual("60")

        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Contact")
        expect(within(rangeEffect).getByLabelText("Bumping allowed").textContent).toEqual("yes (2)")

        expect(getBurstChecks(1)).toEqual(["60", "60", "60", "60", ""]);
        expect(getBurstChecks(2)).toEqual(["53", "53", "53", "53", ""]);
    });

    // TODO: test for INT modifier for CC actions
});
