import React from 'react';

import StatBlock from 'StatBlock'

import * as factories from './factories'

import {render, waitFor, waitForElementToBeRemoved, screen, within} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

const server = setupServer(
  rest.get('http://localhost/rest/sheets/1/', (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()))
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
  rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
)

describe('stat block edge handling', function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it("can load the edge", async () => {
        server.use(
            rest.get("http://localhost/rest/characters/2/characteredges/", (req, res, ctx) => {
            return res(ctx.json([factories.characterEdgeFactory({edge: {edge: "Acute Vision", level: 1}})]))
        })
        )
        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        expect(await screen.findByText(/Acute Vision 1/i)).toBeInTheDocument()
    });

    it("can handle the error when changing the edge", async () => {
        const characterEdge = factories.characterEdgeFactory({
            edge: {
                edge: "Acute Vision",
                level: 1
            }
        });
        const user = userEvent.setup()
        server.use(
            rest.get("http://localhost/rest/characters/2/characteredges/", (req, res, ctx) => {
                return res(ctx.json([characterEdge]))
            })
        )
        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        // Failure case.
        server.use(
            rest.patch(`http://localhost/rest/characters/2/characteredges/${characterEdge.id}/`, (req, res, ctx) => {
                return res(ctx.status(403))
            })
        )
        await waitFor(() => within(document.getElementById("edges")).getByRole("checkbox", {name: /Ignore cost/i}))
        await user.click(await within(document.getElementById("edges")).getByRole("checkbox", {name: /Ignore cost/i}))

        // TODO: error message should be going somewhere?

        // checkbox should remain unchecked.
        expect(screen.getByRole("checkbox", {name: /Ignore cost/i}).checked).toBe(false)
    })

    it("can change the edge", async () => {
        const characterEdge = factories.characterEdgeFactory({
            edge: {
                edge: "Acute Vision",
                level: 1
            }
        });
        const user = userEvent.setup()
        server.use(
            rest.get("http://localhost/rest/characters/2/characteredges/", (req, res, ctx) => {
                return res(ctx.json([characterEdge]))
            })
        )
        render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        // Successful API call.
        server.use(
            rest.patch(`http://localhost/rest/characters/2/characteredges/${characterEdge.id}/`, async (req, res, ctx) => {
                const data = await req.json()
                return res(ctx.json(data))
            })
        )

        await waitFor(() => within(document.getElementById("edges")).getByRole("checkbox", {name: /Ignore cost/i}))
        await user.click(await within(document.getElementById("edges")).getByRole("checkbox", {name: /Ignore cost/i}))

        await waitFor(() => expect(screen.getByRole("checkbox", {name: /Ignore cost/i}).checked).toBe(true), {timeout: 3000} )

        expect(screen.getByRole("checkbox", {name: /Ignore cost/i}).checked).toBe(true)
    });

    it("can remove the edge", async () => {
        const characterEdge = factories.characterEdgeFactory({edge: {edge: "Acute Vision", level: 1}});
        const user = userEvent.setup()
        server.use(
            rest.get("http://localhost/rest/characters/2/characteredges/", (req, res, ctx) => {
                return res(ctx.json([characterEdge]))
            })
        )
        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        server.use(
            rest.delete(`http://localhost/rest/characters/2/characteredges/${characterEdge.id}/`, (req, res, ctx) => {
                return res(ctx.status(204))
            })
        )
        await user.click(await within(document.getElementById("edges")).findByRole("button", {name: /Remove/i}))

        await waitFor(() => expect(screen.queryByText(/Acute Vision 1/i)).toBe(null))
    });
});