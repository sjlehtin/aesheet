import React from 'react';

import {screen, render, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AddTransientEffectControl from 'AddTransientEffectControl';
import * as factories from './factories'
import {setupServer} from "msw/node";
import {rest} from "msw";

const server = setupServer(
  rest.get('http://localhost/rest/transienteffects/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([factories.transientEffectFactory({name: "Amazing Effect", id: 444})]))
  }),
)

describe('AddTransientEffectControl', function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it("validates input and allows existing effects to be added", async function () {
        // var control = getAddTransientEffectControl();
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})

        render(<AddTransientEffectControl campaign={2} onAdd={spy} />)

        expect(screen.getByRole("button", {name: "Add Effect"})).toBeDisabled()

        const levelInput = within(screen.getByLabelText("Add transient effect")).getByRole("combobox")

        await user.type(levelInput, "foo")
        expect(screen.getByRole("button", {name: "Add Effect"})).toBeDisabled()

        await user.clear(levelInput)
        await user.type(levelInput, "mazin")

        await user.click(screen.getByText(/Amazing/))
        await user.click(screen.getByRole("button", {name: "Add Effect"}))

        expect(spy).toHaveBeenCalled()
        expect(spy.mock.lastCall[0].id).toEqual(444)
    });
});