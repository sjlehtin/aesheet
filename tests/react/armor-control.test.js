import React from 'react';

import ArmorControl from 'ArmorControl'

import factories from './factories'

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
                onHelmChange={spy} />)

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
});