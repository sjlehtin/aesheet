import FirearmControl from 'FirearmControl'
import {render} from "@testing-library/react";
import React from "react";

import {rest} from 'msw'
import {setupServer} from 'msw/node'
import userEvent from '@testing-library/user-event'

const factories = require('./factories');

const server = setupServer(
  rest.get('http://localhost/rest/ammunition/firearm/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/scopes/campaign/3/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
)

describe('FirearmControl -- ScopeControl', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    const renderFirearm = (givenProps) => {
        return render(<FirearmControl {...factories.firearmControlPropsFactory(givenProps)} />)
    }

    it('renders ScopeControl', () => {
        const control = renderFirearm({weapon:
            {scope: {name: "Test Scope"}}});
        control.getByText("Test Scope")
    });

    it('does not barf without a scope', () => {
        const control = renderFirearm({weapon:
            {scope: null}});
        control.getByRole("button", {name: "Remove scope"})
        control.getByText("Add a scope")
    });

    it('shows a disabled remove button without a scope', () => {
        const control = renderFirearm({weapon:
            {scope: null}});
        expect(control.getByRole("button", {name: "Remove scope"})).toBeDisabled()
    });

    it('integrates ScopeControl for changing scope', async () => {
        const user = userEvent.setup()

        const newScope = factories.scopeFactory({id: 42, name: "Fantabulous fahrseher"});
        server.use(
            rest.get("http://localhost/rest/scopes/campaign/4/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.scopeFactory({id: 21, name: "Foo"}),
                    newScope,
                ]))
            })
        )
        const spy = jest.fn().mockResolvedValue({})
        const control = renderFirearm({
            weapon:
                {
                    id: 19,
                    scope: {name: "Test scope"}
                },
            onChange: spy,
            campaign: 4
        });
        await user.click(control.getByRole("combobox", {name: "Scope selection"}))

        await user.click(await control.findByText(/Fantabulous/))

        expect(spy).toHaveBeenCalledWith({id: 19, scope: newScope})
    });


    it('allows removing scope', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const control = renderFirearm({
            weapon:
                {
                    id: 19,
                    scope: {name: "Test scope"}
                },
            onChange: spy
        });
        await user.click(control.getByRole("button", {name: "Remove scope"}))
        expect(spy).toHaveBeenCalledWith({id: 19, scope: null})
    });

});
