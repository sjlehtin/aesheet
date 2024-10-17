import React from 'react';
import ScopeControl from 'ScopeControl';

import * as factories from './factories'

import {
    render,
    screen,
    waitForElementToBeRemoved
} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

import {defer} from './testutils'

const server = setupServer(
)

describe('ScopeControl', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    const renderScopeControl = (props) => {
        if (!props) {
            props = {};
        }
        props.scope = factories.scopeFactory(props.scope);
        return render(<ScopeControl {...props}/>);
    };

    it('renders the scope even without a list', async () => {
        const control = renderScopeControl({scope: {name: 'Skubadoo', sight: 700}});

        expect(await screen.findByText(/Skubadoo/)).toBeInTheDocument()
    });

    it('loads the scope selection on mount', async () => {

        let scope = factories.scopeFactory()

        let deferred = defer()

        server.use(
            rest.get("http://localhost/rest/foo/", async (req, res, ctx) => {
                await deferred
                return res(ctx.json([scope]))
            })
        )

        const control = renderScopeControl({
            scope: {name: 'Skubadoo', sight: 700},
            url: "/rest/foo/"});

        // Combobox should be busy until the API call to the server has been completed.
        expect(screen.queryByRole('combobox', {busy: false})).toBeNull()
        screen.getByRole('combobox', {busy: true})

        deferred.resolve();

        await screen.findByRole('combobox', {busy: false})
    });

    it('allows changing the scope', async () => {

        const user = userEvent.setup()

        let scope = factories.scopeFactory({id: 42});
        let newScope = factories.scopeFactory({id: 12});

        server.use(
            rest.get("http://localhost/rest/foo/", async (req, res, ctx) => {
                return res(ctx.json([
                    newScope,
                    Object.assign({}, scope), // Ensure distinct, but equal otherwise, object.
                    factories.scopeFactory({id: 50})]))
            })
        )


        let spy = jest.fn().mockResolvedValue({});

        const control = renderScopeControl({
            scope: scope, url: "/rest/foo/",
            onChange: spy
        });

        const el = await control.findByRole('combobox', {busy: false})

        expect(spy).not.toHaveBeenCalled()

        await user.click(el.querySelector('.rw-picker-caret'));

        let options = await control.findAllByRole('option', {});

        expect(options.length).toEqual(4)

        await user.click(options[1])

        // Check that the control passes the correct value up.
        expect(spy).toHaveBeenCalledWith(newScope)
    });

    it("allows removing scope", async () => {
        const user = userEvent.setup()

        let scope = factories.scopeFactory({name: "current", id: 42});
        let newScope = factories.scopeFactory({name: "New scope", id: 12});

        server.use(
            rest.get("http://localhost/rest/foo/", async (req, res, ctx) => {
                return res(ctx.json([
                    newScope,
                    Object.assign({}, scope, {"name": "Copy"}), // Ensure distinct, but equal otherwise, object.
                    factories.scopeFactory({id: 50})]))
            })
        )

        let spy = jest.fn().mockResolvedValue({});

        renderScopeControl({
            scope: scope,
            url: "/rest/foo/",
            onChange: spy
        });

        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        const scopeSelector = screen.getByRole("combobox", {name: "Scope selection", busy: false})

        await user.click(scopeSelector);

        await user.click(await screen.findByText('Remove scope', {}));

        expect(spy).toHaveBeenCalledWith(null)

    })
});