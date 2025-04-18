import React from "react";

import FirearmControl from 'FirearmControl'
import {render, screen, waitFor} from "@testing-library/react";

import {rest} from 'msw'
import {setupServer} from 'msw/node'
import userEvent from '@testing-library/user-event'

import * as factories from './factories'

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

    it('renders ScopeControl', async () => {
        const control = renderFirearm({weapon:
            {scope: {name: "Test Scope"}}});
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        control.getByText("Test Scope")
    });

    it('does not barf without a scope', async () => {
        const control = renderFirearm({weapon:
            {scope: null}});
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        control.getByText("Add a scope")
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
        renderFirearm({
            weapon:
                {
                    id: 19,
                    scope: {name: "Test scope"}
                },
            onChange: spy,
            campaign: 4
        });
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        await user.click(screen.getByRole("combobox", {name: "Scope selection"}))

        await user.click(await screen.findByText(/Fantabulous/))

        expect(spy).toHaveBeenCalledWith({id: 19, scope: newScope})
    });


    it('allows removing scope', async () => {
        const user = userEvent.setup()
        server.use(
            rest.get("http://localhost/rest/scopes/campaign/4/", (req, res, ctx) => {
                return res(ctx.json([
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
            onChange: spy
        });
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))
        const scopeSelector = screen.getByRole("combobox", {name: "Scope selection"})
        await user.click(scopeSelector);

        await user.click(await screen.findByText('Remove scope', {}));

        expect(spy).toHaveBeenCalledWith({id: 19, scope: null})
    });

});
