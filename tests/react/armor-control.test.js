import React from 'react';

import ArmorControl from 'ArmorControl'

import * as factories from './factories'

import {render, waitFor, waitForElementToBeRemoved, screen, within} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

const server = setupServer(
  rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
)

describe('ArmorControl', function() {
    beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it("can remove the helmet", async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({});

        render(<ArmorControl campaign={2} armor={factories.armorFactory()}
                helm={factories.armorFactory(
                    {name: "Ze Helmet", is_helm: true})}
                onHelmChange={spy}
                             onArmorChange={jest.fn().mockResolvedValue({})}
        />)

        expect(screen.getByText(/Ze Helmet/)).toBeInTheDocument()

        await user.click(screen.getByRole("button", {name: "Edit Armor"}))
        await user.click(screen.getByRole("button", {name: "Remove helmet"}))

        expect(spy).toHaveBeenCalledWith(null);
    });

    it("can remove the armor", async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({});

        render(<ArmorControl campaign={2} armor={factories.armorFactory()}
                helm={factories.armorFactory(
                    {name: "Ze Helmet", is_helm: true})}
                onArmorChange={spy} />)

        await user.click(screen.getByRole("button", {name: "Edit Armor"}))
        await user.click(screen.getByRole("button", {name: "Remove armor"}))

        expect(spy).toHaveBeenCalledWith(null);
    });

    it("accounts for explicit damage reduction from armor quality", async function () {
        // AVERAGE over leth reduction types * 2 /3
        // =-ROUNDUP(POWER(2/3*AVERAGE(AY36:BB36);2);0)
        // => -9 overall leth reduction results in 36 DR
        render(<ArmorControl campaign={2} armor={factories.armorFactory({
            base: factories.armorTemplateFactory({'armor_t_p': -9, 'armor_t_dr': -14}),
            quality: factories.armorQualityFactory({'armor_dr': -3})
        })} />)
        expect(screen.getByLabelText("Armor T DR").textContent).toEqual("-17")
    });

    it("accounts for automatic damage reduction from armor quality", async function () {
        // AVERAGE over leth reduction types * 2 /3
        // =-ROUNDUP(POWER(2/3*AVERAGE(AY36:BB36);2);0)
        // => -9 overall leth reduction results in 36 DR
        render(<ArmorControl campaign={2}
                             armor={factories.armorFactory({
                                 name: 'Power armor',
                                 base: factories.armorTemplateFactory({
                                     'armor_t_p': -9,
                                     'armor_t_s': -9,
                                     'armor_t_b': -9,
                                     'armor_t_r': -9,
                                     'armor_t_dr': -36,
                                     'armor_ra_p': -1.5,
                                     'armor_ra_s': -1.0,
                                     'armor_ra_b': -0.5,
                                     'armor_ra_r': -0.5,
                                     'armor_ra_dr': 0,
                                     'armor_ra_dp': 2,

                                 }),
                                 quality: factories.armorQualityFactory({
                                     'armor_p': -0.5,
                                     'armor_s': -0.5,
                                     'armor_b': -0.5,
                                     'armor_r': -0.5,
                                     'armor_dr': 0,
                                     'dp_multiplier': 1.5
                                 })
                             })}
                             helm={factories.armorFactory({
                                 name: 'Power helmet',
                                 base: factories.armorTemplateFactory({
                                     'armor_h_p': -9,
                                     'armor_h_s': -9,
                                     'armor_h_b': -9,
                                     'armor_h_r': -9,
                                     'armor_h_dr': -36,
                                 }),
                                 quality: factories.armorQualityFactory({
                                     'armor_p': -0.5,
                                     'armor_s': -0.5,
                                     'armor_b': -0.5,
                                     'armor_r': -0.5,
                                     'armor_dr': 0,
                                     'dp_multiplier': 1.5
                                 })
                             })}
        />)
        expect(screen.getByLabelText("Armor T DR").textContent).toEqual("-41")
        expect(screen.getByLabelText("Armor H DR").textContent).toEqual("-41")

        expect(screen.getByLabelText("Armor LL DR").textContent).toEqual("0")
        expect(screen.getByLabelText("Armor LL P").textContent).toEqual("0")

        expect(screen.getByLabelText("Armor RA DR").textContent).toEqual("-1")
        expect(screen.getByLabelText("Armor RA DP").textContent).toEqual("3")
    });

    it("skips automatic damage reduction from armor quality when quality does not affect location", async function () {
        const user = userEvent.setup()

        render(<ArmorControl campaign={2} armor={factories.armorFactory({ name: "FooArmor",
            base: factories.armorTemplateFactory({'armor_t_p': -9.2, 'armor_t_s': -9.2, 'armor_t_b': -9.2, 'armor_t_r': -9.2, 'armor_t_dr': -36, 'armor_t_dp': 16,}),
            quality: factories.armorQualityFactory({'armor_p': 0, 'armor_s': 0, 'armor_b': 0, 'armor_r': 0, 'armor_dr': 0})
        })} />)
        const torsoLocation = screen.getByLabelText("Armor T DR");
        expect(torsoLocation.textContent).toEqual("-36")

        await user.click(torsoLocation)

        const breakdown = screen.getByLabelText("Armor T DR breakdown")

        expect(breakdown).toBeVisible()

        // Find the breakdown row for the armor and check that it has the correct value.
        expect(within(within(breakdown).getByText("FooArmor").closest("tr")).getAllByRole("cell")[1].textContent).toEqual("-36")
    });

    it("takes Hardened Skin edge into account", async function () {
        render(<ArmorControl campaign={2} armor={factories.armorFactory({
            base: factories.armorTemplateFactory({'armor_h_r': 0, 'armor_h_dr': 0, 'armor_t_p': -9.5, 'armor_t_dr': -14}),
            quality: factories.armorQualityFactory({'armor_dr': -3})
        })} handler={factories.skillHandlerFactory({edges: [{edge: "Hardened Skin", level: 1, armor_l:-0.5, armor_dr:-2.0}]})} />)

        expect(screen.getByLabelText("Armor T DR").textContent).toEqual("-19")
        expect(screen.getByLabelText("Armor T P").textContent).toEqual("-10")
        expect(screen.getByLabelText("Armor T R").textContent).toEqual("0")
        expect(screen.getByLabelText("Armor H P").textContent).toEqual("0")
        expect(screen.getByLabelText("Armor H DR").textContent).toEqual("-2")
    })
});